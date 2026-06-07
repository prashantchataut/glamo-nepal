import type { Client, InValue } from '@libsql/client'
import { AppError, handleDbError, assertFound, fromSqliteBool } from '../../utils/turso-helpers'
import { toDisplayPrice } from '../../utils/price'

interface CartItemRow {
  id: string
  user_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  created_at: string
  updated_at: string
}

interface ProductRow {
  id: string
  name: string
  slug: string
  base_price: number
  sale_price: number | null
  is_active: number
  track_inventory: number
  stock_quantity: number
}

interface ProductImageRow {
  product_id: string
  url: string
  is_primary: number
}

interface VariantRow {
  id: string
  name: string
  price: number
  sale_price: number | null
  stock_quantity: number
  is_active: number
}

const MAX_QUANTITY = 10

function formatCartItem(
  item: CartItemRow,
  product: ProductRow,
  variant: VariantRow | null,
  imageUrl: string | null
) {
  const effectivePrice = variant
    ? (variant.sale_price ?? variant.price)
    : (product.sale_price ?? product.base_price)

  return {
    id: item.id,
    productId: item.product_id,
    variantId: item.variant_id,
    quantity: item.quantity,
    product: {
      name: product.name,
      slug: product.slug,
      basePrice: toDisplayPrice(product.base_price),
      salePrice: product.sale_price !== null ? toDisplayPrice(product.sale_price) : null,
      imageUrl,
    },
    variant: variant
      ? {
          name: variant.name,
          price: toDisplayPrice(variant.price),
          salePrice: variant.sale_price !== null ? toDisplayPrice(variant.sale_price) : null,
        }
      : null,
    unitPrice: toDisplayPrice(effectivePrice),
    totalPrice: toDisplayPrice(effectivePrice * item.quantity),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }
}

export async function getCart(db: Client, userId: string) {
  const itemsResult = await db.execute({
    sql: 'SELECT * FROM cart_items WHERE user_id = ? ORDER BY created_at ASC',
    args: [userId],
  })

  if (itemsResult.rows.length === 0) {
    return { items: [], total: 0 }
  }

  const cartItems = itemsResult.rows as unknown as CartItemRow[]
  const productIds = Array.from(new Set(cartItems.map((i) => i.product_id)))

  const placeholders = productIds.map(() => '?').join(',')
  const productsResult = await db.execute({
    sql: `SELECT id, name, slug, base_price, sale_price, is_active, track_inventory, stock_quantity FROM products WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
    args: productIds,
  })
  const productMap = new Map((productsResult.rows as unknown as ProductRow[]).map((p) => [p.id, p]))

  const imagesResult = await db.execute({
    sql: `SELECT product_id, url, is_primary FROM product_images WHERE product_id IN (${placeholders}) AND is_primary = 1`,
    args: productIds,
  })
  const imageMap = new Map((imagesResult.rows as unknown as ProductImageRow[]).map((i) => [i.product_id, i.url]))

  const variantIds = cartItems.filter((i) => i.variant_id).map((i) => i.variant_id!)

  let variantMap = new Map<string, VariantRow>()
  if (variantIds.length > 0) {
    const variantPlaceholders = variantIds.map(() => '?').join(',')
    const variantsResult = await db.execute({
      sql: `SELECT id, name, price, sale_price, stock_quantity, is_active FROM product_variants WHERE id IN (${variantPlaceholders}) AND deleted_at IS NULL`,
      args: variantIds,
    })
    variantMap = new Map((variantsResult.rows as unknown as VariantRow[]).map((v) => [v.id, v]))
  }

  let total = 0
  const formatted = cartItems.map((item) => {
    const product = productMap.get(item.product_id)
    const variant = item.variant_id ? (variantMap.get(item.variant_id) ?? null) : null
    const imageUrl = imageMap.get(item.product_id) || null

    if (!product) return null

    const effectivePrice = variant
      ? (variant.sale_price ?? variant.price)
      : (product.sale_price ?? product.base_price)

    total += effectivePrice * item.quantity

    return formatCartItem(item, product, variant, imageUrl)
  }).filter(Boolean)

  return { items: formatted, total: toDisplayPrice(total) }
}

export async function addItem(db: Client, userId: string, data: { productId: string; variantId?: string; quantity: number }) {
  const productResult = await db.execute({
    sql: 'SELECT id, name, slug, base_price, sale_price, is_active, track_inventory, stock_quantity FROM products WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    args: [data.productId],
  })
  if (productResult.rows.length === 0) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND')
  const product = productResult.rows[0] as unknown as ProductRow
  if (!fromSqliteBool(product.is_active)) throw new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE')

  let variant: VariantRow | null = null
  if (data.variantId) {
    const variantResult = await db.execute({
      sql: 'SELECT id, name, price, sale_price, stock_quantity, is_active FROM product_variants WHERE id = ? AND product_id = ? AND deleted_at IS NULL LIMIT 1',
      args: [data.variantId, data.productId],
    })
    if (variantResult.rows.length === 0) throw new AppError('Variant not found', 404, 'VARIANT_NOT_FOUND')
    const v = variantResult.rows[0] as unknown as VariantRow
    if (!fromSqliteBool(v.is_active)) throw new AppError('Variant is not available', 400, 'VARIANT_UNAVAILABLE')
    variant = v
  }

  const availableStock = variant ? variant.stock_quantity : product.stock_quantity
  if (fromSqliteBool(product.track_inventory) && availableStock < data.quantity) {
    throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK')
  }

  let existingQuery: string
  let existingArgs: InValue[]
  if (data.variantId) {
    existingQuery = 'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND variant_id = ? LIMIT 1'
    existingArgs = [userId, data.productId, data.variantId]
  } else {
    existingQuery = 'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND variant_id IS NULL LIMIT 1'
    existingArgs = [userId, data.productId]
  }

  const existingResult = await db.execute({ sql: existingQuery, args: existingArgs })

  if (existingResult.rows.length > 0) {
    const existing = existingResult.rows[0] as unknown as CartItemRow
    const newQuantity = Math.min(existing.quantity + data.quantity, MAX_QUANTITY)
    const updateResult = await db.execute({
      sql: 'UPDATE cart_items SET quantity = ? WHERE id = ?',
      args: [newQuantity, existing.id],
    })

    const refreshed = await db.execute({
      sql: 'SELECT id, quantity FROM cart_items WHERE id = ?',
      args: [existing.id],
    })
    const updated = refreshed.rows[0] as unknown as CartItemRow
    return { id: updated.id, quantity: updated.quantity, action: 'updated' as const }
  }

  const insertId = crypto.randomUUID()
  try {
    await db.execute({
      sql: 'INSERT INTO cart_items (id, user_id, product_id, variant_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))',
      args: [insertId, userId, data.productId, data.variantId || null, Math.min(data.quantity, MAX_QUANTITY)],
    })
  } catch (error) {
    handleDbError(error, 'addItem.insert')
  }

  return { id: insertId, quantity: Math.min(data.quantity, MAX_QUANTITY), action: 'created' as const }
}

export async function updateItem(db: Client, userId: string, itemId: string, quantity: number) {
  const fetchResult = await db.execute({
    sql: 'SELECT * FROM cart_items WHERE id = ? AND user_id = ? LIMIT 1',
    args: [itemId, userId],
  })
  if (fetchResult.rows.length === 0) throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND')

  const clampedQuantity = Math.min(quantity, MAX_QUANTITY)

  try {
    await db.execute({
      sql: 'UPDATE cart_items SET quantity = ? WHERE id = ?',
      args: [clampedQuantity, itemId],
    })
  } catch (error) {
    handleDbError(error, 'updateItem')
  }

  return { id: itemId, quantity: clampedQuantity }
}

export async function removeItem(db: Client, userId: string, itemId: string) {
  const fetchResult = await db.execute({
    sql: 'SELECT id FROM cart_items WHERE id = ? AND user_id = ? LIMIT 1',
    args: [itemId, userId],
  })
  if (fetchResult.rows.length === 0) throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND')

  try {
    await db.execute({
      sql: 'DELETE FROM cart_items WHERE id = ?',
      args: [itemId],
    })
  } catch (error) {
    handleDbError(error, 'removeItem')
  }

  return { deleted: true }
}

export async function clearCart(db: Client, userId: string) {
  try {
    await db.execute({
      sql: 'DELETE FROM cart_items WHERE user_id = ?',
      args: [userId],
    })
  } catch (error) {
    handleDbError(error, 'clearCart')
  }

  return { cleared: true }
}

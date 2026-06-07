import type { Client } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool } from '../../utils/turso-helpers'
import { toDisplayPrice } from '../../utils/price'

interface WishlistItemRow {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

interface ProductRow {
  id: string
  name: string
  slug: string
  base_price: number
  sale_price: number | null
  is_active: number
}

interface ProductImageRow {
  product_id: string
  url: string
  is_primary: number
}

function formatWishlistItem(
  item: WishlistItemRow,
  product: ProductRow,
  imageUrl: string | null
) {
  return {
    id: item.id,
    productId: item.product_id,
    product: {
      name: product.name,
      slug: product.slug,
      basePrice: toDisplayPrice(product.base_price),
      salePrice: product.sale_price !== null ? toDisplayPrice(product.sale_price) : null,
      imageUrl,
      isActive: fromSqliteBool(product.is_active),
    },
    createdAt: item.created_at,
  }
}

export async function getWishlist(db: Client, userId: string) {
  const itemsResult = await db.execute({
    sql: 'SELECT * FROM wishlist_items WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  })

  if (itemsResult.rows.length === 0) {
    return { items: [] }
  }

  const wishlistItems = itemsResult.rows as unknown as WishlistItemRow[]
  const productIds = Array.from(new Set(wishlistItems.map((i) => i.product_id)))

  const placeholders = productIds.map(() => '?').join(',')
  const productsResult = await db.execute({
    sql: `SELECT id, name, slug, base_price, sale_price, is_active FROM products WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
    args: productIds,
  })
  const productMap = new Map((productsResult.rows as unknown as ProductRow[]).map((p) => [p.id, p]))

  const imagesResult = await db.execute({
    sql: `SELECT product_id, url, is_primary FROM product_images WHERE product_id IN (${placeholders}) AND is_primary = 1`,
    args: productIds,
  })
  const imageMap = new Map((imagesResult.rows as unknown as ProductImageRow[]).map((i) => [i.product_id, i.url]))

  const formatted = wishlistItems.map((item) => {
    const product = productMap.get(item.product_id)
    if (!product) return null
    const imageUrl = imageMap.get(item.product_id) || null
    return formatWishlistItem(item, product, imageUrl)
  }).filter(Boolean)

  return { items: formatted }
}

export async function addItem(db: Client, userId: string, productId: string) {
  const productResult = await db.execute({
    sql: 'SELECT id FROM products WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    args: [productId],
  })
  if (productResult.rows.length === 0) {
    throw new Error('PRODUCT_NOT_FOUND')
  }

  const existingResult = await db.execute({
    sql: 'SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ? LIMIT 1',
    args: [userId, productId],
  })

  if (existingResult.rows.length > 0) {
    return { id: (existingResult.rows[0] as any).id, productId, action: 'already_exists' as const }
  }

  const insertId = crypto.randomUUID()
  try {
    await db.execute({
      sql: `INSERT INTO wishlist_items (id, user_id, product_id, created_at) VALUES (?, ?, ?, datetime('now'))`,
      args: [insertId, userId, productId],
    })
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint')) {
      return { id: null, productId, action: 'already_exists' as const }
    }
    handleDbError(error, 'addItem')
  }

  return { id: insertId, productId, action: 'created' as const }
}

export async function removeItem(db: Client, userId: string, productId: string) {
  try {
    await db.execute({
      sql: 'DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?',
      args: [userId, productId],
    })
  } catch (error) {
    handleDbError(error, 'removeItem')
  }

  return { removed: true }
}

export async function checkItem(db: Client, userId: string, productId: string) {
  const result = await db.execute({
    sql: 'SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ? LIMIT 1',
    args: [userId, productId],
  })

  return { inWishlist: result.rows.length > 0 }
}

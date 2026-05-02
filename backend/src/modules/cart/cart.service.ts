import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'
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
  is_active: boolean
  track_inventory: boolean
  stock_quantity: number
}

interface ProductImageRow {
  product_id: string
  url: string
  is_primary: boolean
}

interface VariantRow {
  id: string
  name: string
  price: number
  sale_price: number | null
  stock_quantity: number
  is_active: boolean
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

export async function getCart(supabase: SupabaseClient, userId: string) {
  const { data: items, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) handleSupabaseError(error, 'getCart')

  if (!items || items.length === 0) {
    return { items: [], total: 0 }
  }

  const cartItems = items as CartItemRow[]
  const productIds = [...new Set(cartItems.map((i) => i.product_id))]

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, slug, base_price, sale_price, is_active, track_inventory, stock_quantity')
    .in('id', productIds)

  if (productsError) handleSupabaseError(productsError, 'getCart.products')

  const productMap = new Map((products as ProductRow[]).map((p) => [p.id, p]))

  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('product_id, url, is_primary')
    .in('product_id', productIds)
    .eq('is_primary', true)

  if (imagesError) handleSupabaseError(imagesError, 'getCart.images')

  const imageMap = new Map((images as ProductImageRow[]).map((i) => [i.product_id, i.url]))

  const variantIds = cartItems.filter((i) => i.variant_id).map((i) => i.variant_id!)

  let variantMap = new Map<string, VariantRow>()
  if (variantIds.length > 0) {
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, name, price, sale_price, stock_quantity, is_active')
      .in('id', variantIds)

    if (variantsError) handleSupabaseError(variantsError, 'getCart.variants')
    variantMap = new Map((variants as VariantRow[]).map((v) => [v.id, v]))
  }

  let total = 0
  const formatted = cartItems.map((item) => {
    const product = productMap.get(item.product_id)
    const variant = item.variant_id ? (variantMap.get(item.variant_id) ?? null) : null
    const imageUrl = imageMap.get(item.product_id) || null

    if (!product) {
      return null
    }

    const effectivePrice = variant
      ? (variant.sale_price ?? variant.price)
      : (product.sale_price ?? product.base_price)

    total += effectivePrice * item.quantity

    return formatCartItem(item, product, variant, imageUrl)
  }).filter(Boolean)

  return { items: formatted, total: toDisplayPrice(total) }
}

export async function addItem(supabase: SupabaseClient, userId: string, data: { productId: string; variantId?: string; quantity: number }) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, slug, base_price, sale_price, is_active, track_inventory, stock_quantity')
    .eq('id', data.productId)
    .single<ProductRow>()

  if (productError) handleSupabaseError(productError, 'addItem.product')
  if (!product) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND')
  if (!product.is_active) throw new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE')

  let variant: VariantRow | null = null
  if (data.variantId) {
    const { data: v, error: variantError } = await supabase
      .from('product_variants')
      .select('id, name, price, sale_price, stock_quantity, is_active')
      .eq('id', data.variantId)
      .eq('product_id', data.productId)
      .single<VariantRow>()

    if (variantError) handleSupabaseError(variantError, 'addItem.variant')
    if (!v) throw new AppError('Variant not found', 404, 'VARIANT_NOT_FOUND')
    if (!v.is_active) throw new AppError('Variant is not available', 400, 'VARIANT_UNAVAILABLE')
    variant = v
  }

  const availableStock = variant ? variant.stock_quantity : product.stock_quantity
  if (product.track_inventory && availableStock < data.quantity) {
    throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK')
  }

  const filter: Record<string, string> = { user_id: userId, product_id: data.productId }
  if (data.variantId) {
    filter.variant_id = data.variantId
  }

  let existingQuery = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', data.productId)

  if (data.variantId) {
    existingQuery = existingQuery.eq('variant_id', data.variantId)
  } else {
    existingQuery = existingQuery.is('variant_id', null)
  }

  const { data: existing } = await existingQuery.maybeSingle<CartItemRow>()

  if (existing) {
    const newQuantity = Math.min(existing.quantity + data.quantity, MAX_QUANTITY)
    const { data: updated, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', existing.id)
      .select()
      .single<CartItemRow>()

    if (updateError) handleSupabaseError(updateError, 'addItem.update')
    return { id: updated!.id, quantity: updated!.quantity, action: 'updated' }
  }

  const { data: cartItem, error: insertError } = await supabase
    .from('cart_items')
    .insert({
      user_id: userId,
      product_id: data.productId,
      variant_id: data.variantId || null,
      quantity: Math.min(data.quantity, MAX_QUANTITY),
    })
    .select()
    .single<CartItemRow>()

  if (insertError) handleSupabaseError(insertError, 'addItem.insert')

  return { id: cartItem!.id, quantity: cartItem!.quantity, action: 'created' }
}

export async function updateItem(supabase: SupabaseClient, userId: string, itemId: string, quantity: number) {
  const { data: existing, error: fetchError } = await supabase
    .from('cart_items')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single<CartItemRow>()

  if (fetchError) handleSupabaseError(fetchError, 'updateItem.fetch')
  if (!existing) throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND')

  const clampedQuantity = Math.min(quantity, MAX_QUANTITY)

  const { data: updated, error } = await supabase
    .from('cart_items')
    .update({ quantity: clampedQuantity })
    .eq('id', itemId)
    .select()
    .single<CartItemRow>()

  if (error) handleSupabaseError(error, 'updateItem')

  return { id: updated!.id, quantity: updated!.quantity }
}

export async function removeItem(supabase: SupabaseClient, userId: string, itemId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('cart_items')
    .select('id')
    .eq('id', itemId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) handleSupabaseError(fetchError, 'removeItem.fetch')
  if (!existing) throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND')

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)

  if (error) handleSupabaseError(error, 'removeItem')

  return { deleted: true }
}

export async function clearCart(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)

  if (error) handleSupabaseError(error, 'clearCart')

  return { cleared: true }
}
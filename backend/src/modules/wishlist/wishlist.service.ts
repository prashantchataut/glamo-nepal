import type { SupabaseClient } from '@supabase/supabase-js'
import { handleSupabaseError } from '../../utils/supabase'
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
  is_active: boolean
}

interface ProductImageRow {
  product_id: string
  url: string
  is_primary: boolean
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
      isActive: product.is_active,
    },
    createdAt: item.created_at,
  }
}

export async function getWishlist(supabase: SupabaseClient, userId: string) {
  const { data: items, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) handleSupabaseError(error, 'getWishlist')

  if (!items || items.length === 0) {
    return { items: [] }
  }

  const wishlistItems = items as WishlistItemRow[]
  const productIds = [...new Set(wishlistItems.map((i) => i.product_id))]

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, slug, base_price, sale_price, is_active')
    .in('id', productIds)

  if (productsError) handleSupabaseError(productsError, 'getWishlist.products')

  const productMap = new Map((products as ProductRow[]).map((p) => [p.id, p]))

  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('product_id, url, is_primary')
    .in('product_id', productIds)
    .eq('is_primary', true)

  if (imagesError) handleSupabaseError(imagesError, 'getWishlist.images')

  const imageMap = new Map((images as ProductImageRow[]).map((i) => [i.product_id, i.url]))

  const formatted = wishlistItems.map((item) => {
    const product = productMap.get(item.product_id)
    if (!product) return null
    const imageUrl = imageMap.get(item.product_id) || null
    return formatWishlistItem(item, product, imageUrl)
  }).filter(Boolean)

  return { items: formatted }
}

export async function addItem(supabase: SupabaseClient, userId: string, productId: string) {
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .maybeSingle()

  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND')
  }

  const { data: existing } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    return { id: existing.id, productId, action: 'already_exists' }
  }

  const { data: item, error } = await supabase
    .from('wishlist_items')
    .insert({
      user_id: userId,
      product_id: productId,
    })
    .select()
    .single<WishlistItemRow>()

  if (error) {
    if (error.code === '23505') {
      return { id: null, productId, action: 'already_exists' }
    }
    handleSupabaseError(error, 'addItem')
  }

  return { id: item!.id, productId, action: 'created' }
}

export async function removeItem(supabase: SupabaseClient, userId: string, productId: string) {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) handleSupabaseError(error, 'removeItem')

  return { removed: true }
}

export async function checkItem(supabase: SupabaseClient, userId: string, productId: string) {
  const { data: existing } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  return { inWishlist: !!existing }
}
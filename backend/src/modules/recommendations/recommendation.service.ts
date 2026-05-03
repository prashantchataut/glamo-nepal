import type { SupabaseClient } from '@supabase/supabase-js'
import { handleSupabaseError } from '../../utils/supabase'

interface RecommendationProduct {
  id: string
  name: string
  slug: string
  brand_id: string | null
  category_id: string
  base_price: number
  sale_price: number | null
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
  is_featured: boolean
  tags: string[] | null
  reason: string
  reason_label: string
}

interface TrendingProduct {
  id: string
  name: string
  slug: string
  brand_id: string | null
  category_id: string
  base_price: number
  sale_price: number | null
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
  is_featured: boolean
  tags: string[] | null
  trending_score: number
  reason: string
  reason_label: string
}

export async function getRecommendations(
  context: string,
  productId: string | undefined,
  sessionId: string,
  userId: string | undefined,
  limit: number,
  supabase: SupabaseClient
) {
  const { data, error } = await supabase.rpc('get_recommendations', {
    p_context: context,
    p_product_id: productId || null,
    p_session_id: sessionId,
    p_user_id: userId || null,
    p_limit: limit,
  })

  if (error) handleSupabaseError(error, 'getRecommendations')

  const products = (data || []) as RecommendationProduct[]

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brand_id,
    categoryId: p.category_id,
    basePrice: p.base_price,
    salePrice: p.sale_price,
    stockQuantity: p.stock_quantity,
    lowStockThreshold: p.low_stock_threshold,
    isActive: p.is_active,
    isFeatured: p.is_featured,
    tags: p.tags || [],
    reason: p.reason,
    reasonLabel: p.reason_label,
  }))
}

export async function getTrending(
  window: string,
  category: string | undefined,
  limit: number,
  supabase: SupabaseClient
) {
  const { data, error } = await supabase.rpc('get_trending', {
    p_window: window,
    p_category: category || null,
    p_limit: limit,
  })

  if (error) handleSupabaseError(error, 'getTrending')

  const products = (data || []) as TrendingProduct[]

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brand_id,
    categoryId: p.category_id,
    basePrice: p.base_price,
    salePrice: p.sale_price,
    stockQuantity: p.stock_quantity,
    lowStockThreshold: p.low_stock_threshold,
    isActive: p.is_active,
    isFeatured: p.is_featured,
    tags: p.tags || [],
    trendingScore: p.trending_score,
    reason: p.reason,
    reasonLabel: p.reason_label,
  }))
}
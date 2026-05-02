import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'
import { parsePagination, buildPaginationResult } from '../../utils/pagination'
import { toDisplayPrice } from '../../utils/price'

interface ProductRow {
  id: string
  name: string
  slug: string
  base_price: number
  cost_price: number
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
  category_name: string | null
}

interface VariantRow {
  id: string
  product_id: string
  name: string
  price: number
  sale_price: number | null
  stock_quantity: number
  is_active: boolean
  deleted_at: string | null
}

interface LogRow {
  id: string
  product_id: string
  variant_id: string | null
  change_type: string
  quantity: number
  previous_stock: number
  new_stock: number
  reason: string | null
  performed_by: string | null
  created_at: string
  product_name?: string
  variant_name?: string | null
}

export async function getStockReport(
  supabase: SupabaseClient,
  filters?: { lowStockOnly?: boolean; outOfStockOnly?: boolean; page?: number; limit?: number }
) {
  let query = supabase
    .from('products')
    .select('id, name, slug, base_price, cost_price, stock_quantity, low_stock_threshold, is_active, categories(name)', { count: 'exact' })
    .is('deleted_at', null)
    .order('name', { ascending: true })

  const { data: products, error: prodError, count } = await query

  if (prodError) handleSupabaseError(prodError, 'getStockReport')

  const productList = (products || []) as any[]

  const productIds = productList.map((p: any) => p.id)

  let variants: any[] = []
  if (productIds.length > 0) {
    const { data: variantData, error: varError } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productIds)
      .is('deleted_at', null)
      .eq('is_active', true)

    if (varError) handleSupabaseError(varError, 'getStockReport.variants')
    variants = variantData || []
  }

  const filteredProducts = productList.filter((p: any) => {
    if (filters?.lowStockOnly && !(p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold)) return false
    if (filters?.outOfStockOnly && p.stock_quantity !== 0) return false
    return true
  })

  const inStock = productList.filter((p: any) => p.stock_quantity > p.low_stock_threshold)
  const lowStock = productList.filter((p: any) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold)
  const outOfStock = productList.filter((p: any) => p.stock_quantity === 0)

  const totalValue = productList.reduce((sum: number, p: any) => sum + p.cost_price * p.stock_quantity, 0)

  const byCategory: Record<string, { count: number; totalStock: number; totalValue: number }> = {}
  for (const p of productList) {
    const cat = p.categories?.name || 'Uncategorized'
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, totalStock: 0, totalValue: 0 }
    }
    byCategory[cat].count++
    byCategory[cat].totalStock += p.stock_quantity
    byCategory[cat].totalValue += p.cost_price * p.stock_quantity
  }

  const formattedProducts = filteredProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    basePrice: toDisplayPrice(p.base_price),
    costPrice: toDisplayPrice(p.cost_price),
    stockQuantity: p.stock_quantity,
    lowStockThreshold: p.low_stock_threshold,
    isActive: p.is_active,
    categoryName: p.categories?.name || null,
    status:
      p.stock_quantity === 0
        ? 'out_of_stock'
        : p.stock_quantity <= p.low_stock_threshold
          ? 'low_stock'
          : 'in_stock',
  }))

  const formattedVariants = variants.map((v: any) => ({
    id: v.id,
    productId: v.product_id,
    name: v.name,
    price: toDisplayPrice(v.price),
    salePrice: v.sale_price ? toDisplayPrice(v.sale_price) : null,
    stockQuantity: v.stock_quantity,
  }))

  return {
    products: formattedProducts,
    variants: formattedVariants,
    summary: {
      total: productList.length,
      inStock: inStock.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      totalValue: toDisplayPrice(totalValue),
    },
    byCategory: Object.entries(byCategory).map(([name, data]) => ({
      name,
      count: data.count,
      totalStock: data.totalStock,
      totalValue: toDisplayPrice(data.totalValue),
    })),
  }
}

export async function getLowStockAlerts(supabase: SupabaseClient) {
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, slug, stock_quantity, low_stock_threshold, is_active, categories(name)')
    .eq('is_active', true)
    .is('deleted_at', null)

  if (prodError) handleSupabaseError(prodError, 'getLowStockAlerts')

  const lowStockProducts = ((products || []) as any[]).filter(
    (p: any) => p.stock_quantity <= p.low_stock_threshold
  )

  const productIds = lowStockProducts.map((p: any) => p.id)

  let variants: any[] = []
  if (productIds.length > 0) {
    const { data: variantData, error: varError } = await supabase
      .from('product_variants')
      .select('id, product_id, name, stock_quantity, is_active, products(name, slug, low_stock_threshold)')
      .in('product_id', productIds)
      .eq('is_active', true)
      .is('deleted_at', null)

    if (varError) handleSupabaseError(varError, 'getLowStockAlerts.variants')

    variants = (variantData || []).filter((v: any) => v.stock_quantity <= (v.products?.low_stock_threshold || 0))
  }

  const formattedProducts = lowStockProducts
    .sort((a: any, b: any) => a.stock_quantity - b.stock_quantity)
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      stockQuantity: p.stock_quantity,
      lowStockThreshold: p.low_stock_threshold,
      categoryName: p.categories?.name || null,
      type: 'product' as const,
      urgency:
        p.stock_quantity === 0
          ? 'critical'
          : p.stock_quantity <= Math.floor(p.low_stock_threshold / 2)
            ? 'high'
            : 'medium',
    }))

  const formattedVariants = variants.map((v: any) => ({
    id: v.id,
    productId: v.product_id,
    name: v.name,
    productName: v.products?.name,
    productSlug: v.products?.slug,
    stockQuantity: v.stock_quantity,
    lowStockThreshold: v.products?.low_stock_threshold,
    type: 'variant' as const,
    urgency:
      v.stock_quantity === 0
        ? 'critical'
        : v.stock_quantity <= Math.floor((v.products?.low_stock_threshold || 0) / 2)
          ? 'high'
          : 'medium',
  }))

  return {
    products: formattedProducts,
    variants: formattedVariants,
    totalAlerts: formattedProducts.length + formattedVariants.length,
  }
}

export async function getInventoryLogs(
  supabase: SupabaseClient,
  filters: {
    productId?: string
    changeType?: string
    startDate?: string
    endDate?: string
    page: number
    limit: number
  }
) {
  let query = supabase
    .from('inventory_logs')
    .select('*, products(name), product_variants(name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.productId) {
    query = query.eq('product_id', filters.productId)
  }
  if (filters.changeType) {
    query = query.eq('change_type', filters.changeType)
  }
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate)
  }

  const { page, limit, skip } = parsePagination({ page: String(filters.page), limit: String(filters.limit) })
  query = query.range(skip, skip + limit - 1)

  const { data, error, count } = await query

  if (error) handleSupabaseError(error, 'getInventoryLogs')

  const logs = (data || []).map((log: any) => ({
    id: log.id,
    productId: log.product_id,
    variantId: log.variant_id,
    changeType: log.change_type,
    quantity: log.quantity,
    previousStock: log.previous_stock,
    newStock: log.new_stock,
    reason: log.reason,
    performedBy: log.performed_by,
    createdAt: log.created_at,
    productName: log.products?.name ?? null,
    variantName: log.product_variants?.name ?? null,
  }))

  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}
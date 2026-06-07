import type { Client } from '@libsql/client'
import { handleDbError } from '../../utils/turso-helpers'
import { parsePagination } from '../../utils/pagination'
import { toDisplayPrice } from '../../utils/price'

export async function getStockReport(
  db: Client,
  filters?: { lowStockOnly?: boolean; outOfStockOnly?: boolean; page?: number; limit?: number; search?: string }
) {
  const productsResult = await db.execute({
    sql: `SELECT p.id, p.name, p.slug, p.base_price, p.cost_price, p.stock_quantity, p.low_stock_threshold, p.is_active, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE p.deleted_at IS NULL
          ORDER BY p.name ASC`,
    args: [],
  })

  const productList = productsResult.rows

  let variants: any[] = []
  if (productList.length > 0) {
    const productIds = productList.map((p: any) => p.id)
    const placeholders = productIds.map(() => '?').join(',')

    const variantsResult = await db.execute({
      sql: `SELECT * FROM product_variants WHERE product_id IN (${placeholders}) AND deleted_at IS NULL AND is_active = 1`,
      args: productIds,
    })
    variants = variantsResult.rows as any[]
  }

  const search = filters?.search?.trim().toLowerCase()
  const filteredProducts = productList.filter((p: any) => {
    if (search) {
      const haystack = [p.name, p.slug, p.sku, p.category_name].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(search)) return false
    }
    if (filters?.lowStockOnly && !(Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= Number(p.low_stock_threshold))) return false
    if (filters?.outOfStockOnly && Number(p.stock_quantity) !== 0) return false
    return true
  })

  const page = Math.max(1, Number(filters?.page ?? 1))
  const limit = Math.max(1, Math.min(100, Number(filters?.limit ?? 20)))
  const total = filteredProducts.length
  const totalPages = Math.ceil(total / limit)
  const paginatedProducts = filteredProducts.slice((page - 1) * limit, page * limit)

  const inStock = productList.filter((p: any) => Number(p.stock_quantity) > Number(p.low_stock_threshold))
  const lowStock = productList.filter((p: any) => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= Number(p.low_stock_threshold))
  const outOfStock = productList.filter((p: any) => Number(p.stock_quantity) === 0)

  const totalValue = productList.reduce((sum: number, p: any) => sum + Number(p.cost_price) * Number(p.stock_quantity), 0)

  const byCategory: Record<string, { count: number; totalStock: number; totalValue: number }> = {}
  for (const p of productList) {
    const cat = (p.category_name as string) || 'Uncategorized'
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, totalStock: 0, totalValue: 0 }
    }
    byCategory[cat].count++
    byCategory[cat].totalStock += Number(p.stock_quantity)
    byCategory[cat].totalValue += Number(p.cost_price) * Number(p.stock_quantity)
  }

  const formattedProducts = paginatedProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? null,
    basePrice: toDisplayPrice(Number(p.base_price)),
    base_price: toDisplayPrice(Number(p.base_price)),
    costPrice: toDisplayPrice(Number(p.cost_price)),
    cost_price: toDisplayPrice(Number(p.cost_price)),
    stockQuantity: Number(p.stock_quantity),
    stock_quantity: Number(p.stock_quantity),
    lowStockThreshold: Number(p.low_stock_threshold),
    low_stock_threshold: Number(p.low_stock_threshold),
    isActive: p.is_active,
    is_active: p.is_active,
    categoryName: p.category_name || null,
    category: p.category_name ? { name: p.category_name } : null,
    status:
      Number(p.stock_quantity) === 0
        ? 'out_of_stock'
        : Number(p.stock_quantity) <= Number(p.low_stock_threshold)
          ? 'low_stock'
          : 'in_stock',
  }))

  const formattedVariants = variants.map((v: any) => ({
    id: v.id,
    productId: v.product_id,
    name: v.name,
    price: toDisplayPrice(Number(v.price)),
    salePrice: v.sale_price ? toDisplayPrice(Number(v.sale_price)) : null,
    stockQuantity: Number(v.stock_quantity),
  }))

  return {
    products: formattedProducts,
    variants: formattedVariants,
    total,
    page,
    limit,
    totalPages,
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

export async function getLowStockAlerts(db: Client) {
  const productsResult = await db.execute({
    sql: `SELECT p.id, p.name, p.slug, p.stock_quantity, p.low_stock_threshold, p.is_active, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE p.is_active = 1 AND p.deleted_at IS NULL`,
    args: [],
  })

  const lowStockProducts = productsResult.rows.filter(
    (p: any) => Number(p.stock_quantity) <= Number(p.low_stock_threshold)
  )

  const productIds = lowStockProducts.map((p: any) => p.id)
  let variants: any[] = []

  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',')
    const variantsResult = await db.execute({
      sql: `SELECT pv.id, pv.product_id, pv.name, pv.stock_quantity, pv.is_active,
            p.name as product_name, p.slug as product_slug, p.low_stock_threshold as product_low_stock_threshold
            FROM product_variants pv
            JOIN products p ON p.id = pv.product_id
            WHERE pv.product_id IN (${placeholders}) AND pv.is_active = 1 AND pv.deleted_at IS NULL`,
      args: productIds,
    })

    variants = (variantsResult.rows as any[]).filter(
      (v: any) => Number(v.stock_quantity) <= Number(v.product_low_stock_threshold || 0)
    )
  }

  const formattedProducts = lowStockProducts
    .sort((a: any, b: any) => Number(a.stock_quantity) - Number(b.stock_quantity))
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: null,
      stockQuantity: Number(p.stock_quantity),
      stock_quantity: Number(p.stock_quantity),
      lowStockThreshold: Number(p.low_stock_threshold),
      low_stock_threshold: Number(p.low_stock_threshold),
      categoryName: p.category_name || null,
      type: 'product' as const,
      urgency:
        Number(p.stock_quantity) === 0
          ? 'critical'
          : Number(p.stock_quantity) <= Math.floor(Number(p.low_stock_threshold) / 2)
            ? 'high'
            : 'medium',
    }))

  const formattedVariants = variants.map((v: any) => ({
    id: v.id,
    productId: v.product_id,
    name: v.name,
    productName: v.product_name,
    productSlug: v.product_slug,
    stockQuantity: Number(v.stock_quantity),
    lowStockThreshold: Number(v.product_low_stock_threshold || 0),
    type: 'variant' as const,
    urgency:
      Number(v.stock_quantity) === 0
        ? 'critical'
        : Number(v.stock_quantity) <= Math.floor(Number(v.product_low_stock_threshold || 0) / 2)
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
  db: Client,
  filters: {
    productId?: string
    changeType?: string
    startDate?: string
    endDate?: string
    page: number
    limit: number
  }
) {
  const { page, limit, skip } = parsePagination({ page: String(filters.page), limit: String(filters.limit) })

  const whereClauses: string[] = []
  const args: any[] = []

  if (filters.productId) {
    whereClauses.push('il.product_id = ?')
    args.push(filters.productId)
  }
  if (filters.changeType) {
    whereClauses.push('il.change_type = ?')
    args.push(filters.changeType)
  }
  if (filters.startDate) {
    whereClauses.push('il.created_at >= ?')
    args.push(filters.startDate)
  }
  if (filters.endDate) {
    whereClauses.push('il.created_at <= ?')
    args.push(filters.endDate)
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM inventory_logs il ${whereStr}`,
    args,
  })

  const dataResult = await db.execute({
    sql: `SELECT il.*, p.name as product_name, pv.name as variant_name
          FROM inventory_logs il
          LEFT JOIN products p ON p.id = il.product_id
          LEFT JOIN product_variants pv ON pv.id = il.variant_id
          ${whereStr}
          ORDER BY il.created_at DESC
          LIMIT ? OFFSET ?`,
    args: [...args, limit, skip],
  })

  const total = Number(countResult.rows[0]?.count ?? 0)
  const totalPages = Math.ceil(total / limit)

  const logs = dataResult.rows.map((log: any) => ({
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
    productName: log.product_name ?? null,
    variantName: log.variant_name ?? null,
  }))

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

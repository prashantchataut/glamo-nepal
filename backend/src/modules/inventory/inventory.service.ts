import { toDisplayPrice } from '../../utils/price'

interface ProductRow {
  id: string
  name: string
  slug: string
  base_price: number
  cost_price: number
  stock_quantity: number
  low_stock_threshold: number
  is_active: number
  category_name: string | null
}

interface VariantRow {
  id: string
  product_id: string
  name: string
  price: number
  sale_price: number | null
  stock_quantity: number
  is_active: number
  deleted_at: string | null
  product_name?: string
  product_slug?: string
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

export async function getStockReport(db: D1Database) {
  const products = await db
    .prepare(
      `SELECT p.id, p.name, p.slug, p.base_price, p.cost_price, p.stock_quantity, p.low_stock_threshold, p.is_active, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.deleted_at IS NULL
       ORDER BY p.name`
    )
    .all<ProductRow>()

  const variants = await db
    .prepare(
      `SELECT * FROM product_variants WHERE deleted_at IS NULL AND is_active = 1`
    )
    .all<VariantRow>()

  const productList = products.results
  const variantList = variants.results

  const inStock = productList.filter(
    (p) => p.stock_quantity > p.low_stock_threshold
  )
  const lowStock = productList.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
  )
  const outOfStock = productList.filter((p) => p.stock_quantity === 0)

  const totalValue = productList.reduce(
    (sum, p) => sum + p.cost_price * p.stock_quantity,
    0
  )

  const byCategory: Record<string, { count: number; totalStock: number; totalValue: number }> = {}
  for (const p of productList) {
    const cat = p.category_name || 'Uncategorized'
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, totalStock: 0, totalValue: 0 }
    }
    byCategory[cat].count++
    byCategory[cat].totalStock += p.stock_quantity
    byCategory[cat].totalValue += p.cost_price * p.stock_quantity
  }

  const formattedProducts = productList.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    basePrice: toDisplayPrice(p.base_price),
    costPrice: toDisplayPrice(p.cost_price),
    stockQuantity: p.stock_quantity,
    lowStockThreshold: p.low_stock_threshold,
    isActive: !!p.is_active,
    categoryName: p.category_name,
    status:
      p.stock_quantity === 0
        ? 'out_of_stock'
        : p.stock_quantity <= p.low_stock_threshold
          ? 'low_stock'
          : 'in_stock',
  }))

  const formattedVariants = variantList.map((v) => ({
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

export async function getLowStockAlerts(db: D1Database) {
  const products = await db
    .prepare(
      `SELECT p.id, p.name, p.slug, p.stock_quantity, p.low_stock_threshold, p.is_active, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock_quantity <= p.low_stock_threshold
         AND p.is_active = 1
         AND p.deleted_at IS NULL
       ORDER BY p.stock_quantity ASC`
    )
    .all()

  const variants = await db
    .prepare(
      `SELECT pv.id, pv.product_id, pv.name, pv.stock_quantity, pv.is_active,
              p.name as product_name, p.slug as product_slug, p.low_stock_threshold
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.id
       WHERE pv.stock_quantity <= p.low_stock_threshold
         AND pv.is_active = 1
         AND pv.deleted_at IS NULL
         AND p.is_active = 1
         AND p.deleted_at IS NULL
       ORDER BY pv.stock_quantity ASC`
    )
    .all()

  const formattedProducts = products.results.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    stockQuantity: p.stock_quantity,
    lowStockThreshold: p.low_stock_threshold,
    categoryName: p.category_name,
    type: 'product' as const,
    urgency:
      p.stock_quantity === 0
        ? 'critical'
        : p.stock_quantity <= Math.floor(p.low_stock_threshold / 2)
          ? 'high'
          : 'medium',
  }))

  const formattedVariants = variants.results.map((v: any) => ({
    id: v.id,
    productId: v.product_id,
    name: v.name,
    productName: v.product_name,
    productSlug: v.product_slug,
    stockQuantity: v.stock_quantity,
    lowStockThreshold: v.low_stock_threshold,
    type: 'variant' as const,
    urgency:
      v.stock_quantity === 0
        ? 'critical'
        : v.stock_quantity <= Math.floor(v.low_stock_threshold / 2)
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
  filters: {
    productId?: string
    variantId?: string
    changeType?: string
    dateFrom?: string
    dateTo?: string
    page: number
    limit: number
  },
  db: D1Database
) {
  const conditions: string[] = ['1=1']
  const params: any[] = []

  if (filters.productId) {
    conditions.push('il.product_id = ?')
    params.push(filters.productId)
  }
  if (filters.variantId) {
    conditions.push('il.variant_id = ?')
    params.push(filters.variantId)
  }
  if (filters.changeType) {
    conditions.push('il.change_type = ?')
    params.push(filters.changeType)
  }
  if (filters.dateFrom) {
    conditions.push('il.created_at >= ?')
    params.push(filters.dateFrom)
  }
  if (filters.dateTo) {
    conditions.push('il.created_at <= ?')
    params.push(filters.dateTo)
  }

  const whereClause = conditions.join(' AND ')
  const offset = (filters.page - 1) * filters.limit

  const countQuery = `SELECT COUNT(*) as total FROM inventory_logs il WHERE ${whereClause}`
  const countResult = await db
    .prepare(countQuery)
    .bind(...params)
    .first<{ total: number }>()

  const dataQuery = `
    SELECT il.id, il.product_id, il.variant_id, il.change_type, il.quantity,
           il.previous_stock, il.new_stock, il.reason, il.performed_by, il.created_at,
           p.name as product_name,
           pv.name as variant_name
    FROM inventory_logs il
    LEFT JOIN products p ON il.product_id = p.id
    LEFT JOIN product_variants pv ON il.variant_id = pv.id
    WHERE ${whereClause}
    ORDER BY il.created_at DESC
    LIMIT ? OFFSET ?
  `
  const dataParams = [...params, filters.limit, offset]

  const dataResult = await db
    .prepare(dataQuery)
    .bind(...dataParams)
    .all<LogRow>()

  const total = countResult?.total ?? 0
  const totalPages = Math.ceil(total / filters.limit)

  const formattedLogs = dataResult.results.map((log) => ({
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
    logs: formattedLogs,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages,
    },
  }
}
import type { Client } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool } from '../../utils/turso-helpers'

export async function getRecommendations(
  context: string,
  productId: string | undefined,
  sessionId: string,
  userId: string | undefined,
  limit: number,
  db: Client
) {
  const args: any[] = []
  const productIdParam = productId || null
  const userIdParam = userId || null

  let sql: string
  if (context === 'similar' && productId) {
    sql = `SELECT p.id, p.name, p.slug, p.brand_id, p.category_id, p.base_price, p.sale_price,
           p.stock_quantity, p.low_stock_threshold, p.is_active, p.is_featured, p.tags,
           'similar' as reason, 'Similar Products' as reason_label
           FROM products p
           WHERE p.category_id = (SELECT category_id FROM products WHERE id = ?)
           AND p.id != ? AND p.is_active = 1 AND p.deleted_at IS NULL AND p.stock_quantity > 0
           ORDER BY p.is_featured DESC, RANDOM()
           LIMIT ?`
    args.push(productId, productId, limit)
  } else if (context === 'trending') {
    sql = `SELECT p.id, p.name, p.slug, p.brand_id, p.category_id, p.base_price, p.sale_price,
            p.stock_quantity, p.low_stock_threshold, p.is_active, p.is_featured, p.tags,
            'trending' as reason, 'Trending' as reason_label
            FROM products p
            WHERE p.is_active = 1 AND p.deleted_at IS NULL AND p.stock_quantity > 0
            AND p.id IN (SELECT product_id FROM order_items GROUP BY product_id ORDER BY SUM(quantity) DESC LIMIT 50)
            ORDER BY RANDOM()
            LIMIT ?`
    args.push(limit)
  } else if (context === 'new_arrivals') {
    sql = `SELECT p.id, p.name, p.slug, p.brand_id, p.category_id, p.base_price, p.sale_price,
            p.stock_quantity, p.low_stock_threshold, p.is_active, p.is_featured, p.tags,
            'new_arrival' as reason, 'New Arrivals' as reason_label
            FROM products p
            WHERE p.is_active = 1 AND p.deleted_at IS NULL AND p.stock_quantity > 0
            ORDER BY p.created_at DESC
            LIMIT ?`
    args.push(limit)
  } else {
    sql = `SELECT p.id, p.name, p.slug, p.brand_id, p.category_id, p.base_price, p.sale_price,
            p.stock_quantity, p.low_stock_threshold, p.is_active, p.is_featured, p.tags,
            'featured' as reason, 'Featured' as reason_label
            FROM products p
            WHERE p.is_active = 1 AND p.is_featured = 1 AND p.deleted_at IS NULL AND p.stock_quantity > 0
            ORDER BY RANDOM()
            LIMIT ?`
    args.push(limit)
  }

  const result = await db.execute({ sql, args })

  return result.rows.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brand_id,
    categoryId: p.category_id,
    basePrice: Number(p.base_price),
    salePrice: p.sale_price ? Number(p.sale_price) : null,
    stockQuantity: Number(p.stock_quantity),
    lowStockThreshold: Number(p.low_stock_threshold),
    isActive: fromSqliteBool(p.is_active as number),
    isFeatured: fromSqliteBool(p.is_featured as number),
    tags: typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : (p.tags || []),
    reason: p.reason,
    reasonLabel: p.reason_label,
  }))
}

export async function getTrending(
  window: string,
  category: string | undefined,
  limit: number,
  db: Client
) {
  const whereClauses: string[] = ['p.is_active = 1', 'p.deleted_at IS NULL', 'p.stock_quantity > 0']
  const args: any[] = []

  if (category) {
    whereClauses.push('p.category_id = ?')
    args.push(category)
  }

  const whereStr = whereClauses.join(' AND ')

  const result = await db.execute({
    sql: `SELECT p.id, p.name, p.slug, p.brand_id, p.category_id, p.base_price, p.sale_price,
          p.stock_quantity, p.low_stock_threshold, p.is_active, p.is_featured, p.tags,
          COALESCE(SUM(oi.quantity), 0) as trending_score,
          'trending' as reason, 'Trending' as reason_label
          FROM products p
          LEFT JOIN order_items oi ON oi.product_id = p.id
          WHERE ${whereStr}
          GROUP BY p.id
          ORDER BY trending_score DESC, RANDOM()
          LIMIT ?`,
    args: [...args, limit],
  })

  return result.rows.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brand_id,
    categoryId: p.category_id,
    basePrice: Number(p.base_price),
    salePrice: p.sale_price ? Number(p.sale_price) : null,
    stockQuantity: Number(p.stock_quantity),
    lowStockThreshold: Number(p.low_stock_threshold),
    isActive: fromSqliteBool(p.is_active as number),
    isFeatured: fromSqliteBool(p.is_featured as number),
    tags: typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : (p.tags || []),
    trendingScore: Number(p.trending_score),
    reason: p.reason,
    reasonLabel: p.reason_label,
  }))
}
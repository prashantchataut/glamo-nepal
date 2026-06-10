import type { Client, InValue } from '@libsql/client'
import { AppError, handleDbError, assertFound, safeJsonParse, safeJsonStringify, toSqliteBool, fromSqliteBool } from '../../utils/turso-helpers'
import { createAuditLog } from '../../utils/audit'
import { CACHE_TTL, getFromCache, setCache, deleteCache, deleteCacheByPrefix } from '../../utils/cache'
import { slugify, generateUniqueSlug } from '../../utils/slug'
import { parsePagination, buildPaginationResult } from '../../utils/pagination'
import { toDisplayPrice, toStoredPrice } from '../../utils/price'
import { uploadImageToCloudinary, deleteFromCloudinary } from '../../utils/upload'
import type { NetlifyBindings } from '../../types/bindings'

interface ProductRow {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  sku: string | null
  category_id: string
  brand_id: string | null
  base_price: number
  sale_price: number | null
  cost_price: number | null
  currency: string
  is_active: number
  is_featured: number
  is_digital: number
  track_inventory: number
  stock_quantity: number
  low_stock_threshold: number
  weight: number | null
  dimensions: string | null
  meta_title: string | null
  meta_description: string | null
  tags: string | null
  search_vector: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface ProductImageRow {
  id: string
  product_id: string
  url: string
  public_id: string | null
  alt_text: string | null
  sort_order: number
  is_primary: number
  created_at: string
}

interface VariantRow {
  id: string
  product_id: string
  name: string
  sku: string | null
  price: number
  sale_price: number | null
  stock_quantity: number
  attributes: string | null
  is_active: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface ReviewSummaryRow {
  avgRating: number
  count: number
}

function mapProductRow(row: Record<string, unknown>): ProductRow {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string | null,
    short_description: row.short_description as string | null,
    sku: row.sku as string | null,
    category_id: row.category_id as string,
    brand_id: row.brand_id as string | null,
    base_price: row.base_price as number,
    sale_price: row.sale_price as number | null,
    cost_price: row.cost_price as number | null,
    currency: row.currency as string,
    is_active: row.is_active as number,
    is_featured: row.is_featured as number,
    is_digital: row.is_digital as number,
    track_inventory: row.track_inventory as number,
    stock_quantity: row.stock_quantity as number,
    low_stock_threshold: row.low_stock_threshold as number,
    weight: row.weight as number | null,
    dimensions: row.dimensions as string | null,
    meta_title: row.meta_title as string | null,
    meta_description: row.meta_description as string | null,
    tags: row.tags as string | null,
    search_vector: row.search_vector as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    deleted_at: row.deleted_at as string | null,
  }
}

function mapImageRow(row: Record<string, unknown>): ProductImageRow {
  return {
    id: row.id as string,
    product_id: row.product_id as string,
    url: row.url as string,
    public_id: row.public_id as string | null,
    alt_text: row.alt_text as string | null,
    sort_order: row.sort_order as number,
    is_primary: row.is_primary as number,
    created_at: row.created_at as string,
  }
}

function mapVariantRow(row: Record<string, unknown>): VariantRow {
  return {
    id: row.id as string,
    product_id: row.product_id as string,
    name: row.name as string,
    sku: row.sku as string | null,
    price: row.price as number,
    sale_price: row.sale_price as number | null,
    stock_quantity: row.stock_quantity as number,
    attributes: row.attributes as string | null,
    is_active: row.is_active as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    deleted_at: row.deleted_at as string | null,
  }
}

interface TaxonomyInfo {
  name: string
  slug: string
}

function formatProduct(
  row: ProductRow,
  images: ProductImageRow[] = [],
  variants: VariantRow[] = [],
  reviewSummary?: ReviewSummaryRow,
  taxonomy?: { category?: TaxonomyInfo; brand?: TaxonomyInfo }
) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    sku: row.sku,
    categoryId: row.category_id,
    categoryName: taxonomy?.category?.name ?? null,
    categorySlug: taxonomy?.category?.slug ?? null,
    brandId: row.brand_id,
    brandName: taxonomy?.brand?.name ?? null,
    brandSlug: taxonomy?.brand?.slug ?? null,
    basePrice: toDisplayPrice(row.base_price),
    salePrice: row.sale_price !== null ? toDisplayPrice(row.sale_price) : null,
    costPrice: row.cost_price !== null ? toDisplayPrice(row.cost_price) : null,
    currency: row.currency,
    isActive: fromSqliteBool(row.is_active),
    isFeatured: fromSqliteBool(row.is_featured),
    isDigital: fromSqliteBool(row.is_digital),
    trackInventory: fromSqliteBool(row.track_inventory),
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    weight: row.weight,
    dimensions: row.dimensions,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    tags: safeJsonParse<string[]>(row.tags, []),
    images: images.map(formatImage),
    variants: variants.filter((v) => !v.deleted_at).map(formatVariant),
    reviewSummary: reviewSummary || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function formatImage(row: ProductImageRow) {
  return {
    id: row.id,
    productId: row.product_id,
    url: row.url,
    publicId: row.public_id,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    isPrimary: fromSqliteBool(row.is_primary),
    createdAt: row.created_at,
  }
}

function formatVariant(row: VariantRow) {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    sku: row.sku,
    price: toDisplayPrice(row.price),
    salePrice: row.sale_price !== null ? toDisplayPrice(row.sale_price) : null,
    stockQuantity: row.stock_quantity,
    attributes: safeJsonParse<Record<string, string>>(row.attributes, {}),
    isActive: fromSqliteBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function fetchTaxonomyMap(
  db: Client,
  table: 'categories' | 'brands',
  ids: (string | null)[]
): Promise<Map<string, TaxonomyInfo>> {
  const map = new Map<string, TaxonomyInfo>()
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  if (unique.length === 0) return map
  const result = await db.execute({
    sql: `SELECT id, name, slug FROM ${table} WHERE id IN (${unique.map(() => '?').join(',')})`,
    args: unique,
  })
  for (const row of result.rows) {
    map.set(row.id as string, { name: row.name as string, slug: row.slug as string })
  }
  return map
}

async function getCategoryFilter(db: Client, category: string): Promise<string | null> {
  const bySlug = await db.execute({
    sql: "SELECT id FROM categories WHERE slug = ? AND deleted_at IS NULL",
    args: [category],
  })
  if (bySlug.rows.length > 0) return bySlug.rows[0].id as string

  const byId = await db.execute({
    sql: "SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL",
    args: [category],
  })
  return byId.rows.length > 0 ? (byId.rows[0].id as string) : null
}

async function getBrandFilter(db: Client, brand: string): Promise<string | null> {
  const bySlug = await db.execute({
    sql: "SELECT id FROM brands WHERE slug = ? AND deleted_at IS NULL",
    args: [brand],
  })
  if (bySlug.rows.length > 0) return bySlug.rows[0].id as string

  const byId = await db.execute({
    sql: "SELECT id FROM brands WHERE id = ? AND deleted_at IS NULL",
    args: [brand],
  })
  return byId.rows.length > 0 ? (byId.rows[0].id as string) : null
}

export async function getProducts(
  filters: {
    category?: string
    brand?: string
    search?: string
    minPrice?: number
    maxPrice?: number
    tags?: string
    inStock?: boolean
    featured?: boolean
    sort?: string
    page: number
    limit: number
    isAdmin?: boolean
  },
  db: Client
) {
  const conditions: string[] = ['deleted_at IS NULL']
  const args: InValue[] = []

  if (!filters.isAdmin) {
    conditions.push('is_active = 1')
  }

  if (filters.category) {
    const catId = await getCategoryFilter(db, filters.category)
    if (catId) {
      conditions.push('category_id = ?')
      args.push(catId)
    }
  }

  if (filters.brand) {
    const brandId = await getBrandFilter(db, filters.brand)
    if (brandId) {
      conditions.push('brand_id = ?')
      args.push(brandId)
    }
  }

  if (filters.search) {
    const terms = filters.search.trim().split(/\s+/)
    for (const term of terms) {
      conditions.push('(name LIKE ? OR short_description LIKE ? OR tags LIKE ?)')
      args.push(`%${term}%`, `%${term}%`, `%"${term}"%`)
    }
  }

  if (filters.minPrice !== undefined) {
    conditions.push('base_price >= ?')
    args.push(toStoredPrice(filters.minPrice))
  }

  if (filters.maxPrice !== undefined) {
    conditions.push('base_price <= ?')
    args.push(toStoredPrice(filters.maxPrice))
  }

  if (filters.inStock) {
    conditions.push('stock_quantity > 0')
  }

  if (filters.featured) {
    conditions.push('is_featured = 1')
  }

  if (filters.tags) {
    const tagList = filters.tags.split(',').map((t) => t.trim()).filter(Boolean)
    for (const tag of tagList) {
      conditions.push('tags LIKE ?')
      args.push(`%"${tag}"%`)
    }
  }

  const ALLOWED_SORT_COLUMNS = new Set(['newest', 'price-asc', 'price-desc', 'best-seller', 'most-reviewed', 'rating'])
  const sortKey = ALLOWED_SORT_COLUMNS.has(filters.sort || '') ? (filters.sort || 'newest') : 'newest'
  let orderBy = 'ORDER BY created_at DESC'
  if (sortKey === 'price-asc') orderBy = 'ORDER BY base_price ASC'
  else if (sortKey === 'price-desc') orderBy = 'ORDER BY base_price DESC'

  const { page, limit, skip } = parsePagination({ page: String(filters.page), limit: String(filters.limit) })

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM products ${whereClause}`,
    args,
  })
  const total = (countResult.rows[0].count as number) ?? 0

  const dataResult = await db.execute({
    sql: `SELECT * FROM products ${whereClause} ${orderBy} LIMIT ? OFFSET ?`,
    args: [...args, limit, skip],
  })

  const products = dataResult.rows.map((row) => mapProductRow(row as Record<string, unknown>))
  const productIds = products.map((p) => p.id)

  let images: ProductImageRow[] = []
  let variants: VariantRow[] = []

  if (productIds.length > 0) {
    const imgResult = await db.execute({
      sql: `SELECT * FROM product_images WHERE product_id IN (${productIds.map(() => '?').join(',')}) ORDER BY sort_order ASC`,
      args: productIds,
    })
    images = imgResult.rows.map((row) => mapImageRow(row as Record<string, unknown>))

    const varResult = await db.execute({
      sql: `SELECT * FROM product_variants WHERE product_id IN (${productIds.map(() => '?').join(',')}) AND deleted_at IS NULL ORDER BY created_at ASC`,
      args: productIds,
    })
    variants = varResult.rows.map((row) => mapVariantRow(row as Record<string, unknown>))
  }

  const [categoryMap, brandMap] = await Promise.all([
    fetchTaxonomyMap(db, 'categories', products.map((p) => p.category_id)),
    fetchTaxonomyMap(db, 'brands', products.map((p) => p.brand_id)),
  ])

  const formatted = products.map((product) => {
    const productImages = images.filter((i) => i.product_id === product.id)
    const productVariants = variants.filter((v) => v.product_id === product.id)
    return formatProduct(product, productImages, productVariants, undefined, {
      category: product.category_id ? categoryMap.get(product.category_id) : undefined,
      brand: product.brand_id ? brandMap.get(product.brand_id) : undefined,
    })
  })

  const pagination = buildPaginationResult(total, page, limit)

  return { products: formatted, pagination }
}

export async function getProductsCached(
  filters: Parameters<typeof getProducts>[0],
  db: Client
) {
  const sortedEntries = Object.entries(filters).sort(([a], [b]) => a.localeCompare(b))
  const filterKey = sortedEntries.map(([k, v]) => `${k}=${v}`).join('&')
  const cacheKey = `products:list:${filterKey}`

  const cached = await getFromCache<{ products: ReturnType<typeof formatProduct>[]; pagination: ReturnType<typeof buildPaginationResult> }>(cacheKey)
  if (cached) return cached

  const result = await getProducts(filters, db)
  await setCache(cacheKey, result, CACHE_TTL.PRODUCT_LIST)
  return result
}

export async function searchProducts(query: string, page: number, limit: number, db: Client) {
  const terms = query.trim().split(/\s+/)
  const { skip } = parsePagination({ page: String(page), limit: String(limit) })

  const conditions: string[] = ['deleted_at IS NULL', 'is_active = 1']
  const args: InValue[] = []

  for (const term of terms) {
    conditions.push('(name LIKE ? OR short_description LIKE ? OR tags LIKE ?)')
    args.push(`%${term}%`, `%${term}%`, `%"${term}"%`)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM products ${whereClause}`,
    args,
  })
  const total = (countResult.rows[0].count as number) ?? 0

  const dataResult = await db.execute({
    sql: `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, skip],
  })

  const products = dataResult.rows.map((row) => mapProductRow(row as Record<string, unknown>))
  const productIds = products.map((p) => p.id)

  let images: ProductImageRow[] = []
  if (productIds.length > 0) {
    const imgResult = await db.execute({
      sql: `SELECT * FROM product_images WHERE product_id IN (${productIds.map(() => '?').join(',')}) ORDER BY sort_order ASC`,
      args: productIds,
    })
    images = imgResult.rows.map((row) => mapImageRow(row as Record<string, unknown>))
  }

  const [categoryMap, brandMap] = await Promise.all([
    fetchTaxonomyMap(db, 'categories', products.map((p) => p.category_id)),
    fetchTaxonomyMap(db, 'brands', products.map((p) => p.brand_id)),
  ])

  const formatted = products.map((product) => {
    const productImages = images.filter((i) => i.product_id === product.id)
    return formatProduct(product, productImages, [], undefined, {
      category: product.category_id ? categoryMap.get(product.category_id) : undefined,
      brand: product.brand_id ? brandMap.get(product.brand_id) : undefined,
    })
  })

  const pagination = buildPaginationResult(total, page, limit)

  return { products: formatted, pagination }
}

export async function getProductBySlug(slug: string, db: Client) {
  const cacheKey = `product:slug:${slug}`
  const cached = await getFromCache<ReturnType<typeof formatProduct>>(cacheKey)
  if (cached) return cached

  const productResult = await db.execute({
    sql: 'SELECT * FROM products WHERE slug = ? AND deleted_at IS NULL',
    args: [slug],
  })

  if (productResult.rows.length === 0) return null

  const productRow = mapProductRow(productResult.rows[0] as Record<string, unknown>)

  const imgResult = await db.execute({
    sql: 'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
    args: [productRow.id],
  })

  const varResult = await db.execute({
    sql: 'SELECT * FROM product_variants WHERE product_id = ? AND deleted_at IS NULL ORDER BY created_at ASC',
    args: [productRow.id],
  })

  const reviewResult = await db.execute({
    sql: "SELECT rating FROM reviews WHERE product_id = ? AND is_approved = 1 AND deleted_at IS NULL",
    args: [productRow.id],
  })

  const reviewSummary = reviewResult.rows.length > 0
    ? {
        avgRating: reviewResult.rows.reduce((sum, r) => sum + (r.rating as number), 0) / reviewResult.rows.length,
        count: reviewResult.rows.length,
      }
    : { avgRating: 0, count: 0 }

  const images = imgResult.rows.map((row) => mapImageRow(row as Record<string, unknown>))
  const variants = varResult.rows.map((row) => mapVariantRow(row as Record<string, unknown>))

  const [categoryMap, brandMap] = await Promise.all([
    fetchTaxonomyMap(db, 'categories', [productRow.category_id]),
    fetchTaxonomyMap(db, 'brands', [productRow.brand_id]),
  ])

  const result = formatProduct(productRow, images, variants, reviewSummary, {
    category: productRow.category_id ? categoryMap.get(productRow.category_id) : undefined,
    brand: productRow.brand_id ? brandMap.get(productRow.brand_id) : undefined,
  })
  await setCache(cacheKey, result, CACHE_TTL.PRODUCT)
  return result
}

export async function createProduct(
  data: {
    name: string
    description?: string
    shortDescription?: string
    sku?: string
    categoryId: string
    brandId?: string
    basePrice: number
    salePrice?: number
    costPrice?: number
    currency?: string
    isActive?: boolean
    isFeatured?: boolean
    isDigital?: boolean
    trackInventory?: boolean
    stockQuantity?: number
    lowStockThreshold?: number
    weight?: number
    dimensions?: string
    metaTitle?: string
    metaDescription?: string
    tags?: string[]
  },
  adminId: string,
  db: Client
) {
  const baseSlug = slugify(data.name)
  const existingSlugsResult = await db.execute({
    sql: "SELECT slug FROM products WHERE slug LIKE ?",
    args: [`${baseSlug}%`],
  })
  const slug = generateUniqueSlug(data.name, existingSlugsResult.rows.map((r) => r.slug as string))

  const basePrice = toStoredPrice(data.basePrice)
  const salePrice = data.salePrice !== undefined ? toStoredPrice(data.salePrice) : null
  const costPrice = data.costPrice !== undefined ? toStoredPrice(data.costPrice) : null

  const tags = safeJsonStringify(data.tags && data.tags.length > 0 ? data.tags : null)
  const searchVector = [data.name, data.shortDescription, ...(data.tags || [])].join(' ').toLowerCase()

  const id = crypto.randomUUID()

  await db.execute({
    sql: `INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, base_price, sale_price, cost_price, currency, is_active, is_featured, is_digital, track_inventory, stock_quantity, low_stock_threshold, weight, dimensions, meta_title, meta_description, tags, search_vector)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.name,
      slug,
      data.description ?? null,
      data.shortDescription ?? null,
      data.sku ?? null,
      data.categoryId,
      data.brandId ?? null,
      basePrice,
      salePrice,
      costPrice,
      data.currency ?? 'NPR',
      toSqliteBool(data.isActive !== false),
      toSqliteBool(data.isFeatured ?? false),
      toSqliteBool(data.isDigital ?? false),
      toSqliteBool(data.trackInventory !== false),
      data.stockQuantity ?? 0,
      data.lowStockThreshold ?? 5,
      data.weight ?? null,
      data.dimensions ?? null,
      data.metaTitle ?? null,
      data.metaDescription ?? null,
      tags,
      searchVector,
    ],
  })

  const result = await db.execute({
    sql: 'SELECT * FROM products WHERE id = ?',
    args: [id],
  })

  const product = mapProductRow(result.rows[0] as Record<string, unknown>)

  await deleteCacheByPrefix('products:list:')
  await createAuditLog(db, { userId: adminId, action: 'CREATE', entity: 'products', entityId: product.id })

  return formatProduct(product)
}

export async function updateProduct(
  id: string,
  data: Record<string, unknown>,
  adminId: string,
  db: Client
) {
  const existingResult = await db.execute({
    sql: 'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL',
    args: [id],
  })

  if (existingResult.rows.length === 0) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  const existingRow = mapProductRow(existingResult.rows[0] as Record<string, unknown>)
  const oldSlug = existingRow.slug
  const setClauses: string[] = ['updated_at = datetime(\'now\')']
  const updateArgs: InValue[] = []

  if (data.name !== undefined) {
    const baseSlug = slugify(data.name as string)
    const existingSlugsResult = await db.execute({
      sql: "SELECT slug FROM products WHERE slug LIKE ? AND id != ?",
      args: [`${baseSlug}%`, id],
    })
    const newSlug = generateUniqueSlug(data.name as string, existingSlugsResult.rows.map((r) => r.slug as string))
    setClauses.push('name = ?', 'slug = ?')
    updateArgs.push(data.name as InValue, newSlug)
  }
  if (data.description !== undefined) { setClauses.push('description = ?'); updateArgs.push(data.description as InValue) }
  if (data.shortDescription !== undefined) { setClauses.push('short_description = ?'); updateArgs.push(data.shortDescription as InValue) }
  if (data.sku !== undefined) { setClauses.push('sku = ?'); updateArgs.push(data.sku as InValue) }
  if (data.categoryId !== undefined) { setClauses.push('category_id = ?'); updateArgs.push(data.categoryId as InValue) }
  if (data.brandId !== undefined) { setClauses.push('brand_id = ?'); updateArgs.push(data.brandId as InValue) }
  if (data.basePrice !== undefined) { setClauses.push('base_price = ?'); updateArgs.push(toStoredPrice(data.basePrice as number)) }
  if (data.salePrice !== undefined) { setClauses.push('sale_price = ?'); updateArgs.push(data.salePrice !== null ? toStoredPrice(data.salePrice as number) : null as InValue) }
  if (data.costPrice !== undefined) { setClauses.push('cost_price = ?'); updateArgs.push(data.costPrice !== null ? toStoredPrice(data.costPrice as number) : null as InValue) }
  if (data.currency !== undefined) { setClauses.push('currency = ?'); updateArgs.push(data.currency as InValue) }
  if (data.isActive !== undefined) { setClauses.push('is_active = ?'); updateArgs.push(toSqliteBool(data.isActive as boolean)) }
  if (data.isFeatured !== undefined) { setClauses.push('is_featured = ?'); updateArgs.push(toSqliteBool(data.isFeatured as boolean)) }
  if (data.isDigital !== undefined) { setClauses.push('is_digital = ?'); updateArgs.push(toSqliteBool(data.isDigital as boolean)) }
  if (data.trackInventory !== undefined) { setClauses.push('track_inventory = ?'); updateArgs.push(toSqliteBool(data.trackInventory as boolean)) }
  if (data.stockQuantity !== undefined) { setClauses.push('stock_quantity = ?'); updateArgs.push(data.stockQuantity as InValue) }
  if (data.lowStockThreshold !== undefined) { setClauses.push('low_stock_threshold = ?'); updateArgs.push(data.lowStockThreshold as InValue) }
  if (data.weight !== undefined) { setClauses.push('weight = ?'); updateArgs.push(data.weight as InValue) }
  if (data.dimensions !== undefined) { setClauses.push('dimensions = ?'); updateArgs.push(data.dimensions as InValue) }
  if (data.metaTitle !== undefined) { setClauses.push('meta_title = ?'); updateArgs.push(data.metaTitle as InValue) }
  if (data.metaDescription !== undefined) { setClauses.push('meta_description = ?'); updateArgs.push(data.metaDescription as InValue) }
  if (data.tags !== undefined) {
    const tags = data.tags as string[]
    setClauses.push('tags = ?')
    updateArgs.push(safeJsonStringify(tags.length > 0 ? tags : null))
  }

  await db.execute({
    sql: `UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`,
    args: [...updateArgs, id],
  })

  const updatedResult = await db.execute({
    sql: 'SELECT * FROM products WHERE id = ?',
    args: [id],
  })
  const product = mapProductRow(updatedResult.rows[0] as Record<string, unknown>)

  await deleteCache(`product:slug:${oldSlug}`)
  if (data.name !== undefined) {
    await deleteCache(`product:slug:${product.slug}`)
  }
  await deleteCacheByPrefix('products:list:')
  await createAuditLog(db, { userId: adminId, action: 'UPDATE', entity: 'products', entityId: id, changes: data as Record<string, unknown> })

  return formatProduct(product)
}

export async function toggleFeatured(id: string, adminId: string, db: Client) {
  const productResult = await db.execute({
    sql: 'SELECT id, slug, is_featured FROM products WHERE id = ? AND deleted_at IS NULL',
    args: [id],
  })

  if (productResult.rows.length === 0) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  const currentFeatured = productResult.rows[0].is_featured as number
  const newValue = !fromSqliteBool(currentFeatured)

  await db.execute({
    sql: "UPDATE products SET is_featured = ?, updated_at = datetime('now') WHERE id = ?",
    args: [toSqliteBool(newValue), id],
  })

  const slug = productResult.rows[0].slug as string
  await deleteCache(`product:slug:${slug}`)
  await deleteCacheByPrefix('products:list:')
  await createAuditLog(db, { userId: adminId, action: 'TOGGLE_FEATURED', entity: 'products', entityId: id })

  return { isFeatured: newValue }
}

export async function toggleHidden(id: string, adminId: string, db: Client) {
  const productResult = await db.execute({
    sql: 'SELECT id, slug, is_active FROM products WHERE id = ? AND deleted_at IS NULL',
    args: [id],
  })

  if (productResult.rows.length === 0) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  const currentActive = productResult.rows[0].is_active as number
  const newValue = !fromSqliteBool(currentActive)

  await db.execute({
    sql: "UPDATE products SET is_active = ?, updated_at = datetime('now') WHERE id = ?",
    args: [toSqliteBool(newValue), id],
  })

  const slug = productResult.rows[0].slug as string
  await deleteCache(`product:slug:${slug}`)
  await deleteCacheByPrefix('products:list:')
  await createAuditLog(db, { userId: adminId, action: 'TOGGLE_HIDDEN', entity: 'products', entityId: id })

  return { isActive: newValue }
}

export async function softDeleteProduct(id: string, adminId: string, db: Client) {
  const productResult = await db.execute({
    sql: 'SELECT id, slug FROM products WHERE id = ? AND deleted_at IS NULL',
    args: [id],
  })

  if (productResult.rows.length === 0) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  await db.execute({
    sql: "UPDATE products SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
    args: [id],
  })

  const slug = productResult.rows[0].slug as string
  await deleteCache(`product:slug:${slug}`)
  await deleteCacheByPrefix('products:list:')
  await createAuditLog(db, { userId: adminId, action: 'SOFT_DELETE', entity: 'products', entityId: id })
}

export async function uploadProductImages(
  productId: string,
  files: File[],
  adminId: string,
  db: Client,
  env: NetlifyBindings
) {
  const productResult = await db.execute({
    sql: 'SELECT id, slug FROM products WHERE id = ? AND deleted_at IS NULL',
    args: [productId],
  })

  if (productResult.rows.length === 0) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  const countResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
    args: [productId],
  })
  const existingCount = (countResult.rows[0].count as number) ?? 0

  if (existingCount + files.length > 10) {
    throw new AppError('MAX_IMAGES_EXCEEDED', 400)
  }

  const primaryResult = await db.execute({
    sql: 'SELECT id FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1',
    args: [productId],
  })

  const hasPrimary = primaryResult.rows.length > 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const result = await uploadImageToCloudinary(file, `products/${productId}`, env)

    const isPrimary = !hasPrimary && i === 0

    await db.execute({
      sql: 'INSERT INTO product_images (id, product_id, url, public_id, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        crypto.randomUUID(),
        productId,
        result.url,
        result.publicId,
        null,
        existingCount + i,
        toSqliteBool(isPrimary),
      ],
    })
  }

  const slug = productResult.rows[0].slug as string
  await deleteCache(`product:slug:${slug}`)
  await deleteCacheByPrefix('products:list:')
  await createAuditLog(db, { userId: adminId, action: 'UPLOAD_IMAGES', entity: 'products', entityId: productId })

  const imgResult = await db.execute({
    sql: 'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
    args: [productId],
  })

  return imgResult.rows.map((row) => formatImage(mapImageRow(row as Record<string, unknown>)))
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
  adminId: string,
  db: Client,
  env: NetlifyBindings
) {
  const imageResult = await db.execute({
    sql: 'SELECT * FROM product_images WHERE id = ? AND product_id = ?',
    args: [imageId, productId],
  })

  if (imageResult.rows.length === 0) {
    throw new AppError('IMAGE_NOT_FOUND', 404)
  }

  const imageRow = mapImageRow(imageResult.rows[0] as Record<string, unknown>)

  if (imageRow.public_id) {
    await deleteFromCloudinary(imageRow.public_id, env)
  }

  await db.execute({
    sql: 'DELETE FROM product_images WHERE id = ?',
    args: [imageId],
  })

  if (fromSqliteBool(imageRow.is_primary)) {
    const nextImageResult = await db.execute({
      sql: 'SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1',
      args: [productId],
    })

    if (nextImageResult.rows.length > 0) {
      await db.execute({
        sql: 'UPDATE product_images SET is_primary = 1 WHERE id = ?',
        args: [nextImageResult.rows[0].id],
      })
    }
  }

  const productResult = await db.execute({
    sql: 'SELECT slug FROM products WHERE id = ?',
    args: [productId],
  })

  if (productResult.rows.length > 0) {
    const slug = productResult.rows[0].slug as string
    await deleteCache(`product:slug:${slug}`)
    await deleteCacheByPrefix('products:list:')
  }
  await createAuditLog(db, { userId: adminId, action: 'DELETE_IMAGE', entity: 'products', entityId: productId })

  const imgResult = await db.execute({
    sql: 'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
    args: [productId],
  })

  return imgResult.rows.map((row) => formatImage(mapImageRow(row as Record<string, unknown>)))
}

export async function getProductVariants(productId: string, db: Client) {
  const result = await db.execute({
    sql: 'SELECT * FROM product_variants WHERE product_id = ? AND deleted_at IS NULL ORDER BY created_at ASC',
    args: [productId],
  })

  return result.rows.map((row) => formatVariant(mapVariantRow(row as Record<string, unknown>)))
}

export async function addVariant(
  productId: string,
  data: { name: string; sku?: string; price: number; salePrice?: number; stockQuantity?: number; attributes?: Record<string, string> },
  adminId: string,
  db: Client
) {
  const productResult = await db.execute({
    sql: 'SELECT id, slug FROM products WHERE id = ? AND deleted_at IS NULL',
    args: [productId],
  })

  if (productResult.rows.length === 0) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  const price = toStoredPrice(data.price)
  const salePrice = data.salePrice !== undefined ? toStoredPrice(data.salePrice) : null
  const attributes = safeJsonStringify(data.attributes || null)

  const id = crypto.randomUUID()

  await db.execute({
    sql: `INSERT INTO product_variants (id, product_id, name, sku, price, sale_price, stock_quantity, attributes, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      productId,
      data.name,
      data.sku ?? null,
      price,
      salePrice,
      data.stockQuantity ?? 0,
      attributes,
      toSqliteBool(true),
    ],
  })

  const variantResult = await db.execute({
    sql: 'SELECT * FROM product_variants WHERE id = ?',
    args: [id],
  })

  const slug = productResult.rows[0].slug as string
  await deleteCache(`product:slug:${slug}`)
  await deleteCacheByPrefix('products:list:')
  await createAuditLog(db, { userId: adminId, action: 'ADD_VARIANT', entity: 'products', entityId: productId })

  return formatVariant(mapVariantRow(variantResult.rows[0] as Record<string, unknown>))
}

export async function updateVariant(
  variantId: string,
  data: Record<string, unknown>,
  adminId: string,
  db: Client
) {
  const variantResult = await db.execute({
    sql: 'SELECT * FROM product_variants WHERE id = ? AND deleted_at IS NULL',
    args: [variantId],
  })

  if (variantResult.rows.length === 0) {
    throw new AppError('VARIANT_NOT_FOUND', 404)
  }

  const variantRow = mapVariantRow(variantResult.rows[0] as Record<string, unknown>)
  const setClauses: string[] = ['updated_at = datetime(\'now\')']
  const updateArgs: InValue[] = []

  if (data.name !== undefined) { setClauses.push('name = ?'); updateArgs.push(data.name as InValue) }
  if (data.sku !== undefined) { setClauses.push('sku = ?'); updateArgs.push(data.sku as InValue) }
  if (data.price !== undefined) { setClauses.push('price = ?'); updateArgs.push(toStoredPrice(data.price as number)) }
  if (data.salePrice !== undefined) { setClauses.push('sale_price = ?'); updateArgs.push(data.salePrice !== null ? toStoredPrice(data.salePrice as number) : null as InValue) }
  if (data.stockQuantity !== undefined) { setClauses.push('stock_quantity = ?'); updateArgs.push(data.stockQuantity as InValue) }
  if (data.attributes !== undefined) { setClauses.push('attributes = ?'); updateArgs.push(data.attributes ? safeJsonStringify(data.attributes) : null as InValue) }
  if (data.isActive !== undefined) { setClauses.push('is_active = ?'); updateArgs.push(toSqliteBool(data.isActive as boolean)) }

  await db.execute({
    sql: `UPDATE product_variants SET ${setClauses.join(', ')} WHERE id = ?`,
    args: [...updateArgs, variantId],
  })

  const updatedResult = await db.execute({
    sql: 'SELECT * FROM product_variants WHERE id = ?',
    args: [variantId],
  })

  const productResult = await db.execute({
    sql: 'SELECT slug FROM products WHERE id = ?',
    args: [variantRow.product_id],
  })

  if (productResult.rows.length > 0) {
    const slug = productResult.rows[0].slug as string
    await deleteCache(`product:slug:${slug}`)
    await deleteCacheByPrefix('products:list:')
  }
  await createAuditLog(db, { userId: adminId, action: 'UPDATE_VARIANT', entity: 'product_variants', entityId: variantId, changes: data as Record<string, unknown> })

  return formatVariant(mapVariantRow(updatedResult.rows[0] as Record<string, unknown>))
}

export async function deleteVariant(variantId: string, adminId: string, db: Client) {
  const variantResult = await db.execute({
    sql: 'SELECT * FROM product_variants WHERE id = ? AND deleted_at IS NULL',
    args: [variantId],
  })

  if (variantResult.rows.length === 0) {
    throw new AppError('VARIANT_NOT_FOUND', 404)
  }

  const variantRow = mapVariantRow(variantResult.rows[0] as Record<string, unknown>)

  const inOrdersResult = await db.execute({
    sql: 'SELECT id FROM order_items WHERE variant_id = ? LIMIT 1',
    args: [variantId],
  })

  if (inOrdersResult.rows.length > 0) {
    throw new AppError('VARIANT_IN_ACTIVE_ORDERS', 400)
  }

  await db.execute({
    sql: "UPDATE product_variants SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
    args: [variantId],
  })

  const productResult = await db.execute({
    sql: 'SELECT slug FROM products WHERE id = ?',
    args: [variantRow.product_id],
  })

  if (productResult.rows.length > 0) {
    const slug = productResult.rows[0].slug as string
    await deleteCache(`product:slug:${slug}`)
    await deleteCacheByPrefix('products:list:')
  }
  await createAuditLog(db, { userId: adminId, action: 'DELETE_VARIANT', entity: 'product_variants', entityId: variantId })
}

export async function adjustStock(
  productId: string,
  variantId: string | null,
  change: number,
  reason: string | undefined,
  userId: string,
  db: Client
) {
  if (variantId) {
    const variantResult = await db.execute({
      sql: 'SELECT * FROM product_variants WHERE id = ? AND deleted_at IS NULL',
      args: [variantId],
    })

    if (variantResult.rows.length === 0) {
      throw new AppError('VARIANT_NOT_FOUND', 404)
    }

    const variantRow = mapVariantRow(variantResult.rows[0] as Record<string, unknown>)
    const newStock = variantRow.stock_quantity + change
    if (newStock < 0) {
      throw new AppError('INSUFFICIENT_STOCK', 400)
    }

    await db.execute({
      sql: "UPDATE product_variants SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?",
      args: [newStock, variantId],
    })

    const productResult = await db.execute({
      sql: 'SELECT id, slug, low_stock_threshold FROM products WHERE id = ?',
      args: [productId],
    })

    if (productResult.rows.length > 0) {
      const totalResult = await db.execute({
        sql: 'SELECT stock_quantity FROM product_variants WHERE product_id = ? AND deleted_at IS NULL',
        args: [productId],
      })
      const totalVariantStock = totalResult.rows.reduce((sum, v) => sum + (v.stock_quantity as number), 0)
      await db.execute({
        sql: "UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?",
        args: [totalVariantStock, productId],
      })
    }

    await db.execute({
      sql: `INSERT INTO inventory_logs (id, product_id, variant_id, change_type, quantity, previous_stock, new_stock, reason, performed_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        crypto.randomUUID(),
        productId,
        variantId,
        change > 0 ? 'RESTOCK' : 'ADJUSTMENT',
        change,
        variantRow.stock_quantity,
        newStock,
        reason ?? null,
        userId,
      ],
    })

    if (productResult.rows.length > 0) {
      const slug = productResult.rows[0].slug as string
      await deleteCache(`product:slug:${slug}`)
      await deleteCacheByPrefix('products:list:')
    }
  } else {
    const productResult = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL',
      args: [productId],
    })

    if (productResult.rows.length === 0) {
      throw new AppError('PRODUCT_NOT_FOUND', 404)
    }

    const productRow = mapProductRow(productResult.rows[0] as Record<string, unknown>)
    const newStock = productRow.stock_quantity + change
    if (newStock < 0) {
      throw new AppError('INSUFFICIENT_STOCK', 400)
    }

    await db.execute({
      sql: "UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?",
      args: [newStock, productId],
    })

    await db.execute({
      sql: `INSERT INTO inventory_logs (id, product_id, variant_id, change_type, quantity, previous_stock, new_stock, reason, performed_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        crypto.randomUUID(),
        productId,
        null,
        change > 0 ? 'RESTOCK' : 'ADJUSTMENT',
        change,
        productRow.stock_quantity,
        newStock,
        reason ?? null,
        userId,
      ],
    })

    await deleteCache(`product:slug:${productRow.slug}`)
    await deleteCacheByPrefix('products:list:')
  }
}
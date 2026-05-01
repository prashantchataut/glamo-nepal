import { toStoredPrice, toDisplayPrice } from '../../utils/price'
import { slugify, generateUniqueSlug } from '../../utils/slug'
import { CACHE_TTL, getFromCache, setCache, deleteCache, deleteCacheByPrefix } from '../../utils/cache'
import { uploadImageToCloudinary, deleteFromCloudinary } from '../../utils/upload'
import { createAuditLog } from '../../utils/audit'
import { parsePagination, buildPaginationResult } from '../../utils/pagination'
import type { CloudflareBindings } from '../../types/bindings'

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

function formatProduct(row: ProductRow, images: ProductImageRow[] = [], variants: VariantRow[] = [], reviewSummary?: { avgRating: number; count: number }) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    sku: row.sku,
    categoryId: row.category_id,
    brandId: row.brand_id,
    basePrice: toDisplayPrice(row.base_price),
    salePrice: row.sale_price !== null ? toDisplayPrice(row.sale_price) : null,
    costPrice: row.cost_price !== null ? toDisplayPrice(row.cost_price) : null,
    currency: row.currency,
    isActive: !!row.is_active,
    isFeatured: !!row.is_featured,
    isDigital: !!row.is_digital,
    trackInventory: !!row.track_inventory,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    weight: row.weight,
    dimensions: row.dimensions,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    tags: row.tags ? JSON.parse(row.tags) : [],
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
    isPrimary: !!row.is_primary,
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
    attributes: row.attributes ? JSON.parse(row.attributes) : {},
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getCategoryFilter(db: D1Database, category: string): Promise<string | null> {
  const bySlug = await db.prepare('SELECT id FROM categories WHERE slug = ? AND deleted_at IS NULL').bind(category).first<{ id: string }>()
  if (bySlug) return bySlug.id
  const byId = await db.prepare('SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL').bind(category).first<{ id: string }>()
  return byId?.id ?? null
}

async function getBrandFilter(db: D1Database, brand: string): Promise<string | null> {
  const bySlug = await db.prepare('SELECT id FROM brands WHERE slug = ? AND deleted_at IS NULL').bind(brand).first<{ id: string }>()
  if (bySlug) return bySlug.id
  const byId = await db.prepare('SELECT id FROM brands WHERE id = ? AND deleted_at IS NULL').bind(brand).first<{ id: string }>()
  return byId?.id ?? null
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
  db: D1Database,
  kv: KVNamespace
) {
  const conditions: string[] = ['p.deleted_at IS NULL']
  const params: unknown[] = []

  if (!filters.isAdmin) {
    conditions.push('p.is_active = 1')
  }

  if (filters.category) {
    const catId = await getCategoryFilter(db, filters.category)
    if (catId) {
      conditions.push('p.category_id = ?')
      params.push(catId)
    }
  }

  if (filters.brand) {
    const brandId = await getBrandFilter(db, filters.brand)
    if (brandId) {
      conditions.push('p.brand_id = ?')
      params.push(brandId)
    }
  }

  if (filters.search) {
    const terms = filters.search.trim().split(/\s+/)
    for (const term of terms) {
      conditions.push('(p.name LIKE ? OR p.short_description LIKE ? OR p.tags LIKE ?)')
      const likeTerm = `%${term}%`
      params.push(likeTerm, likeTerm, likeTerm)
    }
  }

  if (filters.minPrice !== undefined) {
    conditions.push('p.base_price >= ?')
    params.push(toStoredPrice(filters.minPrice))
  }

  if (filters.maxPrice !== undefined) {
    conditions.push('p.base_price <= ?')
    params.push(toStoredPrice(filters.maxPrice))
  }

  if (filters.inStock) {
    conditions.push('p.stock_quantity > 0')
  }

  if (filters.featured) {
    conditions.push('p.is_featured = 1')
  }

  if (filters.tags) {
    const tagList = filters.tags.split(',').map((t) => t.trim()).filter(Boolean)
    for (const tag of tagList) {
      conditions.push('p.tags LIKE ?')
      params.push(`%"${tag}"%`)
    }
  }

const ALLOWED_SORT_COLUMNS = new Set(['newest', 'price-asc', 'price-desc', 'best-seller', 'most-reviewed', 'rating'])

  let orderBy = 'p.created_at DESC'
  const sortKey = ALLOWED_SORT_COLUMNS.has(filters.sort || '') ? (filters.sort || 'newest') : 'newest'
  switch (sortKey) {
    case 'price-asc':
      orderBy = 'p.base_price ASC'
      break
    case 'price-desc':
      orderBy = 'p.base_price DESC'
      break
    case 'best-seller':
      orderBy = 'p.created_at DESC'
      break
    case 'most-reviewed':
      orderBy = 'p.created_at DESC'
      break
    case 'rating':
      orderBy = 'p.created_at DESC'
      break
    default:
      orderBy = 'p.created_at DESC'
  }

  const whereClause = conditions.join(' AND ')
  const { page, limit, skip } = parsePagination({ page: String(filters.page), limit: String(filters.limit) })

  const countSql = `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`
  const countResult = await db.prepare(countSql).bind(...params).first<{ total: number }>()
  const total = countResult?.total ?? 0

  const dataSql = `SELECT p.* FROM products p WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  const products = await db.prepare(dataSql).bind(...params, limit, skip).all<ProductRow>()

  const productIds = products.results.map((p) => p.id)

  let images: ProductImageRow[] = []
  let variants: VariantRow[] = []

  if (productIds.length > 0) {
    const imageResults = await db
      .prepare('SELECT * FROM product_images WHERE product_id IN (' + productIds.map(() => '?').join(',') + ') ORDER BY sort_order ASC')
      .bind(...productIds)
      .all<ProductImageRow>()
    images = imageResults.results

    const variantResults = await db
      .prepare('SELECT * FROM product_variants WHERE product_id IN (' + productIds.map(() => '?').join(',') + ') AND deleted_at IS NULL ORDER BY created_at ASC')
      .bind(...productIds)
      .all<VariantRow>()
    variants = variantResults.results
  }

  const formatted = products.results.map((product) => {
    const productImages = images.filter((i) => i.product_id === product.id)
    const productVariants = variants.filter((v) => v.product_id === product.id)
    return formatProduct(product, productImages, productVariants)
  })

  const pagination = buildPaginationResult(total, page, limit)

  return { products: formatted, pagination }
}

export async function getProductsCached(
  filters: Parameters<typeof getProducts>[0],
  db: D1Database,
  kv: KVNamespace
) {
  const sortedEntries = Object.entries(filters).sort(([a], [b]) => a.localeCompare(b))
  const filterKey = sortedEntries.map(([k, v]) => `${k}=${v}`).join('&')
  const cacheKey = `products:list:${filterKey}`

  const cached = await getFromCache<{ products: ReturnType<typeof formatProduct>[]; pagination: ReturnType<typeof buildPaginationResult> }>(kv, cacheKey)
  if (cached) return cached

  const result = await getProducts(filters, db, kv)
  await setCache(kv, cacheKey, result, CACHE_TTL.PRODUCT_LIST)
  return result
}

export async function getProductBySlug(slug: string, db: D1Database, kv: KVNamespace) {
  const cacheKey = `product:slug:${slug}`
  const cached = await getFromCache<ReturnType<typeof formatProduct>>(kv, cacheKey)
  if (cached) return cached

  const product = await db
    .prepare('SELECT * FROM products WHERE slug = ? AND deleted_at IS NULL')
    .bind(slug)
    .first<ProductRow>()

  if (!product) return null

  const images = await db
    .prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC')
    .bind(product.id)
    .all<ProductImageRow>()

  const variants = await db
    .prepare('SELECT * FROM product_variants WHERE product_id = ? AND deleted_at IS NULL ORDER BY created_at ASC')
    .bind(product.id)
    .all<VariantRow>()

  const reviewSummary = await db
    .prepare('SELECT COALESCE(AVG(rating), 0) as avgRating, COUNT(*) as count FROM reviews WHERE product_id = ? AND is_approved = 1 AND deleted_at IS NULL')
    .bind(product.id)
    .first<{ avgRating: number; count: number }>()

  const result = formatProduct(product, images.results, variants.results, reviewSummary ?? undefined)
  await setCache(kv, cacheKey, result, CACHE_TTL.PRODUCT)
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
  db: D1Database,
  kv: KVNamespace
) {
  const existingSlugs = (await db.prepare('SELECT slug FROM products WHERE slug LIKE ?').bind(`${slugify(data.name)}%`).all<{ slug: string }>()).results.map((r) => r.slug)
  const slug = generateUniqueSlug(data.name, existingSlugs)

  const basePrice = toStoredPrice(data.basePrice)
  const salePrice = data.salePrice !== undefined ? toStoredPrice(data.salePrice) : null
  const costPrice = data.costPrice !== undefined ? toStoredPrice(data.costPrice) : null

  const tagsJson = data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null
  const searchVector = [data.name, data.shortDescription, ...(data.tags || [])].join(' ').toLowerCase()

  const id = crypto.randomUUID()

  await db
    .prepare(
      `INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, base_price, sale_price, cost_price, currency, is_active, is_featured, is_digital, track_inventory, stock_quantity, low_stock_threshold, weight, dimensions, meta_title, meta_description, tags, search_vector)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
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
      data.isActive !== false ? 1 : 0,
      data.isFeatured ? 1 : 0,
      data.isDigital ? 1 : 0,
      data.trackInventory !== false ? 1 : 0,
      data.stockQuantity ?? 0,
      data.lowStockThreshold ?? 5,
      data.weight ?? null,
      data.dimensions ?? null,
      data.metaTitle ?? null,
      data.metaDescription ?? null,
      tagsJson,
      searchVector
    )
    .run()

  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(db, { userId: adminId, action: 'CREATE', entity: 'products', entityId: id })

  const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<ProductRow>()
  return formatProduct(product!)
}

export async function updateProduct(
  id: string,
  data: Record<string, unknown>,
  adminId: string,
  db: D1Database,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const existing = await db.prepare('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL').bind(id).first<ProductRow>()
  if (!existing) throw new Error('PRODUCT_NOT_FOUND')

  const oldSlug = existing.slug
  const updates: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) {
    const existingSlugs = (await db.prepare('SELECT slug FROM products WHERE slug LIKE ? AND id != ?').bind(`${slugify(data.name as string)}%`, id).all<{ slug: string }>()).results.map((r) => r.slug)
    const newSlug = generateUniqueSlug(data.name as string, existingSlugs)
    updates.push('name = ?', 'slug = ?')
    values.push(data.name, newSlug)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description)
  }
  if (data.shortDescription !== undefined) {
    updates.push('short_description = ?')
    values.push(data.shortDescription)
  }
  if (data.sku !== undefined) {
    updates.push('sku = ?')
    values.push(data.sku)
  }
  if (data.categoryId !== undefined) {
    updates.push('category_id = ?')
    values.push(data.categoryId)
  }
  if (data.brandId !== undefined) {
    updates.push('brand_id = ?')
    values.push(data.brandId)
  }
  if (data.basePrice !== undefined) {
    updates.push('base_price = ?')
    values.push(toStoredPrice(data.basePrice as number))
  }
  if (data.salePrice !== undefined) {
    updates.push('sale_price = ?')
    values.push(data.salePrice !== null ? toStoredPrice(data.salePrice as number) : null)
  }
  if (data.costPrice !== undefined) {
    updates.push('cost_price = ?')
    values.push(data.costPrice !== null ? toStoredPrice(data.costPrice as number) : null)
  }
  if (data.currency !== undefined) {
    updates.push('currency = ?')
    values.push(data.currency)
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?')
    values.push(data.isActive ? 1 : 0)
  }
  if (data.isFeatured !== undefined) {
    updates.push('is_featured = ?')
    values.push(data.isFeatured ? 1 : 0)
  }
  if (data.isDigital !== undefined) {
    updates.push('is_digital = ?')
    values.push(data.isDigital ? 1 : 0)
  }
  if (data.trackInventory !== undefined) {
    updates.push('track_inventory = ?')
    values.push(data.trackInventory ? 1 : 0)
  }
  if (data.stockQuantity !== undefined) {
    updates.push('stock_quantity = ?')
    values.push(data.stockQuantity)
  }
  if (data.lowStockThreshold !== undefined) {
    updates.push('low_stock_threshold = ?')
    values.push(data.lowStockThreshold)
  }
  if (data.weight !== undefined) {
    updates.push('weight = ?')
    values.push(data.weight)
  }
  if (data.dimensions !== undefined) {
    updates.push('dimensions = ?')
    values.push(data.dimensions)
  }
  if (data.metaTitle !== undefined) {
    updates.push('meta_title = ?')
    values.push(data.metaTitle)
  }
  if (data.metaDescription !== undefined) {
    updates.push('meta_description = ?')
    values.push(data.metaDescription)
  }
  if (data.tags !== undefined) {
    const tags = data.tags as string[]
    updates.push('tags = ?')
    values.push(tags.length > 0 ? JSON.stringify(tags) : null)
  }

  if (updates.length > 0) {
    updates.push('updated_at = datetime(\'now\')')
    values.push(id)
    await db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
  }

  await deleteCache(kv, `product:slug:${oldSlug}`)
  if (data.name !== undefined) {
    const newSlug = (await db.prepare('SELECT slug FROM products WHERE id = ?').bind(id).first<{ slug: string }>())!.slug
    await deleteCache(kv, `product:slug:${newSlug}`)
  }
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(db, { userId: adminId, action: 'UPDATE', entity: 'products', entityId: id, changes: JSON.stringify(data) })

  const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<ProductRow>()
  return formatProduct(product!)
}

export async function toggleFeatured(id: string, adminId: string, db: D1Database, kv: KVNamespace) {
  const product = await db.prepare('SELECT id, slug, is_featured FROM products WHERE id = ? AND deleted_at IS NULL').bind(id).first<{ id: string; slug: string; is_featured: number }>()
  if (!product) throw new Error('PRODUCT_NOT_FOUND')

  const newValue = product.is_featured ? 0 : 1
  await db.prepare('UPDATE products SET is_featured = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(newValue, id).run()

  await deleteCache(kv, `product:slug:${product.slug}`)
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(db, { userId: adminId, action: 'TOGGLE_FEATURED', entity: 'products', entityId: id })

  return { isFeatured: !!newValue }
}

export async function toggleHidden(id: string, adminId: string, db: D1Database, kv: KVNamespace) {
  const product = await db.prepare('SELECT id, slug, is_active FROM products WHERE id = ? AND deleted_at IS NULL').bind(id).first<{ id: string; slug: string; is_active: number }>()
  if (!product) throw new Error('PRODUCT_NOT_FOUND')

  const newValue = product.is_active ? 0 : 1
  await db.prepare('UPDATE products SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(newValue, id).run()

  await deleteCache(kv, `product:slug:${product.slug}`)
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(db, { userId: adminId, action: 'TOGGLE_HIDDEN', entity: 'products', entityId: id })

  return { isActive: !!newValue }
}

export async function softDeleteProduct(id: string, adminId: string, db: D1Database, kv: KVNamespace) {
  const product = await db.prepare('SELECT id, slug FROM products WHERE id = ? AND deleted_at IS NULL').bind(id).first<{ id: string; slug: string }>()
  if (!product) throw new Error('PRODUCT_NOT_FOUND')

  await db.prepare('UPDATE products SET deleted_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?').bind(id).run()

  await deleteCache(kv, `product:slug:${product.slug}`)
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(db, { userId: adminId, action: 'SOFT_DELETE', entity: 'products', entityId: id })
}

export async function uploadProductImages(
  productId: string,
  files: File[],
  adminId: string,
  db: D1Database,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const product = await db.prepare('SELECT id, slug FROM products WHERE id = ? AND deleted_at IS NULL').bind(productId).first<{ id: string; slug: string }>()
  if (!product) throw new Error('PRODUCT_NOT_FOUND')

  const existingCount = await db.prepare('SELECT COUNT(*) as count FROM product_images WHERE product_id = ?').bind(productId).first<{ count: number }>()
  if ((existingCount?.count ?? 0) + files.length > 10) {
    throw new Error('MAX_IMAGES_EXCEEDED')
  }

  const hasPrimary = await db.prepare('SELECT id FROM product_images WHERE product_id = ? AND is_primary = 1').bind(productId).first()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const result = await uploadImageToCloudinary(file, 'products', env)

    const imageId = crypto.randomUUID()
    const isPrimary = !hasPrimary && i === 0 ? 1 : 0

    await db
      .prepare('INSERT INTO product_images (id, product_id, url, public_id, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(imageId, productId, result.url, result.publicId, null, (existingCount?.count ?? 0) + i, isPrimary)
      .run()
  }

  await deleteCache(kv, `product:slug:${product.slug}`)
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(db, { userId: adminId, action: 'UPLOAD_IMAGES', entity: 'products', entityId: productId })

  const images = await db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC').bind(productId).all<ProductImageRow>()
  return images.results.map(formatImage)
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
  adminId: string,
  db: D1Database,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const image = await db.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?').bind(imageId, productId).first<ProductImageRow>()
  if (!image) throw new Error('IMAGE_NOT_FOUND')

  if (image.public_id) {
    await deleteFromCloudinary(image.public_id, env)
  }

  await db.prepare('DELETE FROM product_images WHERE id = ?').bind(imageId).run()

  if (image.is_primary) {
    const nextImage = await db.prepare('SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1').bind(productId).first<{ id: string }>()
    if (nextImage) {
      await db.prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?').bind(nextImage.id).run()
    }
  }

  const product = await db.prepare('SELECT slug FROM products WHERE id = ?').bind(productId).first<{ slug: string }>()
  if (product) {
    await deleteCache(kv, `product:slug:${product.slug}`)
    await deleteCacheByPrefix(kv, 'products:list:')
  }
  await createAuditLog(db, { userId: adminId, action: 'DELETE_IMAGE', entity: 'products', entityId: productId })

  const images = await db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC').bind(productId).all<ProductImageRow>()
  return images.results.map(formatImage)
}

export async function getProductVariants(productId: string, db: D1Database) {
  const variants = await db
    .prepare('SELECT * FROM product_variants WHERE product_id = ? AND deleted_at IS NULL ORDER BY created_at ASC')
    .bind(productId)
    .all<VariantRow>()
  return variants.results.map(formatVariant)
}

export async function addVariant(
  productId: string,
  data: { name: string; sku?: string; price: number; salePrice?: number; stockQuantity?: number; attributes?: Record<string, string> },
  adminId: string,
  db: D1Database,
  kv: KVNamespace
) {
  const product = await db.prepare('SELECT id, slug FROM products WHERE id = ? AND deleted_at IS NULL').bind(productId).first<{ id: string; slug: string }>()
  if (!product) throw new Error('PRODUCT_NOT_FOUND')

  const id = crypto.randomUUID()
  const price = toStoredPrice(data.price)
  const salePrice = data.salePrice !== undefined ? toStoredPrice(data.salePrice) : null
  const attributes = data.attributes ? JSON.stringify(data.attributes) : null

  await db
    .prepare('INSERT INTO product_variants (id, product_id, name, sku, price, sale_price, stock_quantity, attributes, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)')
    .bind(id, productId, data.name, data.sku ?? null, price, salePrice, data.stockQuantity ?? 0, attributes)
    .run()

  await deleteCache(kv, `product:slug:${product.slug}`)
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(db, { userId: adminId, action: 'ADD_VARIANT', entity: 'products', entityId: productId })

  const variant = await db.prepare('SELECT * FROM product_variants WHERE id = ?').bind(id).first<VariantRow>()
  return formatVariant(variant!)
}

export async function updateVariant(
  variantId: string,
  data: Record<string, unknown>,
  adminId: string,
  db: D1Database,
  kv: KVNamespace
) {
  const variant = await db.prepare('SELECT * FROM product_variants WHERE id = ? AND deleted_at IS NULL').bind(variantId).first<VariantRow>()
  if (!variant) throw new Error('VARIANT_NOT_FOUND')

  const updates: string[] = []
  const values: unknown[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    values.push(data.name)
  }
  if (data.sku !== undefined) {
    updates.push('sku = ?')
    values.push(data.sku)
  }
  if (data.price !== undefined) {
    updates.push('price = ?')
    values.push(toStoredPrice(data.price as number))
  }
  if (data.salePrice !== undefined) {
    updates.push('sale_price = ?')
    values.push(data.salePrice !== null ? toStoredPrice(data.salePrice as number) : null)
  }
  if (data.stockQuantity !== undefined) {
    updates.push('stock_quantity = ?')
    values.push(data.stockQuantity)
  }
  if (data.attributes !== undefined) {
    updates.push('attributes = ?')
    values.push(data.attributes ? JSON.stringify(data.attributes) : null)
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?')
    values.push(data.isActive ? 1 : 0)
  }

  if (updates.length > 0) {
    updates.push('updated_at = datetime(\'now\')')
    values.push(variantId)
    await db.prepare(`UPDATE product_variants SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
  }

  const product = await db.prepare('SELECT slug FROM products WHERE id = ?').bind(variant.product_id).first<{ slug: string }>()
  if (product) {
    await deleteCache(kv, `product:slug:${product.slug}`)
    await deleteCacheByPrefix(kv, 'products:list:')
  }
  await createAuditLog(db, { userId: adminId, action: 'UPDATE_VARIANT', entity: 'product_variants', entityId: variantId, changes: JSON.stringify(data) })

  const updated = await db.prepare('SELECT * FROM product_variants WHERE id = ?').bind(variantId).first<VariantRow>()
  return formatVariant(updated!)
}

export async function deleteVariant(variantId: string, adminId: string, db: D1Database, kv: KVNamespace) {
  const variant = await db.prepare('SELECT * FROM product_variants WHERE id = ? AND deleted_at IS NULL').bind(variantId).first<VariantRow>()
  if (!variant) throw new Error('VARIANT_NOT_FOUND')

  const inOrders = await db
    .prepare('SELECT id FROM order_items WHERE variant_id = ? LIMIT 1')
    .bind(variantId)
    .first()

  if (inOrders) throw new Error('VARIANT_IN_ACTIVE_ORDERS')

  await db.prepare('UPDATE product_variants SET deleted_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?').bind(variantId).run()

  const product = await db.prepare('SELECT slug FROM products WHERE id = ?').bind(variant.product_id).first<{ slug: string }>()
  if (product) {
    await deleteCache(kv, `product:slug:${product.slug}`)
    await deleteCacheByPrefix(kv, 'products:list:')
  }
  await createAuditLog(db, { userId: adminId, action: 'DELETE_VARIANT', entity: 'product_variants', entityId: variantId })
}

export async function adjustStock(
  productId: string,
  variantId: string | null,
  change: number,
  reason: string | undefined,
  userId: string,
  db: D1Database,
  kv: KVNamespace
) {
  if (variantId) {
    const variant = await db.prepare('SELECT * FROM product_variants WHERE id = ? AND deleted_at IS NULL').bind(variantId).first<VariantRow>()
    if (!variant) throw new Error('VARIANT_NOT_FOUND')

    const newStock = variant.stock_quantity + change
    if (newStock < 0) throw new Error('INSUFFICIENT_STOCK')

    await db.prepare('UPDATE product_variants SET stock_quantity = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(newStock, variantId).run()

    const product = await db.prepare('SELECT id, slug, low_stock_threshold FROM products WHERE id = ?').bind(productId).first<{ id: string; slug: string; low_stock_threshold: number }>()
    if (product) {
      const totalVariantStock = await db.prepare('SELECT COALESCE(SUM(stock_quantity), 0) as total FROM product_variants WHERE product_id = ? AND deleted_at IS NULL').bind(productId).first<{ total: number }>()
      await db.prepare('UPDATE products SET stock_quantity = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(totalVariantStock?.total ?? 0, productId).run()
    }

    await db
      .prepare('INSERT INTO inventory_logs (id, product_id, variant_id, change_type, quantity, previous_stock, new_stock, reason, performed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), productId, variantId, change > 0 ? 'RESTOCK' : 'ADJUSTMENT', change, variant.stock_quantity, newStock, reason ?? null, userId)
      .run()

    if (product) {
      await deleteCache(kv, `product:slug:${product.slug}`)
      await deleteCacheByPrefix(kv, 'products:list:')
    }
  } else {
    const product = await db.prepare('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL').bind(productId).first<ProductRow>()
    if (!product) throw new Error('PRODUCT_NOT_FOUND')

    const newStock = product.stock_quantity + change
    if (newStock < 0) throw new Error('INSUFFICIENT_STOCK')

    await db.prepare('UPDATE products SET stock_quantity = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(newStock, productId).run()

    await db
      .prepare('INSERT INTO inventory_logs (id, product_id, variant_id, change_type, quantity, previous_stock, new_stock, reason, performed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), productId, null, change > 0 ? 'RESTOCK' : 'ADJUSTMENT', change, product.stock_quantity, newStock, reason ?? null, userId)
      .run()

    await deleteCache(kv, `product:slug:${product.slug}`)
    await deleteCacheByPrefix(kv, 'products:list:')
  }
}

export async function searchProducts(query: string, page: number, limit: number, db: D1Database) {
  const terms = query.trim().split(/\s+/)
  const conditions: string[] = ['p.deleted_at IS NULL', 'p.is_active = 1']
  const params: unknown[] = []

  for (const term of terms) {
    conditions.push('(p.name LIKE ? OR p.short_description LIKE ? OR p.tags LIKE ? OR p.search_vector LIKE ?)')
    const likeTerm = `%${term}%`
    params.push(likeTerm, likeTerm, likeTerm, likeTerm)
  }

  const whereClause = conditions.join(' AND ')
  const { skip } = parsePagination({ page: String(page), limit: String(limit) })

  const countResult = await db.prepare(`SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`).bind(...params).first<{ total: number }>()
  const total = countResult?.total ?? 0

  const products = await db
    .prepare(`SELECT p.* FROM products p WHERE ${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`)
    .bind(...params, limit, skip)
    .all<ProductRow>()

  const pagination = buildPaginationResult(total, page, limit)

  const productIds = products.results.map((p) => p.id)
  let images: ProductImageRow[] = []
  if (productIds.length > 0) {
    const imageResults = await db
      .prepare('SELECT * FROM product_images WHERE product_id IN (' + productIds.map(() => '?').join(',') + ') ORDER BY sort_order ASC')
      .bind(...productIds)
      .all<ProductImageRow>()
    images = imageResults.results
  }

  const formatted = products.results.map((product) => {
    const productImages = images.filter((i) => i.product_id === product.id)
    return formatProduct(product, productImages)
  })

  return { products: formatted, pagination }
}
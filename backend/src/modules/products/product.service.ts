import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'
import { createAuditLog } from '../../utils/audit'
import { CACHE_TTL, getFromCache, setCache, deleteCache, deleteCacheByPrefix } from '../../utils/cache'
import { slugify, generateUniqueSlug } from '../../utils/slug'
import { parsePagination, buildPaginationResult } from '../../utils/pagination'
import { toDisplayPrice, toStoredPrice } from '../../utils/price'
import { uploadImageToCloudinary, deleteFromCloudinary } from '../../utils/upload'
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
  is_active: boolean
  is_featured: boolean
  is_digital: boolean
  track_inventory: boolean
  stock_quantity: number
  low_stock_threshold: number
  weight: number | null
  dimensions: string | null
  meta_title: string | null
  meta_description: string | null
  tags: string[] | null
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
  is_primary: boolean
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
  attributes: Record<string, string> | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface ReviewSummaryRow {
  avgRating: number
  count: number
}

function formatProduct(row: ProductRow, images: ProductImageRow[] = [], variants: VariantRow[] = [], reviewSummary?: ReviewSummaryRow) {
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
    isActive: row.is_active,
    isFeatured: row.is_featured,
    isDigital: row.is_digital,
    trackInventory: row.track_inventory,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    weight: row.weight,
    dimensions: row.dimensions,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    tags: row.tags || [],
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
    isPrimary: row.is_primary,
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
    attributes: row.attributes || {},
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getCategoryFilter(supabase: SupabaseClient, category: string): Promise<string | null> {
  const { data: bySlug } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', category)
    .is('deleted_at', null)
    .single()

  if (bySlug) return bySlug.id

  const { data: byId } = await supabase
    .from('categories')
    .select('id')
    .eq('id', category)
    .is('deleted_at', null)
    .single()

  return byId?.id ?? null
}

async function getBrandFilter(supabase: SupabaseClient, brand: string): Promise<string | null> {
  const { data: bySlug } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', brand)
    .is('deleted_at', null)
    .single()

  if (bySlug) return bySlug.id

  const { data: byId } = await supabase
    .from('brands')
    .select('id')
    .eq('id', brand)
    .is('deleted_at', null)
    .single()

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
  supabase: SupabaseClient,
  kv: KVNamespace
) {
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)

  if (!filters.isAdmin) {
    query = query.eq('is_active', true)
  }

  if (filters.category) {
    const catId = await getCategoryFilter(supabase, filters.category)
    if (catId) {
      query = query.eq('category_id', catId)
    }
  }

  if (filters.brand) {
    const brandId = await getBrandFilter(supabase, filters.brand)
    if (brandId) {
      query = query.eq('brand_id', brandId)
    }
  }

  if (filters.search) {
    const terms = filters.search.trim().split(/\s+/)
    for (const term of terms) {
      query = query.or(`name.ilike.%${term}%,short_description.ilike.%${term}%,tags.cs.{${term}}`)
    }
  }

  if (filters.minPrice !== undefined) {
    query = query.gte('base_price', toStoredPrice(filters.minPrice))
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('base_price', toStoredPrice(filters.maxPrice))
  }

  if (filters.inStock) {
    query = query.gt('stock_quantity', 0)
  }

  if (filters.featured) {
    query = query.eq('is_featured', true)
  }

  if (filters.tags) {
    const tagList = filters.tags.split(',').map((t) => t.trim()).filter(Boolean)
    for (const tag of tagList) {
      query = query.contains('tags', [tag])
    }
  }

  const ALLOWED_SORT_COLUMNS = new Set(['newest', 'price-asc', 'price-desc', 'best-seller', 'most-reviewed', 'rating'])
  const sortKey = ALLOWED_SORT_COLUMNS.has(filters.sort || '') ? (filters.sort || 'newest') : 'newest'
  switch (sortKey) {
    case 'price-asc':
      query = query.order('base_price', { ascending: true })
      break
    case 'price-desc':
      query = query.order('base_price', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { page, limit, skip } = parsePagination({ page: String(filters.page), limit: String(filters.limit) })
  query = query.range(skip, skip + limit - 1)

  const { data, error, count } = await query
  if (error) handleSupabaseError(error, 'getProducts')

  const products = (data || []) as ProductRow[]
  const total = count ?? 0

  const productIds = products.map((p) => p.id)

  let images: ProductImageRow[] = []
  let variants: VariantRow[] = []

  if (productIds.length > 0) {
    const { data: imageData, error: imgError } = await supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true })
    if (imgError) handleSupabaseError(imgError, 'getProducts.images')
    images = (imageData || []) as ProductImageRow[]

    const { data: variantData, error: varError } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
    if (varError) handleSupabaseError(varError, 'getProducts.variants')
    variants = (variantData || []) as VariantRow[]
  }

  const formatted = products.map((product) => {
    const productImages = images.filter((i) => i.product_id === product.id)
    const productVariants = variants.filter((v) => v.product_id === product.id)
    return formatProduct(product, productImages, productVariants)
  })

  const pagination = buildPaginationResult(total, page, limit)

  return { products: formatted, pagination }
}

export async function getProductsCached(
  filters: Parameters<typeof getProducts>[0],
  supabase: SupabaseClient,
  kv: KVNamespace
) {
  const sortedEntries = Object.entries(filters).sort(([a], [b]) => a.localeCompare(b))
  const filterKey = sortedEntries.map(([k, v]) => `${k}=${v}`).join('&')
  const cacheKey = `products:list:${filterKey}`

  const cached = await getFromCache<{ products: ReturnType<typeof formatProduct>[]; pagination: ReturnType<typeof buildPaginationResult> }>(kv, cacheKey)
  if (cached) return cached

  const result = await getProducts(filters, supabase, kv)
  await setCache(kv, cacheKey, result, CACHE_TTL.PRODUCT_LIST)
  return result
}

export async function searchProducts(query: string, page: number, limit: number, supabase: SupabaseClient) {
  const terms = query.trim().split(/\s+/)
  const { skip } = parsePagination({ page: String(page), limit: String(limit) })

  let queryBuilder = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .eq('is_active', true)

  for (const term of terms) {
    queryBuilder = queryBuilder.or(`name.ilike.%${term}%,short_description.ilike.%${term}%,tags.cs.{${term}}`)
  }

  const { data, error, count } = await queryBuilder
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1)

  if (error) handleSupabaseError(error, 'searchProducts')

  const products = (data || []) as ProductRow[]
  const total = count ?? 0

  const productIds = products.map((p) => p.id)
  let images: ProductImageRow[] = []
  if (productIds.length > 0) {
    const { data: imageData, error: imgError } = await supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true })
    if (imgError) handleSupabaseError(imgError, 'searchProducts.images')
    images = (imageData || []) as ProductImageRow[]
  }

  const formatted = products.map((product) => {
    const productImages = images.filter((i) => i.product_id === product.id)
    return formatProduct(product, productImages)
  })

  const pagination = buildPaginationResult(total, page, limit)

  return { products: formatted, pagination }
}

export async function getProductBySlug(slug: string, supabase: SupabaseClient, kv: KVNamespace) {
  const cacheKey = `product:slug:${slug}`
  const cached = await getFromCache<ReturnType<typeof formatProduct>>(kv, cacheKey)
  if (cached) return cached

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (error || !product) return null

  const productRow = product as ProductRow

  const { data: imageData } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productRow.id)
    .order('sort_order', { ascending: true })

  const { data: variantData } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productRow.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  const { data: reviewData } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productRow.id)
    .eq('is_approved', true)
    .is('deleted_at', null)

  const reviewSummary = reviewData && reviewData.length > 0
    ? {
        avgRating: reviewData.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewData.length,
        count: reviewData.length,
      }
    : { avgRating: 0, count: 0 }

  const images = (imageData || []) as ProductImageRow[]
  const variants = (variantData || []) as VariantRow[]

  const result = formatProduct(productRow, images, variants, reviewSummary)
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
  supabase: SupabaseClient,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const baseSlug = slugify(data.name)
  const { data: existingSlugs } = await supabase
    .from('products')
    .select('slug')
    .like('slug', `${baseSlug}%`)
  const slug = generateUniqueSlug(data.name, (existingSlugs || []).map((r: any) => r.slug))

  const basePrice = toStoredPrice(data.basePrice)
  const salePrice = data.salePrice !== undefined ? toStoredPrice(data.salePrice) : null
  const costPrice = data.costPrice !== undefined ? toStoredPrice(data.costPrice) : null

  const tags = data.tags && data.tags.length > 0 ? data.tags : null
  const searchVector = [data.name, data.shortDescription, ...(data.tags || [])].join(' ').toLowerCase()

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: data.name,
      slug,
      description: data.description ?? null,
      short_description: data.shortDescription ?? null,
      sku: data.sku ?? null,
      category_id: data.categoryId,
      brand_id: data.brandId ?? null,
      base_price: basePrice,
      sale_price: salePrice,
      cost_price: costPrice,
      currency: data.currency ?? 'NPR',
      is_active: data.isActive !== false,
      is_featured: data.isFeatured ?? false,
      is_digital: data.isDigital ?? false,
      track_inventory: data.trackInventory !== false,
      stock_quantity: data.stockQuantity ?? 0,
      low_stock_threshold: data.lowStockThreshold ?? 5,
      weight: data.weight ?? null,
      dimensions: data.dimensions ?? null,
      meta_title: data.metaTitle ?? null,
      meta_description: data.metaDescription ?? null,
      tags,
      search_vector: searchVector,
    })
    .select()
    .single()

  if (error) handleSupabaseError(error, 'createProduct')

  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(supabase, { userId: adminId, action: 'CREATE', entity: 'products', entityId: product.id })

  return formatProduct(product as ProductRow)
}

export async function updateProduct(
  id: string,
  data: Record<string, unknown>,
  adminId: string,
  supabase: SupabaseClient,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  const existingRow = existing as ProductRow
  const oldSlug = existingRow.slug
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (data.name !== undefined) {
    const baseSlug = slugify(data.name as string)
    const { data: existingSlugs } = await supabase
      .from('products')
      .select('slug')
      .like('slug', `${baseSlug}%`)
      .neq('id', id)
    const newSlug = generateUniqueSlug(data.name as string, (existingSlugs || []).map((r: any) => r.slug))
    updates.name = data.name
    updates.slug = newSlug
  }
  if (data.description !== undefined) updates.description = data.description
  if (data.shortDescription !== undefined) updates.short_description = data.shortDescription
  if (data.sku !== undefined) updates.sku = data.sku
  if (data.categoryId !== undefined) updates.category_id = data.categoryId
  if (data.brandId !== undefined) updates.brand_id = data.brandId
  if (data.basePrice !== undefined) updates.base_price = toStoredPrice(data.basePrice as number)
  if (data.salePrice !== undefined) updates.sale_price = data.salePrice !== null ? toStoredPrice(data.salePrice as number) : null
  if (data.costPrice !== undefined) updates.cost_price = data.costPrice !== null ? toStoredPrice(data.costPrice as number) : null
  if (data.currency !== undefined) updates.currency = data.currency
  if (data.isActive !== undefined) updates.is_active = data.isActive as boolean
  if (data.isFeatured !== undefined) updates.is_featured = data.isFeatured as boolean
  if (data.isDigital !== undefined) updates.is_digital = data.isDigital as boolean
  if (data.trackInventory !== undefined) updates.track_inventory = data.trackInventory as boolean
  if (data.stockQuantity !== undefined) updates.stock_quantity = data.stockQuantity
  if (data.lowStockThreshold !== undefined) updates.low_stock_threshold = data.lowStockThreshold
  if (data.weight !== undefined) updates.weight = data.weight
  if (data.dimensions !== undefined) updates.dimensions = data.dimensions
  if (data.metaTitle !== undefined) updates.meta_title = data.metaTitle
  if (data.metaDescription !== undefined) updates.meta_description = data.metaDescription
  if (data.tags !== undefined) {
    const tags = data.tags as string[]
    updates.tags = tags.length > 0 ? tags : null
  }

  const { data: product, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'updateProduct')

  await deleteCache(kv, `product:slug:${oldSlug}`)
  if (data.name !== undefined) {
    const newSlug = (product as ProductRow).slug
    await deleteCache(kv, `product:slug:${newSlug}`)
  }
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(supabase, { userId: adminId, action: 'UPDATE', entity: 'products', entityId: id, changes: data as Record<string, unknown> })

  return formatProduct(product as ProductRow)
}

export async function toggleFeatured(id: string, adminId: string, supabase: SupabaseClient, kv: KVNamespace) {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, slug, is_featured')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !product) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  const newValue = !(product as any).is_featured
  const { error } = await supabase
    .from('products')
    .update({ is_featured: newValue, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) handleSupabaseError(error, 'toggleFeatured')

  await deleteCache(kv, `product:slug:${(product as any).slug}`)
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(supabase, { userId: adminId, action: 'TOGGLE_FEATURED', entity: 'products', entityId: id })

  return { isFeatured: newValue }
}

export async function toggleHidden(id: string, adminId: string, supabase: SupabaseClient, kv: KVNamespace) {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, slug, is_active')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !product) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  const newValue = !(product as any).is_active
  const { error } = await supabase
    .from('products')
    .update({ is_active: newValue, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) handleSupabaseError(error, 'toggleHidden')

  await deleteCache(kv, `product:slug:${(product as any).slug}`)
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(supabase, { userId: adminId, action: 'TOGGLE_HIDDEN', entity: 'products', entityId: id })

  return { isActive: newValue }
}

export async function softDeleteProduct(id: string, adminId: string, supabase: SupabaseClient, kv: KVNamespace) {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, slug')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !product) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) handleSupabaseError(error, 'softDeleteProduct')

  await deleteCache(kv, `product:slug:${(product as any).slug}`)
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(supabase, { userId: adminId, action: 'SOFT_DELETE', entity: 'products', entityId: id })
}

export async function uploadProductImages(
  productId: string,
  files: File[],
  adminId: string,
  supabase: SupabaseClient,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, slug')
    .eq('id', productId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !product) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  const { count, error: countError } = await supabase
    .from('product_images')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)

  if ((count ?? 0) + files.length > 10) {
    throw new AppError('MAX_IMAGES_EXCEEDED', 400)
  }

  const { data: primaryImages } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .eq('is_primary', true)
    .limit(1)

  const hasPrimary = primaryImages && primaryImages.length > 0
  const existingCount = count ?? 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const result = await uploadImageToCloudinary(file, `products/${productId}`, env)

    const isPrimary = !hasPrimary && i === 0

    const { error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: result.url,
        public_id: result.publicId,
        alt_text: null,
        sort_order: existingCount + i,
        is_primary: isPrimary,
      })

    if (insertError) handleSupabaseError(insertError, 'uploadProductImages.insert')
  }

  await deleteCache(kv, `product:slug:${(product as any).slug}`)
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(supabase, { userId: adminId, action: 'UPLOAD_IMAGES', entity: 'products', entityId: productId })

  const { data: images, error: imgError } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (imgError) handleSupabaseError(imgError, 'uploadProductImages.fetch')
  return (images || []).map((img: ProductImageRow) => formatImage(img))
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
  adminId: string,
  supabase: SupabaseClient,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const { data: image, error: fetchError } = await supabase
    .from('product_images')
    .select('*')
    .eq('id', imageId)
    .eq('product_id', productId)
    .single()

  if (fetchError || !image) {
    throw new AppError('IMAGE_NOT_FOUND', 404)
  }

  const imageRow = image as ProductImageRow

  if (imageRow.public_id) {
    await deleteFromCloudinary(imageRow.public_id, env)
  }

  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (deleteError) handleSupabaseError(deleteError, 'deleteProductImage.delete')

  if (imageRow.is_primary) {
    const { data: nextImage } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .single()

    if (nextImage) {
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', nextImage.id)
    }
  }

  const { data: product } = await supabase
    .from('products')
    .select('slug')
    .eq('id', productId)
    .single()

  if (product) {
    await deleteCache(kv, `product:slug:${(product as any).slug}`)
    await deleteCacheByPrefix(kv, 'products:list:')
  }
  await createAuditLog(supabase, { userId: adminId, action: 'DELETE_IMAGE', entity: 'products', entityId: productId })

  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  return (images || []).map((img: ProductImageRow) => formatImage(img))
}

export async function getProductVariants(productId: string, supabase: SupabaseClient) {
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) handleSupabaseError(error, 'getProductVariants')

  return (variants || []).map((v: VariantRow) => formatVariant(v))
}

export async function addVariant(
  productId: string,
  data: { name: string; sku?: string; price: number; salePrice?: number; stockQuantity?: number; attributes?: Record<string, string> },
  adminId: string,
  supabase: SupabaseClient,
  kv: KVNamespace
) {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, slug')
    .eq('id', productId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !product) {
    throw new AppError('PRODUCT_NOT_FOUND', 404)
  }

  const price = toStoredPrice(data.price)
  const salePrice = data.salePrice !== undefined ? toStoredPrice(data.salePrice) : null
  const attributes = data.attributes || null

  const { data: variant, error } = await supabase
    .from('product_variants')
    .insert({
      product_id: productId,
      name: data.name,
      sku: data.sku ?? null,
      price,
      sale_price: salePrice,
      stock_quantity: data.stockQuantity ?? 0,
      attributes,
      is_active: true,
    })
    .select()
    .single()

  if (error) handleSupabaseError(error, 'addVariant')

  await deleteCache(kv, `product:slug:${(product as any).slug}`)
  await deleteCacheByPrefix(kv, 'products:list:')
  await createAuditLog(supabase, { userId: adminId, action: 'ADD_VARIANT', entity: 'products', entityId: productId })

  return formatVariant(variant as VariantRow)
}

export async function updateVariant(
  variantId: string,
  data: Record<string, unknown>,
  adminId: string,
  supabase: SupabaseClient,
  kv: KVNamespace
) {
  const { data: variant, error: fetchError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('id', variantId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !variant) {
    throw new AppError('VARIANT_NOT_FOUND', 404)
  }

  const variantRow = variant as VariantRow
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (data.name !== undefined) updates.name = data.name
  if (data.sku !== undefined) updates.sku = data.sku
  if (data.price !== undefined) updates.price = toStoredPrice(data.price as number)
  if (data.salePrice !== undefined) updates.sale_price = data.salePrice !== null ? toStoredPrice(data.salePrice as number) : null
  if (data.stockQuantity !== undefined) updates.stock_quantity = data.stockQuantity
  if (data.attributes !== undefined) updates.attributes = data.attributes ? data.attributes : null
  if (data.isActive !== undefined) updates.is_active = data.isActive as boolean

  const { data: updated, error } = await supabase
    .from('product_variants')
    .update(updates)
    .eq('id', variantId)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'updateVariant')

  const { data: product } = await supabase
    .from('products')
    .select('slug')
    .eq('id', variantRow.product_id)
    .single()

  if (product) {
    await deleteCache(kv, `product:slug:${(product as any).slug}`)
    await deleteCacheByPrefix(kv, 'products:list:')
  }
  await createAuditLog(supabase, { userId: adminId, action: 'UPDATE_VARIANT', entity: 'product_variants', entityId: variantId, changes: data as Record<string, unknown> })

  return formatVariant(updated as VariantRow)
}

export async function deleteVariant(variantId: string, adminId: string, supabase: SupabaseClient, kv: KVNamespace) {
  const { data: variant, error: fetchError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('id', variantId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !variant) {
    throw new AppError('VARIANT_NOT_FOUND', 404)
  }

  const variantRow = variant as VariantRow

  const { data: inOrders } = await supabase
    .from('order_items')
    .select('id')
    .eq('variant_id', variantId)
    .limit(1)

  if (inOrders && inOrders.length > 0) {
    throw new AppError('VARIANT_IN_ACTIVE_ORDERS', 400)
  }

  const { error } = await supabase
    .from('product_variants')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', variantId)

  if (error) handleSupabaseError(error, 'deleteVariant')

  const { data: product } = await supabase
    .from('products')
    .select('slug')
    .eq('id', variantRow.product_id)
    .single()

  if (product) {
    await deleteCache(kv, `product:slug:${(product as any).slug}`)
    await deleteCacheByPrefix(kv, 'products:list:')
  }
  await createAuditLog(supabase, { userId: adminId, action: 'DELETE_VARIANT', entity: 'product_variants', entityId: variantId })
}

export async function adjustStock(
  productId: string,
  variantId: string | null,
  change: number,
  reason: string | undefined,
  userId: string,
  supabase: SupabaseClient,
  kv: KVNamespace
) {
  if (variantId) {
    const { data: variant, error: varError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('id', variantId)
      .is('deleted_at', null)
      .single()

    if (varError || !variant) {
      throw new AppError('VARIANT_NOT_FOUND', 404)
    }

    const variantRow = variant as VariantRow
    const newStock = variantRow.stock_quantity + change
    if (newStock < 0) {
      throw new AppError('INSUFFICIENT_STOCK', 400)
    }

    await supabase
      .from('product_variants')
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq('id', variantId)

    const { data: product } = await supabase
      .from('products')
      .select('id, slug, low_stock_threshold')
      .eq('id', productId)
      .single()

    if (product) {
      const { data: totalResult } = await supabase
        .from('product_variants')
        .select('stock_quantity')
        .eq('product_id', productId)
        .is('deleted_at', null)

      const totalVariantStock = (totalResult || []).reduce((sum: number, v: any) => sum + v.stock_quantity, 0)
      await supabase
        .from('products')
        .update({ stock_quantity: totalVariantStock, updated_at: new Date().toISOString() })
        .eq('id', productId)
    }

    await supabase
      .from('inventory_logs')
      .insert({
        product_id: productId,
        variant_id: variantId,
        change_type: change > 0 ? 'RESTOCK' : 'ADJUSTMENT',
        quantity: change,
        previous_stock: variantRow.stock_quantity,
        new_stock: newStock,
        reason: reason ?? null,
        performed_by: userId,
      })

    if (product) {
      await deleteCache(kv, `product:slug:${(product as any).slug}`)
      await deleteCacheByPrefix(kv, 'products:list:')
    }
  } else {
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .is('deleted_at', null)
      .single()

    if (prodError || !product) {
      throw new AppError('PRODUCT_NOT_FOUND', 404)
    }

    const productRow = product as ProductRow
    const newStock = productRow.stock_quantity + change
    if (newStock < 0) {
      throw new AppError('INSUFFICIENT_STOCK', 400)
    }

    await supabase
      .from('products')
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq('id', productId)

    await supabase
      .from('inventory_logs')
      .insert({
        product_id: productId,
        variant_id: null,
        change_type: change > 0 ? 'RESTOCK' : 'ADJUSTMENT',
        quantity: change,
        previous_stock: productRow.stock_quantity,
        new_stock: newStock,
        reason: reason ?? null,
        performed_by: userId,
      })

    await deleteCache(kv, `product:slug:${productRow.slug}`)
    await deleteCacheByPrefix(kv, 'products:list:')
  }
}
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../utils/supabase'
import { createAuditLog } from '../../utils/audit'
import { CACHE_TTL, getFromCache, setCache, deleteCache, deleteCacheByPrefix } from '../../utils/cache'
import { slugify, generateUniqueSlug } from '../../utils/slug'
import { uploadImageToCloudinary, deleteFromCloudinary } from '../../utils/upload'
import type { CloudflareBindings } from '../../types/bindings'

interface BrandRow {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  website: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface BrandWithProductCount extends BrandRow {
  product_count: number
}

interface BrandFilters {
  isActive?: boolean
}

function mapRowToBrand(row: BrandRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    website: row.website,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapRowToBrandDetail(row: BrandWithProductCount) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    website: row.website,
    isActive: row.is_active,
    productCount: row.product_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function invalidateBrandCache(kv: KVNamespace) {
  await Promise.all([
    deleteCache(kv, 'brands:all'),
    deleteCacheByPrefix(kv, 'brands:slug:'),
  ])
}

export async function getAllBrandsCached(
  supabase: SupabaseClient,
  kv: KVNamespace,
  filters?: BrandFilters
): Promise<ReturnType<typeof mapRowToBrand>[]> {
  const cacheKey = filters?.isActive !== undefined
    ? `brands:all:${filters.isActive ? 'active' : 'inactive'}`
    : 'brands:all'

  const cached = await getFromCache<ReturnType<typeof mapRowToBrand>[]>(kv, cacheKey)
  if (cached) return cached

  let query = supabase
    .from('brands')
    .select('*')
    .is('deleted_at', null)

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  query = query.order('name', { ascending: true })

  const { data, error } = await query
  if (error) throw new AppError('Failed to fetch brands', 500)

  const mapped = (data as BrandRow[]).map(mapRowToBrand)
  await setCache(kv, cacheKey, mapped, CACHE_TTL.BRANDS)
  return mapped
}

export async function getBrandBySlug(
  slug: string,
  supabase: SupabaseClient,
  kv: KVNamespace
): Promise<ReturnType<typeof mapRowToBrandDetail> | null> {
  const cacheKey = `brands:slug:${slug}`
  const cached = await getFromCache<ReturnType<typeof mapRowToBrandDetail>>(kv, cacheKey)
  if (cached) return cached

  const { data: brand, error } = await supabase
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  if (error || !brand) return null

  const brandRow = brand as BrandRow

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brandRow.id)
    .eq('is_active', true)
    .is('deleted_at', null)

  const result = mapRowToBrandDetail({
    ...brandRow,
    product_count: productCount ?? 0,
  })

  await setCache(kv, cacheKey, result, CACHE_TTL.BRANDS)
  return result
}

export async function createBrand(
  supabase: SupabaseClient,
  data: { name: string; description?: string; logoUrl?: string; website?: string },
  adminUserId: string,
  kv: KVNamespace
) {
  const { data: existingSlugs } = await supabase
    .from('brands')
    .select('slug')
    .is('deleted_at', null)

  const slug = generateUniqueSlug(data.name, (existingSlugs || []).map(r => r.slug))

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const insertData: Record<string, unknown> = {
    id,
    name: data.name,
    slug,
    description: data.description ?? null,
    logo_url: data.logoUrl ?? null,
    website: data.website ?? null,
    is_active: true,
    created_at: now,
    updated_at: now,
  }

  const { error } = await supabase.from('brands').insert(insertData)
  if (error) throw new AppError('Failed to create brand', 500)

  await invalidateBrandCache(kv)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'brands',
    entityId: id,
    changes: data,
  })

  const { data: created } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single()

  return mapRowToBrand(created as BrandRow)
}

export async function updateBrand(
  supabase: SupabaseClient,
  id: string,
  data: { name?: string; description?: string | null; logoUrl?: string; website?: string | null },
  adminUserId: string,
  kv: KVNamespace
) {
  const { data: existing, error: fetchError } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('BRAND_NOT_FOUND', 404)
  }

  const row = existing as BrandRow
  const updates: Record<string, unknown> = {}
  let newSlug = row.slug

  if (data.name !== undefined && data.name !== row.name) {
    const { data: existingSlugs } = await supabase
      .from('brands')
      .select('slug')
      .is('deleted_at', null)
      .neq('id', id)

    newSlug = generateUniqueSlug(data.name, (existingSlugs || []).map(r => r.slug))
    updates.name = data.name
    updates.slug = newSlug
  }

  if (data.description !== undefined) {
    updates.description = data.description ?? null
  }

  if (data.logoUrl !== undefined) {
    updates.logo_url = data.logoUrl ?? null
  }

  if (data.website !== undefined) {
    updates.website = data.website ?? null
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('brands')
      .update(updates)
      .eq('id', id)

    if (updateError) throw new AppError('Failed to update brand', 500)
  }

  await invalidateBrandCache(kv)
  if (newSlug !== row.slug) {
    await deleteCache(kv, `brands:slug:${row.slug}`)
  }

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'brands',
    entityId: id,
    changes: data,
  })

  const { data: updated } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single()

  return mapRowToBrand(updated as BrandRow)
}

export async function deleteBrand(
  supabase: SupabaseClient,
  id: string,
  adminUserId: string,
  kv: KVNamespace
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('BRAND_NOT_FOUND', 404)
  }

  const row = existing as BrandRow

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', id)
    .eq('is_active', true)
    .is('deleted_at', null)

  if (productCount && productCount > 0) {
    throw new AppError('BRAND_HAS_PRODUCTS', 409)
  }

  const now = new Date().toISOString()
  const { error: deleteError } = await supabase
    .from('brands')
    .update({ deleted_at: now, is_active: false, updated_at: now })
    .eq('id', id)

  if (deleteError) throw new AppError('Failed to delete brand', 500)

  await invalidateBrandCache(kv)
  await deleteCache(kv, `brands:slug:${row.slug}`)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'brands',
    entityId: id,
    changes: { name: row.name },
  })
}
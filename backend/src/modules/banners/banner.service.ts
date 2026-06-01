import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'
import { CACHE_TTL, getFromCache, setCache, deleteCacheByPrefix } from '../../utils/cache'
import { createAuditLog } from '../../utils/audit'
import { uploadImageToCloudinary } from '../../utils/upload'
import type { CloudflareBindings } from '../../types/bindings'

interface BannerRow {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  link_url: string | null
  position: string
  sort_order: number
  is_active: boolean
  starts_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

function formatBanner(row: BannerRow) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    position: row.position,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function bustBannerCache(kv: KVNamespace) {
  await deleteCacheByPrefix(kv, 'banners:')
}

export async function getActiveBanners(
  supabase: SupabaseClient,
  kv: KVNamespace,
  position?: string
) {
  const cacheKey = position ? `banners:position:${position}` : 'banners:list'
  const cached = await getFromCache<BannerRow[]>(kv, cacheKey)
  if (cached) {
    return cached.map(formatBanner)
  }

  const now = new Date().toISOString()
  let query = supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .order('sort_order', { ascending: true })

  if (position) {
    query = query.eq('position', position)
  }

  const { data, error } = await query

  if (error) handleSupabaseError(error, 'getActiveBanners')

  const banners = (data || []) as BannerRow[]
  await setCache(kv, cacheKey, banners, CACHE_TTL.BANNERS)

  return banners.map(formatBanner)
}

export async function getAllBanners(
  filters: { position?: string; page: number; limit: number },
  supabase: SupabaseClient
) {
  const from = (filters.page - 1) * filters.limit
  const to = from + filters.limit - 1

  let query = supabase
    .from('banners')
    .select('*', { count: 'exact' })

  if (filters.position) {
    query = query.eq('position', filters.position)
  }

  const { data, error, count } = await query
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) handleSupabaseError(error, 'getAllBanners')

  const banners = (data || []).map((row: BannerRow) => formatBanner(row))

  return {
    banners,
    total: count || 0,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil((count || 0) / filters.limit),
  }
}

export async function createBanner(
  data: {
    title: string
    subtitle?: string
    imageUrl: string
    linkUrl?: string
    position: string
    sortOrder: number
    startsAt?: string
    expiresAt?: string
  },
  adminUserId: string,
  supabase: SupabaseClient,
  kv: KVNamespace
) {
  const { data: banner, error } = await supabase
    .from('banners')
    .insert({
      title: data.title,
      subtitle: data.subtitle ?? null,
      image_url: data.imageUrl,
      link_url: data.linkUrl ?? null,
      position: data.position,
      sort_order: data.sortOrder ?? 0,
      is_active: true,
      starts_at: data.startsAt ?? null,
      expires_at: data.expiresAt ?? null,
    })
    .select()
    .single()

  if (error) handleSupabaseError(error, 'createBanner')

  await bustBannerCache(kv)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'banners',
    entityId: banner.id,
    changes: data,
  })

  return formatBanner(banner as BannerRow)
}

export async function updateBanner(
  id: string,
  data: Record<string, any>,
  adminUserId: string,
  supabase: SupabaseClient,
  kv: KVNamespace
) {
  const { data: existing, error: fetchError } = await supabase
    .from('banners')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new AppError('Banner not found', 404, 'BANNER_NOT_FOUND')
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (data.title !== undefined) updates.title = data.title
  if (data.subtitle !== undefined) updates.subtitle = data.subtitle
  if (data.imageUrl !== undefined) updates.image_url = data.imageUrl
  if (data.linkUrl !== undefined) updates.link_url = data.linkUrl
  if (data.position !== undefined) updates.position = data.position
  if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder
  if (data.isActive !== undefined) updates.is_active = data.isActive
  if (data.startsAt !== undefined) updates.starts_at = data.startsAt
  if (data.expiresAt !== undefined) updates.expires_at = data.expiresAt

  const { data: banner, error } = await supabase
    .from('banners')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'updateBanner')

  await bustBannerCache(kv)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'banners',
    entityId: id,
    changes: data,
  })

  return formatBanner(banner as BannerRow)
}

export async function deleteBanner(
  id: string,
  adminUserId: string,
  supabase: SupabaseClient,
  kv: KVNamespace
) {
  const { data: existing, error: fetchError } = await supabase
    .from('banners')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new AppError('Banner not found', 404, 'BANNER_NOT_FOUND')
  }

  const { error } = await supabase
    .from('banners')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) handleSupabaseError(error, 'deleteBanner')

  await bustBannerCache(kv)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'SOFT_DELETE',
    entity: 'banners',
    entityId: id,
  })
}

export async function reorderBanners(
  items: { id: string; sortOrder: number }[],
  adminUserId: string,
  supabase: SupabaseClient,
  kv: KVNamespace
) {
  const updates = items.map((item) =>
    supabase
      .from('banners')
      .update({ sort_order: item.sortOrder, updated_at: new Date().toISOString() })
      .eq('id', item.id)
  )

  await Promise.all(updates.map((q) => q))

  await bustBannerCache(kv)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'REORDER',
    entity: 'banners',
    changes: { items },
  })

  const { data: banners, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) handleSupabaseError(error, 'reorderBanners')

  return (banners || []).map((row: BannerRow) => formatBanner(row))
}

export async function uploadBannerImage(file: File, env: CloudflareBindings): Promise<{ url: string; publicId: string }> {
  const result = await uploadImageToCloudinary(file, 'banners', env)
  return { url: result.url, publicId: result.publicId }
}
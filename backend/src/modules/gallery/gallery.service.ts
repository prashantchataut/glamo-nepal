import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'
import { CACHE_TTL, getFromCache, setCache, deleteCacheByPrefix } from '../../utils/cache'
import { createAuditLog } from '../../utils/audit'

const CACHE_PREFIX = 'gallery:'

export async function getGalleryItems(
  supabase: SupabaseClient,
  kv: KVNamespace,
  filters?: { category?: string }
) {
  const cacheKey = `${CACHE_PREFIX}list:${filters?.category || 'all'}`
  const cached = await getFromCache<any>(kv, cacheKey)
  if (cached) return cached

  let query = supabase
    .from('gallery_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  const { data, error } = await query

  if (error) handleSupabaseError(error, 'getGalleryItems')

  await setCache(kv, cacheKey, data || [], CACHE_TTL.BANNERS)
  return data || []
}

export async function createGalleryItem(supabase: SupabaseClient, data: any, adminUserId: string) {
  const insertData: Record<string, any> = {
    title: data.title,
    description: data.description ?? null,
    image_url: data.imageUrl,
    category: data.category ?? null,
    sort_order: data.sortOrder ?? 0,
    is_active: true,
  }

  const { data: item, error } = await supabase
    .from('gallery_items')
    .insert(insertData)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'createGalleryItem')

  await deleteCacheByPrefix(kv, CACHE_PREFIX).catch(() => {})

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'gallery_item',
    entityId: item.id,
    changes: data,
  })

  return item
}

export async function updateGalleryItem(supabase: SupabaseClient, id: string, data: any, adminUserId: string) {
  const updateData: Record<string, any> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl
  if (data.category !== undefined) updateData.category = data.category
  if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder

  const { data: item, error } = await supabase
    .from('gallery_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'updateGalleryItem')
  if (!item) throw new AppError('Gallery item not found', 404)

  const kv = (supabase as any).kv as KVNamespace | undefined
  if (kv) await deleteCacheByPrefix(kv, CACHE_PREFIX).catch(() => {})

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'gallery_item',
    entityId: id,
    changes: data,
  })

  return item
}

export async function deleteGalleryItem(supabase: SupabaseClient, id: string, adminUserId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('gallery_items')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError) handleSupabaseError(fetchError, 'fetchGalleryItemForDelete')
  if (!existing) throw new AppError('Gallery item not found', 404)

  const { error } = await supabase
    .from('gallery_items')
    .delete()
    .eq('id', id)

  if (error) handleSupabaseError(error, 'deleteGalleryItem')

  const kv = (supabase as any).kv as KVNamespace | undefined
  if (kv) await deleteCacheByPrefix(kv, CACHE_PREFIX).catch(() => {})

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'gallery_item',
    entityId: id,
  })
}

export async function reorderGalleryItems(supabase: SupabaseClient, items: { id: string; sortOrder: number }[], adminUserId: string) {
  const updates = items.map(item =>
    supabase
      .from('gallery_items')
      .update({ sort_order: item.sortOrder })
      .eq('id', item.id)
  )

  const results = await Promise.all(updates)
  for (const { error } of results) {
    if (error) handleSupabaseError(error, 'reorderGalleryItems')
  }

  const kv = (supabase as any).kv as KVNamespace | undefined
  if (kv) await deleteCacheByPrefix(kv, CACHE_PREFIX).catch(() => {})

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'REORDER',
    entity: 'gallery_items',
    changes: { items },
  })
}
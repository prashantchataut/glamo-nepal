import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'
import { CACHE_TTL, getFromCache, setCache, deleteCacheByPrefix } from '../../utils/cache'
import { createAuditLog } from '../../utils/audit'

const CACHE_PREFIX = 'popup:'

export async function getActivePopup(supabase: SupabaseClient, kv: KVNamespace) {
  const cacheKey = `${CACHE_PREFIX}active`
  const cached = await getFromCache<any>(kv, cacheKey)
  if (cached) return cached

  const { data, error } = await supabase
    .from('popups')
    .select('*')
    .eq('is_active', true)
    .or('starts_at.is.null,starts_at.lte.now()')
    .or('expires_at.is.null,expires_at.gte.now()')
    .limit(1)
    .maybeSingle()

  if (error) handleSupabaseError(error, 'getActivePopup')

  const result = data
    ? { ...data, cookieDays: data.cookie_days }
    : null

  if (result) {
    await setCache(kv, cacheKey, result, CACHE_TTL.POPUP)
  }

  return result
}

export async function getAllPopups(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('popups')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) handleSupabaseError(error, 'getAllPopups')
  return data
}

export async function createPopup(supabase: SupabaseClient, data: any, adminUserId: string, kv: KVNamespace) {
  const { error: deactivateError } = await supabase
    .from('popups')
    .update({ is_active: false })
    .eq('is_active', true)

  if (deactivateError) handleSupabaseError(deactivateError, 'deactivatePopups')

  const insertData: Record<string, any> = {
    title: data.title,
    content: data.content,
    image_url: data.imageUrl ?? null,
    link_url: data.linkUrl ?? null,
    trigger_type: data.triggerType ?? 'ON_LOAD',
    delay_ms: data.delayMs ?? 0,
    cookie_days: data.cookieDays ?? null,
    starts_at: data.startsAt ?? null,
    expires_at: data.expiresAt ?? null,
    is_active: true,
  }

  const { data: popup, error } = await supabase
    .from('popups')
    .insert(insertData)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'createPopup')

  await deleteCacheByPrefix(kv, CACHE_PREFIX).catch(() => {})

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'popup',
    entityId: popup.id,
    changes: data,
  })

  return popup
}

export async function updatePopup(supabase: SupabaseClient, id: string, data: any, adminUserId: string, kv: KVNamespace) {
  const updateData: Record<string, any> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl
  if (data.linkUrl !== undefined) updateData.link_url = data.linkUrl
  if (data.triggerType !== undefined) updateData.trigger_type = data.triggerType
  if (data.delayMs !== undefined) updateData.delay_ms = data.delayMs
  if (data.cookieDays !== undefined) updateData.cookie_days = data.cookieDays
  if (data.startsAt !== undefined) updateData.starts_at = data.startsAt
  if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt

  const { data: popup, error } = await supabase
    .from('popups')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'updatePopup')
  if (!popup) throw new AppError('Popup not found', 404)

  await deleteCacheByPrefix(kv, CACHE_PREFIX).catch(() => {})

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'popup',
    entityId: id,
    changes: data,
  })

  return popup
}

export async function deletePopup(supabase: SupabaseClient, id: string, adminUserId: string, kv: KVNamespace) {
  const { data: existing, error: fetchError } = await supabase
    .from('popups')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError) handleSupabaseError(fetchError, 'fetchPopupForDelete')
  if (!existing) throw new AppError('Popup not found', 404)

  const { error } = await supabase
    .from('popups')
    .delete()
    .eq('id', id)

  if (error) handleSupabaseError(error, 'deletePopup')

  await deleteCacheByPrefix(kv, CACHE_PREFIX).catch(() => {})

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'popup',
    entityId: id,
  })
}
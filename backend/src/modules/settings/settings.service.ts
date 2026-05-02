import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../utils/supabase'
import { CACHE_TTL, getFromCache, setCache, deleteCacheByPrefix } from '../../utils/cache'
import { createAuditLog } from '../../utils/audit'

const PUBLIC_KEYS = ['announcement_texts', 'free_shipping_threshold', 'contact_info', 'delivery_fees']

const SETTING_TYPE_MAP: Record<string, string> = {
  free_shipping_threshold: 'number',
  cod_fee: 'number',
  delivery_fees: 'object',
  announcement_texts: 'object',
  contact_info: 'object',
  maintenance_mode: 'boolean',
  max_cart_item_quantity: 'number',
  review_auto_approve: 'boolean',
  low_stock_threshold_default: 'number',
}

interface SettingRow {
  id: string
  key: string
  value: any
  group_name: string
  created_at: string
  updated_at: string
}

export async function getPublicSettings(supabase: SupabaseClient, kv: KVNamespace) {
  const cacheKey = 'settings:public'
  const cached = await getFromCache<Record<string, any>>(kv, cacheKey)
  if (cached) return cached

  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', PUBLIC_KEYS)

  if (error) throw new AppError('Failed to fetch public settings', 500)

  const settings: Record<string, any> = {}
  for (const row of data as Pick<SettingRow, 'key' | 'value'>[]) {
    settings[row.key] = row.value
  }

  await setCache(kv, cacheKey, settings, CACHE_TTL.SETTINGS)

  return settings
}

export async function getAllSettings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('group_name', { ascending: true })

  if (error) throw new AppError('Failed to fetch settings', 500)

  return (data as SettingRow[]).map(formatSetting)
}

export async function updateSettings(supabase: SupabaseClient, settings: { key: string; value: any }[], adminUserId: string, kv: KVNamespace) {
  const validKeys = Object.keys(SETTING_TYPE_MAP)

  for (const setting of settings) {
    if (!validKeys.includes(setting.key)) {
      throw new AppError(`Invalid setting key: ${setting.key}`, 400, 'INVALID_KEY')
    }

    const expectedType = SETTING_TYPE_MAP[setting.key]
    if (!validateType(setting.value, expectedType)) {
      throw new AppError(`Invalid value type for ${setting.key}: expected ${expectedType}`, 400, 'INVALID_TYPE')
    }
  }

  for (const setting of settings) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: setting.key,
        value: setting.value,
        group_name: getGroupName(setting.key),
      }, { onConflict: 'key' })

    if (error) throw new AppError(`Failed to update setting ${setting.key}`, 500)
  }

  await deleteCacheByPrefix(kv, 'settings:')

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'site_settings',
    changes: { settings: settings.map(s => ({ key: s.key, value: s.value })) },
  })

  return { message: 'Settings updated successfully' }
}

function validateType(value: any, expectedType: string): boolean {
  if (expectedType === 'number') return typeof value === 'number' && !isNaN(value)
  if (expectedType === 'boolean') return typeof value === 'boolean'
  if (expectedType === 'string') return typeof value === 'string'
  if (expectedType === 'object') return value !== null && typeof value === 'object'
  return true
}

function getGroupName(key: string): string {
  const groupMap: Record<string, string> = {
    free_shipping_threshold: 'shipping',
    cod_fee: 'shipping',
    delivery_fees: 'shipping',
    announcement_texts: 'general',
    contact_info: 'general',
    maintenance_mode: 'general',
    max_cart_item_quantity: 'general',
    review_auto_approve: 'general',
    low_stock_threshold_default: 'inventory',
  }
  return groupMap[key] || 'general'
}

function formatSetting(row: SettingRow) {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    groupName: row.group_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
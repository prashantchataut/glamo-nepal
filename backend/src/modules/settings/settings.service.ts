import type { Client } from '@libsql/client'
import { AppError, handleDbError, safeJsonParse } from '../../utils/turso-helpers'
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

function formatSetting(row: any) {
  return {
    id: row.id,
    key: row.key,
    value: safeJsonParse(row.value, row.value),
    groupName: row.group_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getPublicSettings(db: Client) {
  const cacheKey = 'settings:public'
  const cached = await getFromCache<Record<string, any>>(cacheKey)
  if (cached) return cached

  const placeholders = PUBLIC_KEYS.map(() => '?').join(',')
  const result = await db.execute({
    sql: `SELECT key, value FROM site_settings WHERE key IN (${placeholders})`,
    args: PUBLIC_KEYS,
  })

  const settings: Record<string, any> = {}
  for (const row of result.rows) {
    settings[String(row.key)] = safeJsonParse(row.value as string, row.value)
  }

  await setCache(cacheKey, settings, CACHE_TTL.SETTINGS)

  return settings
}

export async function getAllSettings(db: Client) {
  const result = await db.execute({
    sql: `SELECT * FROM site_settings ORDER BY group_name ASC`,
    args: [],
  })

  return result.rows.map(formatSetting)
}

export async function updateSettings(db: Client, settings: { key: string; value: any }[], adminUserId: string) {
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
    const valueStr = typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value)

    await db.execute({
      sql: `INSERT INTO site_settings (id, key, value, group_name, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
      args: [crypto.randomUUID(), setting.key, valueStr, getGroupName(setting.key), valueStr],
    })
  }

  await deleteCacheByPrefix('settings:')

  await createAuditLog(db, {
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
import type { Client } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool, toSqliteBool } from '../../utils/turso-helpers'
import { CACHE_TTL, getFromCache, setCache, deleteCacheByPrefix } from '../../utils/cache'
import { createAuditLog } from '../../utils/audit'

const CACHE_PREFIX = 'popup:'

export async function getActivePopup(db: Client) {
  const cacheKey = `${CACHE_PREFIX}active`
  const cached = await getFromCache<any>(cacheKey)
  if (cached) return cached

  const now = new Date().toISOString()

  const result = await db.execute({
    sql: `SELECT * FROM popups WHERE is_active = 1 AND (starts_at IS NULL OR starts_at <= ?) AND (expires_at IS NULL OR expires_at >= ?) ORDER BY sort_order ASC LIMIT 1`,
    args: [now, now],
  })

  const popup = result.rows[0] || null

  const mapped = popup
    ? { ...popup, cookieDays: popup.cookie_days }
    : null

  if (mapped) {
    await setCache(cacheKey, mapped, CACHE_TTL.POPUP)
  }

  return mapped
}

export async function getAllPopups(db: Client) {
  const result = await db.execute({
    sql: `SELECT * FROM popups ORDER BY created_at DESC`,
    args: [],
  })

  return result.rows
}

export async function getPopupById(db: Client, id: string) {
  const result = await db.execute({
    sql: `SELECT * FROM popups WHERE id = ?`,
    args: [id],
  })

  if (!result.rows[0]) throw new AppError('Popup not found', 404)
  return result.rows[0]
}

export async function createPopup(db: Client, data: any, adminUserId: string) {
  await db.execute({
    sql: `UPDATE popups SET is_active = 0 WHERE is_active = 1`,
    args: [],
  })

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO popups (id, title, content, image_url, link_url, trigger_type, delay_ms, cookie_days, starts_at, expires_at, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    args: [
      id, data.title, data.content, data.imageUrl ?? null, data.linkUrl ?? null,
      data.triggerType ?? 'ON_LOAD', data.delayMs ?? 0, data.cookieDays ?? null,
      data.startsAt ?? null, data.expiresAt ?? null, now, now,
    ],
  })

  await deleteCacheByPrefix(CACHE_PREFIX).catch(() => {})

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'popup',
    entityId: id,
    changes: data,
  })

  const result = await db.execute({
    sql: `SELECT * FROM popups WHERE id = ?`,
    args: [id],
  })

  return result.rows[0]
}

export async function updatePopup(db: Client, id: string, data: any, adminUserId: string) {
  const updates: string[] = []
  const args: any[] = []

  if (data.title !== undefined) { updates.push('title = ?'); args.push(data.title) }
  if (data.content !== undefined) { updates.push('content = ?'); args.push(data.content) }
  if (data.imageUrl !== undefined) { updates.push('image_url = ?'); args.push(data.imageUrl) }
  if (data.linkUrl !== undefined) { updates.push('link_url = ?'); args.push(data.linkUrl) }
  if (data.triggerType !== undefined) { updates.push('trigger_type = ?'); args.push(data.triggerType) }
  if (data.delayMs !== undefined) { updates.push('delay_ms = ?'); args.push(data.delayMs) }
  if (data.cookieDays !== undefined) { updates.push('cookie_days = ?'); args.push(data.cookieDays) }
  if (data.startsAt !== undefined) { updates.push('starts_at = ?'); args.push(data.startsAt) }
  if (data.expiresAt !== undefined) { updates.push('expires_at = ?'); args.push(data.expiresAt) }
  if (data.isActive !== undefined) { updates.push('is_active = ?'); args.push(data.isActive ? 1 : 0) }

  updates.push('updated_at = ?')
  args.push(new Date().toISOString())
  args.push(id)

  const result = await db.execute({
    sql: `UPDATE popups SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  if (result.rowsAffected === 0) throw new AppError('Popup not found', 404)

  await deleteCacheByPrefix(CACHE_PREFIX).catch(() => {})

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'popup',
    entityId: id,
    changes: data,
  })

  const popupResult = await db.execute({
    sql: `SELECT * FROM popups WHERE id = ?`,
    args: [id],
  })

  return popupResult.rows[0]
}

export async function deletePopup(db: Client, id: string, adminUserId: string) {
  const existingResult = await db.execute({
    sql: `SELECT id FROM popups WHERE id = ?`,
    args: [id],
  })

  if (!existingResult.rows[0]) throw new AppError('Popup not found', 404)

  await db.execute({
    sql: `DELETE FROM popups WHERE id = ?`,
    args: [id],
  })

  await deleteCacheByPrefix(CACHE_PREFIX).catch(() => {})

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'popup',
    entityId: id,
  })
}
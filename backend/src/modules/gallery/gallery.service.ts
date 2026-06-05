import type { Client } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool, toSqliteBool } from '../../utils/turso-helpers'
import { CACHE_TTL, getFromCache, setCache, deleteCacheByPrefix } from '../../utils/cache'
import { createAuditLog } from '../../utils/audit'

const CACHE_PREFIX = 'gallery:'

export async function getGalleryItems(
  db: Client,
  filters?: { category?: string }
) {
  const cacheKey = `${CACHE_PREFIX}list:${filters?.category || 'all'}`
  const cached = await getFromCache<any>(cacheKey)
  if (cached) return cached

  const whereClauses: string[] = ['is_active = 1']
  const args: any[] = []

  if (filters?.category) {
    whereClauses.push('category = ?')
    args.push(filters.category)
  }

  const result = await db.execute({
    sql: `SELECT * FROM gallery_items WHERE ${whereClauses.join(' AND ')} ORDER BY sort_order ASC`,
    args,
  })

  await setCache(cacheKey, result.rows, CACHE_TTL.BANNERS)
  return result.rows
}

export async function createGalleryItem(db: Client, data: any, adminUserId: string) {
  const id = crypto.randomUUID()

  await db.execute({
    sql: `INSERT INTO gallery_items (id, title, description, image_url, category, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
    args: [id, data.title, data.description ?? null, data.imageUrl, data.category ?? null, data.sortOrder ?? 0],
  })

  await deleteCacheByPrefix(CACHE_PREFIX).catch(() => {})

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'gallery_item',
    entityId: id,
    changes: data,
  })

  const result = await db.execute({
    sql: `SELECT * FROM gallery_items WHERE id = ?`,
    args: [id],
  })

  return result.rows[0]
}

export async function updateGalleryItem(db: Client, id: string, data: any, adminUserId: string) {
  const updates: string[] = []
  const args: any[] = []

  if (data.title !== undefined) { updates.push('title = ?'); args.push(data.title) }
  if (data.description !== undefined) { updates.push('description = ?'); args.push(data.description) }
  if (data.imageUrl !== undefined) { updates.push('image_url = ?'); args.push(data.imageUrl) }
  if (data.category !== undefined) { updates.push('category = ?'); args.push(data.category) }
  if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); args.push(data.sortOrder) }

  updates.push('updated_at = datetime(\'now\')')
  args.push(id)

  const result = await db.execute({
    sql: `UPDATE gallery_items SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  if (result.rowsAffected === 0) throw new AppError('Gallery item not found', 404)

  await deleteCacheByPrefix(CACHE_PREFIX).catch(() => {})

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'gallery_item',
    entityId: id,
    changes: data,
  })

  const updatedResult = await db.execute({
    sql: `SELECT * FROM gallery_items WHERE id = ?`,
    args: [id],
  })

  return updatedResult.rows[0]
}

export async function deleteGalleryItem(db: Client, id: string, adminUserId: string) {
  const existingResult = await db.execute({
    sql: `SELECT id FROM gallery_items WHERE id = ?`,
    args: [id],
  })

  if (!existingResult.rows[0]) throw new AppError('Gallery item not found', 404)

  await db.execute({
    sql: `DELETE FROM gallery_items WHERE id = ?`,
    args: [id],
  })

  await deleteCacheByPrefix(CACHE_PREFIX).catch(() => {})

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'gallery_item',
    entityId: id,
  })
}

export async function reorderGalleryItems(db: Client, items: { id: string; sortOrder: number }[], adminUserId: string) {
  for (const item of items) {
    await db.execute({
      sql: `UPDATE gallery_items SET sort_order = ? WHERE id = ?`,
      args: [item.sortOrder, item.id],
    })
  }

  await deleteCacheByPrefix(CACHE_PREFIX).catch(() => {})

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'REORDER',
    entity: 'gallery_items',
    changes: { items },
  })
}
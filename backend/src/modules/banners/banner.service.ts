import type { Client } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool, toSqliteBool } from '../../utils/turso-helpers'
import { CACHE_TTL, getFromCache, setCache, deleteCacheByPrefix } from '../../utils/cache'
import { createAuditLog } from '../../utils/audit'
import { uploadImageToCloudinary } from '../../utils/upload'
import type { CloudflareBindings } from '../../types/bindings'

function formatBanner(row: any) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    position: row.position,
    sortOrder: row.sort_order,
    isActive: fromSqliteBool(row.is_active),
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function bustBannerCache() {
  await deleteCacheByPrefix('banners:')
}

export async function getActiveBanners(
  db: Client,
  position?: string
) {
  const cacheKey = position ? `banners:position:${position}` : 'banners:list'
  const cached = await getFromCache<any[]>(cacheKey)
  if (cached) {
    return cached.map(formatBanner)
  }

  const now = new Date().toISOString()
  const whereClauses: string[] = ['is_active = 1', `(starts_at IS NULL OR starts_at <= ?)`, `(expires_at IS NULL OR expires_at >= ?)`]
  const args: any[] = [now, now]

  if (position) {
    whereClauses.push('position = ?')
    args.push(position)
  }

  const result = await db.execute({
    sql: `SELECT * FROM banners WHERE ${whereClauses.join(' AND ')} ORDER BY sort_order ASC`,
    args,
  })

  const banners = result.rows
  await setCache(cacheKey, banners, CACHE_TTL.BANNERS)

  return banners.map(formatBanner)
}

export async function getAllBanners(
  filters: { position?: string; page: number; limit: number },
  db: Client
) {
  const offset = (filters.page - 1) * filters.limit

  const whereClauses: string[] = []
  const args: any[] = []

  if (filters.position) {
    whereClauses.push('position = ?')
    args.push(filters.position)
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM banners ${whereStr}`,
    args,
  })

  const dataResult = await db.execute({
    sql: `SELECT * FROM banners ${whereStr} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`,
    args: [...args, filters.limit, offset],
  })

  const total = Number(countResult.rows[0]?.count ?? 0)
  const banners = dataResult.rows.map(formatBanner)

  return {
    banners,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
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
  db: Client
) {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO banners (id, title, subtitle, image_url, link_url, position, sort_order, is_active, starts_at, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
    args: [id, data.title, data.subtitle ?? null, data.imageUrl, data.linkUrl ?? null, data.position, data.sortOrder ?? 0, data.startsAt ?? null, data.expiresAt ?? null, now, now],
  })

  await bustBannerCache()

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'banners',
    entityId: id,
    changes: data,
  })

  const result = await db.execute({
    sql: `SELECT * FROM banners WHERE id = ?`,
    args: [id],
  })

  return formatBanner(result.rows[0])
}

export async function updateBanner(
  id: string,
  data: Record<string, any>,
  adminUserId: string,
  db: Client
) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM banners WHERE id = ?`,
    args: [id],
  })

  if (!existingResult.rows[0]) {
    throw new AppError('Banner not found', 404, 'BANNER_NOT_FOUND')
  }

  const updates: string[] = ['updated_at = ?']
  const args: any[] = [new Date().toISOString()]

  if (data.title !== undefined) { updates.push('title = ?'); args.push(data.title) }
  if (data.subtitle !== undefined) { updates.push('subtitle = ?'); args.push(data.subtitle) }
  if (data.imageUrl !== undefined) { updates.push('image_url = ?'); args.push(data.imageUrl) }
  if (data.linkUrl !== undefined) { updates.push('link_url = ?'); args.push(data.linkUrl) }
  if (data.position !== undefined) { updates.push('position = ?'); args.push(data.position) }
  if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); args.push(data.sortOrder) }
  if (data.isActive !== undefined) { updates.push('is_active = ?'); args.push(toSqliteBool(data.isActive)) }
  if (data.startsAt !== undefined) { updates.push('starts_at = ?'); args.push(data.startsAt) }
  if (data.expiresAt !== undefined) { updates.push('expires_at = ?'); args.push(data.expiresAt) }

  args.push(id)

  await db.execute({
    sql: `UPDATE banners SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  await bustBannerCache()

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'banners',
    entityId: id,
    changes: data,
  })

  const result = await db.execute({
    sql: `SELECT * FROM banners WHERE id = ?`,
    args: [id],
  })

  return formatBanner(result.rows[0])
}

export async function deleteBanner(
  id: string,
  adminUserId: string,
  db: Client
) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM banners WHERE id = ?`,
    args: [id],
  })

  if (!existingResult.rows[0]) {
    throw new AppError('Banner not found', 404, 'BANNER_NOT_FOUND')
  }

  await db.execute({
    sql: `UPDATE banners SET is_active = 0, updated_at = ? WHERE id = ?`,
    args: [new Date().toISOString(), id],
  })

  await bustBannerCache()

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'SOFT_DELETE',
    entity: 'banners',
    entityId: id,
  })
}

export async function reorderBanners(
  items: { id: string; sortOrder: number }[],
  adminUserId: string,
  db: Client
) {
  for (const item of items) {
    await db.execute({
      sql: `UPDATE banners SET sort_order = ?, updated_at = ? WHERE id = ?`,
      args: [item.sortOrder, new Date().toISOString(), item.id],
    })
  }

  await bustBannerCache()

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'REORDER',
    entity: 'banners',
    changes: { items },
  })

  const result = await db.execute({
    sql: `SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC`,
    args: [],
  })

  return result.rows.map(formatBanner)
}

export async function uploadBannerImage(file: File, env: CloudflareBindings): Promise<{ url: string; publicId: string }> {
  const result = await uploadImageToCloudinary(file, 'banners', env)
  return { url: result.url, publicId: result.publicId }
}
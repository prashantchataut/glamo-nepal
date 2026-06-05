import type { Client } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool, toSqliteBool } from '../../utils/turso-helpers'
import { createAuditLog } from '../../utils/audit'
import { CACHE_TTL, getFromCache, setCache, deleteCache, deleteCacheByPrefix } from '../../utils/cache'
import { generateUniqueSlug } from '../../utils/slug'

interface BrandRow {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  website: string | null
  is_active: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

function mapRowToBrand(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    website: row.website,
    isActive: fromSqliteBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapRowToBrandDetail(row: any, productCount: number) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    website: row.website,
    isActive: fromSqliteBool(row.is_active),
    productCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function invalidateBrandCache() {
  await Promise.all([
    deleteCache('brands:all'),
    deleteCacheByPrefix('brands:slug:'),
  ])
}

export async function getAllBrandsCached(
  db: Client,
  filters?: { isActive?: boolean }
): Promise<ReturnType<typeof mapRowToBrand>[]> {
  const cacheKey = filters?.isActive !== undefined
    ? `brands:all:${filters.isActive ? 'active' : 'inactive'}`
    : 'brands:all'

  const cached = await getFromCache<ReturnType<typeof mapRowToBrand>[]>(cacheKey)
  if (cached) return cached

  const whereClauses: string[] = ['deleted_at IS NULL']
  const args: any[] = []

  if (filters?.isActive !== undefined) {
    whereClauses.push(`is_active = ${toSqliteBool(filters.isActive)}`)
  }

  const result = await db.execute({
    sql: `SELECT * FROM brands WHERE ${whereClauses.join(' AND ')} ORDER BY name ASC`,
    args,
  })

  const mapped = result.rows.map(mapRowToBrand)
  await setCache(cacheKey, mapped, CACHE_TTL.BRANDS)
  return mapped
}

export async function getBrandBySlug(
  slug: string,
  db: Client
): Promise<ReturnType<typeof mapRowToBrandDetail> | null> {
  const cacheKey = `brands:slug:${slug}`
  const cached = await getFromCache<ReturnType<typeof mapRowToBrandDetail>>(cacheKey)
  if (cached) return cached

  const brandResult = await db.execute({
    sql: `SELECT * FROM brands WHERE slug = ? AND is_active = 1 AND deleted_at IS NULL`,
    args: [slug],
  })

  const brand = brandResult.rows[0]
  if (!brand) return null

  const productCountResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM products WHERE brand_id = ? AND is_active = 1 AND deleted_at IS NULL`,
    args: [brand.id],
  })

  const productCount = Number(productCountResult.rows[0]?.count ?? 0)
  const result = mapRowToBrandDetail(brand, productCount)

  await setCache(cacheKey, result, CACHE_TTL.BRANDS)
  return result
}

export async function createBrand(
  db: Client,
  data: { name: string; description?: string; logoUrl?: string; website?: string },
  adminUserId: string
) {
  const existingResult = await db.execute({
    sql: `SELECT slug FROM brands WHERE deleted_at IS NULL`,
    args: [],
  })

  const slug = generateUniqueSlug(data.name, existingResult.rows.map(r => String(r.slug)))

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO brands (id, name, slug, description, logo_url, website, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    args: [id, data.name, slug, data.description ?? null, data.logoUrl ?? null, data.website ?? null, now, now],
  })

  await invalidateBrandCache()

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'brands',
    entityId: id,
    changes: data,
  })

  const createdResult = await db.execute({
    sql: `SELECT * FROM brands WHERE id = ?`,
    args: [id],
  })

  return mapRowToBrand(createdResult.rows[0])
}

export async function updateBrand(
  db: Client,
  id: string,
  data: { name?: string; description?: string | null; logoUrl?: string; website?: string | null },
  adminUserId: string
) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM brands WHERE id = ? AND deleted_at IS NULL`,
    args: [id],
  })

  const existing = existingResult.rows[0]
  if (!existing) {
    throw new AppError('BRAND_NOT_FOUND', 404)
  }

  const updates: string[] = []
  const args: any[] = []
  let newSlug = String(existing.slug)

  if (data.name !== undefined && data.name !== existing.name) {
    const existingSlugsResult = await db.execute({
      sql: `SELECT slug FROM brands WHERE id != ? AND deleted_at IS NULL`,
      args: [id],
    })
    newSlug = generateUniqueSlug(data.name, existingSlugsResult.rows.map(r => String(r.slug)))
    updates.push('name = ?', 'slug = ?')
    args.push(data.name, newSlug)
  }

  if (data.description !== undefined) {
    updates.push('description = ?')
    args.push(data.description ?? null)
  }

  if (data.logoUrl !== undefined) {
    updates.push('logo_url = ?')
    args.push(data.logoUrl ?? null)
  }

  if (data.website !== undefined) {
    updates.push('website = ?')
    args.push(data.website ?? null)
  }

  if (updates.length > 0) {
    updates.push('updated_at = ?')
    args.push(new Date().toISOString())
    args.push(id)

    await db.execute({
      sql: `UPDATE brands SET ${updates.join(', ')} WHERE id = ?`,
      args,
    })
  }

  await invalidateBrandCache()
  if (newSlug !== existing.slug) {
    await deleteCache(`brands:slug:${existing.slug}`)
  }

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'brands',
    entityId: id,
    changes: data,
  })

  const updatedResult = await db.execute({
    sql: `SELECT * FROM brands WHERE id = ?`,
    args: [id],
  })

  return mapRowToBrand(updatedResult.rows[0])
}

export async function deleteBrand(
  db: Client,
  id: string,
  adminUserId: string
): Promise<void> {
  const existingResult = await db.execute({
    sql: `SELECT * FROM brands WHERE id = ? AND deleted_at IS NULL`,
    args: [id],
  })

  const existing = existingResult.rows[0]
  if (!existing) {
    throw new AppError('BRAND_NOT_FOUND', 404)
  }

  const productCountResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM products WHERE brand_id = ? AND is_active = 1 AND deleted_at IS NULL`,
    args: [id],
  })

  const productCount = Number(productCountResult.rows[0]?.count ?? 0)
  if (productCount > 0) {
    throw new AppError('BRAND_HAS_PRODUCTS', 409)
  }

  const now = new Date().toISOString()
  await db.execute({
    sql: `UPDATE brands SET deleted_at = ?, is_active = 0, updated_at = ? WHERE id = ?`,
    args: [now, now, id],
  })

  await invalidateBrandCache()
  await deleteCache(`brands:slug:${existing.slug}`)

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'brands',
    entityId: id,
    changes: { name: existing.name },
  })
}
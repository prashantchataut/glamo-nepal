import { getFromCache, setCache, deleteCache, deleteCacheByPrefix, CACHE_TTL } from '../../utils/cache'
import { slugify, generateUniqueSlug } from '../../utils/slug'
import { createAuditLog } from '../../utils/audit'

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

interface BrandWithProductCount extends BrandRow {
  product_count: number
}

export async function getAllBrands(db: D1Database, kv: KVNamespace): Promise<BrandRow[]> {
  const cacheKey = 'brands:all'
  const cached = await getFromCache<BrandRow[]>(kv, cacheKey)
  if (cached) return cached

  const { results } = await db
    .prepare('SELECT * FROM brands WHERE is_active = 1 AND deleted_at IS NULL ORDER BY name')
    .all<BrandRow>()

  await setCache(kv, cacheKey, results, CACHE_TTL.BRANDS)
  return results
}

export async function getBrandBySlug(slug: string, db: D1Database, kv: KVNamespace): Promise<BrandWithProductCount | null> {
  const cacheKey = `brands:slug:${slug}`
  const cached = await getFromCache<BrandWithProductCount>(kv, cacheKey)
  if (cached) return cached

  const brand = await db
    .prepare(
      `SELECT b.*, COUNT(p.id) as product_count
       FROM brands b
       LEFT JOIN products p ON p.brand_id = b.id AND p.is_active = 1 AND p.deleted_at IS NULL
       WHERE b.slug = ? AND b.is_active = 1 AND b.deleted_at IS NULL
       GROUP BY b.id`
    )
    .bind(slug)
    .first<BrandWithProductCount>()

  if (!brand) return null

  await setCache(kv, cacheKey, brand, CACHE_TTL.BRANDS)
  return brand
}

export async function createBrand(
  data: { name: string; description?: string; logoUrl?: string; website?: string },
  adminId: string,
  db: D1Database,
  kv: KVNamespace,
  env: { CLOUDINARY_API_SECRET: string }
): Promise<BrandRow> {
  const { results: existingSlugs } = await db
    .prepare('SELECT slug FROM brands WHERE deleted_at IS NULL')
    .all<{ slug: string }>()

  const slug = generateUniqueSlug(data.name, existingSlugs.map((r) => r.slug))

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db
    .prepare(
      `INSERT INTO brands (id, name, slug, description, logo_url, website, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
    .bind(id, data.name, slug, data.description ?? null, data.logoUrl ?? null, data.website ?? null, now, now)
    .run()

  await deleteCache(kv, 'brands:all')
  await deleteCacheByPrefix(kv, 'brands:slug:')

  await createAuditLog(db, {
    userId: adminId,
    action: 'CREATE',
    entity: 'brands',
    entityId: id,
    changes: JSON.stringify(data),
  })

  const brand = await db
    .prepare('SELECT * FROM brands WHERE id = ?')
    .bind(id)
    .first<BrandRow>()

  return brand!
}

export async function updateBrand(
  id: string,
  data: { name?: string; description?: string | null; logoUrl?: string; website?: string | null },
  adminId: string,
  db: D1Database,
  kv: KVNamespace,
  env: { CLOUDINARY_API_SECRET: string }
): Promise<BrandRow> {
  const existing = await db
    .prepare('SELECT * FROM brands WHERE id = ? AND deleted_at IS NULL')
    .bind(id)
    .first<BrandRow>()

  if (!existing) {
    throw new Error('BRAND_NOT_FOUND')
  }

  const updates: string[] = []
  const values: any[] = []
  let newSlug = existing.slug

  if (data.name !== undefined && data.name !== existing.name) {
    updates.push('name = ?')
    values.push(data.name)

    const { results: existingSlugs } = await db
      .prepare('SELECT slug FROM brands WHERE deleted_at IS NULL AND id != ?')
      .bind(id)
      .all<{ slug: string }>()

    newSlug = generateUniqueSlug(data.name, existingSlugs.map((r) => r.slug))
    updates.push('slug = ?')
    values.push(newSlug)
  }

  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description)
  }

  if (data.logoUrl !== undefined) {
    updates.push('logo_url = ?')
    values.push(data.logoUrl)
  }

  if (data.website !== undefined) {
    updates.push('website = ?')
    values.push(data.website)
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')")
    values.push(id)

    await db
      .prepare(`UPDATE brands SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run()
  }

  await deleteCache(kv, 'brands:all')
  await deleteCacheByPrefix(kv, 'brands:slug:')
  if (newSlug !== existing.slug) {
    await deleteCache(kv, `brands:slug:${existing.slug}`)
  }

  await createAuditLog(db, {
    userId: adminId,
    action: 'UPDATE',
    entity: 'brands',
    entityId: id,
    changes: JSON.stringify(data),
  })

  const brand = await db
    .prepare('SELECT * FROM brands WHERE id = ?')
    .bind(id)
    .first<BrandRow>()

  return brand!
}

export async function deleteBrand(
  id: string,
  adminId: string,
  db: D1Database,
  kv: KVNamespace
): Promise<void> {
  const existing = await db
    .prepare('SELECT * FROM brands WHERE id = ? AND deleted_at IS NULL')
    .bind(id)
    .first<BrandRow>()

  if (!existing) {
    throw new Error('BRAND_NOT_FOUND')
  }

  const productCount = await db
    .prepare('SELECT COUNT(*) as count FROM products WHERE brand_id = ? AND is_active = 1 AND deleted_at IS NULL')
    .bind(id)
    .first<{ count: number }>()

  if (productCount && productCount.count > 0) {
    throw new Error('BRAND_HAS_PRODUCTS')
  }

  await db
    .prepare("UPDATE brands SET deleted_at = datetime('now'), is_active = 0, updated_at = datetime('now') WHERE id = ?")
    .bind(id)
    .run()

  await deleteCache(kv, 'brands:all')
  await deleteCacheByPrefix(kv, 'brands:slug:')
  await deleteCache(kv, `brands:slug:${existing.slug}`)

  await createAuditLog(db, {
    userId: adminId,
    action: 'DELETE',
    entity: 'brands',
    entityId: id,
    changes: JSON.stringify({ name: existing.name }),
  })
}
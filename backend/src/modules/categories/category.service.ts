import type { Client } from '@libsql/client'
import { AppError, handleDbError, assertFound, toSqliteBool, fromSqliteBool } from '../../utils/turso-helpers'
import { createAuditLog } from '../../utils/audit'
import { CACHE_TTL, getFromCache, setCache, deleteCache, deleteCacheByPrefix } from '../../utils/cache'
import { slugify, generateUniqueSlug } from '../../utils/slug'
import { uploadImageToCloudinary, deleteFromCloudinary } from '../../utils/upload'
import type { CloudflareBindings } from '../../types/bindings'

interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  children: CategoryTreeNode[]
}

interface CategoryDetail {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  parentId: string | null
  parentName: string | null
  parentSlug: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  productCount: number
  children: CategoryTreeNode[]
}

interface CategoryFilters {
  parentId?: string | null
  isActive?: boolean
}

function mapRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    isActive: fromSqliteBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function invalidateCategoryCache() {
  await Promise.all([
    deleteCache('categories:tree'),
    deleteCacheByPrefix('categories:slug:'),
    deleteCacheByPrefix('categories:list:'),
  ])
}

export async function getCategoriesCached(
  db: Client,
  filters?: CategoryFilters
): Promise<{ tree: CategoryTreeNode[] } | { list: ReturnType<typeof mapRow>[] }> {
  if (!filters || (filters.isActive === undefined && filters.parentId === undefined)) {
    const cached = await getFromCache<CategoryTreeNode[]>('categories:tree')
    if (cached) return { tree: cached }

    const result = await db.execute({
      sql: `SELECT * FROM categories WHERE deleted_at IS NULL AND is_active = 1 ORDER BY sort_order ASC, name ASC`,
      args: [],
    })

    const categoryMap = new Map<string, CategoryTreeNode>()
    const roots: CategoryTreeNode[] = []

    for (const row of result.rows) {
      const node: CategoryTreeNode = {
        id: String(row.id),
        name: String(row.name),
        slug: String(row.slug),
        description: row.description ? String(row.description) : null,
        imageUrl: row.image_url ? String(row.image_url) : null,
        parentId: row.parent_id ? String(row.parent_id) : null,
        sortOrder: Number(row.sort_order),
        isActive: fromSqliteBool(row.is_active as number),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
        children: [],
      }
      categoryMap.set(node.id, node)
    }

    for (const node of Array.from(categoryMap.values())) {
      if (node.parentId && categoryMap.has(node.parentId)) {
        categoryMap.get(node.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    await setCache('categories:tree', roots, CACHE_TTL.CATEGORIES)
    return { tree: roots }
  }

  const sortedFilterParams = JSON.stringify(filters)
  const cacheKey = `categories:list:${sortedFilterParams}`
  const cached = await getFromCache<ReturnType<typeof mapRow>[]>(cacheKey)
  if (cached) return { list: cached }

  const whereClauses: string[] = ['deleted_at IS NULL']
  const args: any[] = []

  if (filters.parentId !== undefined) {
    if (filters.parentId === null) {
      whereClauses.push('parent_id IS NULL')
    } else {
      whereClauses.push('parent_id = ?')
      args.push(filters.parentId)
    }
  }

  if (filters.isActive !== undefined) {
    whereClauses.push('is_active = ?')
    args.push(toSqliteBool(filters.isActive))
  }

  const result = await db.execute({
    sql: `SELECT * FROM categories WHERE ${whereClauses.join(' AND ')} ORDER BY sort_order ASC, name ASC`,
    args,
  })

  const mapped = result.rows.map(mapRow)
  await setCache(cacheKey, mapped, CACHE_TTL.CATEGORIES)
  return { list: mapped }
}

export async function getCategoryTree(db: Client): Promise<CategoryTreeNode[]> {
  const result = await getCategoriesCached(db)
  if ('tree' in result) return result.tree
  return []
}

export async function getCategoryBySlug(slug: string, db: Client): Promise<CategoryDetail> {
  const cacheKey = `categories:slug:${slug}`
  const cached = await getFromCache<CategoryDetail>(cacheKey)
  if (cached) return cached

  const catResult = await db.execute({
    sql: `SELECT * FROM categories WHERE slug = ? AND is_active = 1 AND deleted_at IS NULL`,
    args: [slug],
  })

  const category = catResult.rows[0]
  if (!category) {
    throw new AppError('CATEGORY_NOT_FOUND', 404)
  }

  let parentName: string | null = null
  let parentSlug: string | null = null

  if (category.parent_id) {
    const parentResult = await db.execute({
      sql: `SELECT name, slug FROM categories WHERE id = ? AND deleted_at IS NULL`,
      args: [category.parent_id],
    })
    const parent = parentResult.rows[0]
    if (parent) {
      parentName = String(parent.name)
      parentSlug = String(parent.slug)
    }
  }

  const productCountResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1 AND deleted_at IS NULL`,
    args: [category.id],
  })

  const childrenResult = await db.execute({
    sql: `SELECT * FROM categories WHERE parent_id = ? AND is_active = 1 AND deleted_at IS NULL ORDER BY sort_order ASC, name ASC`,
    args: [category.id],
  })

  const children: CategoryTreeNode[] = childrenResult.rows.map(child => ({
    id: String(child.id),
    name: String(child.name),
    slug: String(child.slug),
    description: child.description ? String(child.description) : null,
    imageUrl: child.image_url ? String(child.image_url) : null,
    parentId: child.parent_id ? String(child.parent_id) : null,
    sortOrder: Number(child.sort_order),
    isActive: fromSqliteBool(child.is_active as number),
    createdAt: String(child.created_at),
    updatedAt: String(child.updated_at),
    children: [],
  }))

  const result: CategoryDetail = {
    id: String(category.id),
    name: String(category.name),
    slug: String(category.slug),
    description: category.description ? String(category.description) : null,
    imageUrl: category.image_url ? String(category.image_url) : null,
    parentId: category.parent_id ? String(category.parent_id) : null,
    parentName,
    parentSlug,
    sortOrder: Number(category.sort_order),
    isActive: fromSqliteBool(category.is_active as number),
    createdAt: String(category.created_at),
    updatedAt: String(category.updated_at),
    productCount: Number(productCountResult.rows[0]?.count ?? 0),
    children,
  }

  await setCache(cacheKey, result, CACHE_TTL.CATEGORIES)
  return result
}

export async function createCategory(
  db: Client,
  data: {
    name: string
    description?: string
    parentId?: string
    imageUrl?: string
    sortOrder?: number
  },
  adminUserId: string
) {
  const baseSlug = slugify(data.name)

  const existingResult = await db.execute({
    sql: `SELECT slug FROM categories WHERE slug LIKE ? AND deleted_at IS NULL`,
    args: [`${baseSlug}%`],
  })

  const slug = generateUniqueSlug(data.name, existingResult.rows.map(r => String(r.slug)))

  if (data.parentId) {
    const parentResult = await db.execute({
      sql: `SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL`,
      args: [data.parentId],
    })
    if (!parentResult.rows[0]) {
      throw new AppError('PARENT_NOT_FOUND', 404)
    }
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    args: [id, data.name, slug, data.description ?? null, data.imageUrl ?? null, data.parentId ?? null, data.sortOrder ?? 0, now, now],
  })

  await invalidateCategoryCache()

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'category',
    entityId: id,
    changes: data,
  })

  const createdResult = await db.execute({
    sql: `SELECT * FROM categories WHERE id = ?`,
    args: [id],
  })

  return mapRow(createdResult.rows[0])
}

export async function updateCategory(
  db: Client,
  id: string,
  data: {
    name?: string
    description?: string | null
    parentId?: string | null
    imageUrl?: string | null
    sortOrder?: number
    isActive?: boolean
  },
  adminUserId: string,
  env: CloudflareBindings
) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL`,
    args: [id],
  })

  const existing = existingResult.rows[0]
  if (!existing) {
    throw new AppError('CATEGORY_NOT_FOUND', 404)
  }

  const updates: string[] = []
  const args: any[] = []
  let newSlug = String(existing.slug)

  if (data.name !== undefined && data.name !== existing.name) {
    const baseSlug = slugify(data.name)
    const existingSlugsResult = await db.execute({
      sql: `SELECT slug FROM categories WHERE slug LIKE ? AND id != ? AND deleted_at IS NULL`,
      args: [`${baseSlug}%`, id],
    })
    newSlug = generateUniqueSlug(data.name, existingSlugsResult.rows.map(r => String(r.slug)))
    updates.push('name = ?', 'slug = ?')
    args.push(data.name, newSlug)
  }

  if (data.description !== undefined) {
    updates.push('description = ?')
    args.push(data.description ?? null)
  }

  if (data.parentId !== undefined) {
    if (data.parentId !== null) {
      if (data.parentId === id) {
        throw new AppError('CIRCULAR_REFERENCE', 400)
      }
      const parentResult = await db.execute({
        sql: `SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL`,
        args: [data.parentId],
      })
      if (!parentResult.rows[0]) {
        throw new AppError('PARENT_NOT_FOUND', 404)
      }
    }
    updates.push('parent_id = ?')
    args.push(data.parentId ?? null)
  }

  if (data.sortOrder !== undefined) {
    updates.push('sort_order = ?')
    args.push(data.sortOrder)
  }

  if (data.isActive !== undefined) {
    updates.push('is_active = ?')
    args.push(toSqliteBool(data.isActive))
  }

  if (data.imageUrl !== undefined) {
    if (data.imageUrl === null && existing.image_url) {
      try {
        const publicId = String(existing.image_url).split('/upload/')[1]?.split('.')[0].split('/').slice(1).join('/')
        if (publicId) await deleteFromCloudinary(publicId, env)
      } catch {}
    }
    updates.push('image_url = ?')
    args.push(data.imageUrl)
  }

  if (updates.length === 0) {
    return mapRow(existing)
  }

  updates.push('updated_at = ?')
  args.push(new Date().toISOString())
  args.push(id)

  await db.execute({
    sql: `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  await invalidateCategoryCache()

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'category',
    entityId: id,
    changes: data,
  })

  const updatedResult = await db.execute({
    sql: `SELECT * FROM categories WHERE id = ?`,
    args: [id],
  })

  return mapRow(updatedResult.rows[0])
}

export async function deleteCategory(
  db: Client,
  id: string,
  adminUserId: string,
  env: CloudflareBindings
) {
  const catResult = await db.execute({
    sql: `SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL`,
    args: [id],
  })

  const category = catResult.rows[0]
  if (!category) {
    throw new AppError('CATEGORY_NOT_FOUND', 404)
  }

  const productCountResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1 AND deleted_at IS NULL`,
    args: [id],
  })

  const productCount = Number(productCountResult.rows[0]?.count ?? 0)
  if (productCount > 0) {
    throw new AppError('CATEGORY_HAS_PRODUCTS', 409)
  }

  const childCountResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM categories WHERE parent_id = ? AND is_active = 1 AND deleted_at IS NULL`,
    args: [id],
  })

  const childCount = Number(childCountResult.rows[0]?.count ?? 0)
  if (childCount > 0) {
    throw new AppError('CATEGORY_HAS_CHILDREN', 409)
  }

  const now = new Date().toISOString()
  await db.execute({
    sql: `UPDATE categories SET deleted_at = ?, is_active = 0, updated_at = ? WHERE id = ?`,
    args: [now, now, id],
  })

  if (category.image_url) {
    try {
      const publicId = String(category.image_url).split('/upload/')[1]?.split('.')[0].split('/').slice(1).join('/')
      if (publicId) await deleteFromCloudinary(publicId, env)
    } catch {}
  }

  await invalidateCategoryCache()

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'category',
    entityId: id,
  })
}

export async function uploadCategoryImage(
  db: Client,
  id: string,
  file: File,
  adminUserId: string,
  env: CloudflareBindings
) {
  const catResult = await db.execute({
    sql: `SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL`,
    args: [id],
  })

  const category = catResult.rows[0]
  if (!category) {
    throw new AppError('CATEGORY_NOT_FOUND', 404)
  }

  const result = await uploadImageToCloudinary(file, 'categories', env)

  if (category.image_url) {
    try {
      const publicId = String(category.image_url).split('/upload/')[1]?.split('.')[0].split('/').slice(1).join('/')
      if (publicId) await deleteFromCloudinary(publicId, env)
    } catch {}
  }

  await db.execute({
    sql: `UPDATE categories SET image_url = ?, updated_at = ? WHERE id = ?`,
    args: [result.url, new Date().toISOString(), id],
  })

  await invalidateCategoryCache()

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'category',
    entityId: id,
    changes: { imageUploaded: true },
  })

  const updatedResult = await db.execute({
    sql: `SELECT * FROM categories WHERE id = ?`,
    args: [id],
  })

  return mapRow(updatedResult.rows[0])
}

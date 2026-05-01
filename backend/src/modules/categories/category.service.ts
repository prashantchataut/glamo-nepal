import { slugify, generateUniqueSlug } from '../../utils/slug'
import { CACHE_TTL, getFromCache, setCache, deleteCache, deleteCacheByPrefix } from '../../utils/cache'
import { uploadImageToCloudinary, deleteFromCloudinary } from '../../utils/upload'
import { createAuditLog } from '../../utils/audit'
import type { CloudflareBindings } from '../../types/bindings'

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  sort_order: number
  is_active: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

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

function mapRowToCategory(row: CategoryRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function invalidateCategoryCache(kv: KVNamespace) {
  await Promise.all([
    deleteCache(kv, 'categories:tree'),
    deleteCacheByPrefix(kv, 'categories:slug:'),
  ])
}

export async function getCategoryTree(db: D1Database, kv: KVNamespace): Promise<CategoryTreeNode[]> {
  const cached = await getFromCache<CategoryTreeNode[]>(kv, 'categories:tree')
  if (cached) return cached

  const { results } = await db
    .prepare('SELECT * FROM categories WHERE is_active = 1 AND deleted_at IS NULL ORDER BY sort_order, name')
    .all<CategoryRow>()

  const categoryMap = new Map<string, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []

  for (const row of results) {
    const node: CategoryTreeNode = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      imageUrl: row.image_url,
      parentId: row.parent_id,
      sortOrder: row.sort_order,
      isActive: !!row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      children: [],
    }
    categoryMap.set(row.id, node)
  }

  for (const node of categoryMap.values()) {
    if (node.parentId && categoryMap.has(node.parentId)) {
      categoryMap.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  await setCache(kv, 'categories:tree', roots, CACHE_TTL.CATEGORIES)
  return roots
}

export async function getCategoryBySlug(slug: string, db: D1Database, kv: KVNamespace): Promise<CategoryDetail> {
  const cacheKey = `categories:slug:${slug}`
  const cached = await getFromCache<CategoryDetail>(kv, cacheKey)
  if (cached) return cached

  const category = await db
    .prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1 AND deleted_at IS NULL')
    .bind(slug)
    .first<CategoryRow>()

  if (!category) {
    throw new Error('CATEGORY_NOT_FOUND')
  }

  let parentName: string | null = null
  let parentSlug: string | null = null
  if (category.parent_id) {
    const parent = await db
      .prepare('SELECT name, slug FROM categories WHERE id = ? AND deleted_at IS NULL')
      .bind(category.parent_id)
      .first<{ name: string; slug: string }>()
    if (parent) {
      parentName = parent.name
      parentSlug = parent.slug
    }
  }

  const productCountResult = await db
    .prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1 AND deleted_at IS NULL')
    .bind(category.id)
    .first<{ count: number }>()

  const { results: childrenRows } = await db
    .prepare('SELECT * FROM categories WHERE parent_id = ? AND is_active = 1 AND deleted_at IS NULL ORDER BY sort_order, name')
    .bind(category.id)
    .all<CategoryRow>()

  const children: CategoryTreeNode[] = childrenRows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    children: [],
  }))

  const result: CategoryDetail = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.image_url,
    parentId: category.parent_id,
    parentName,
    parentSlug,
    sortOrder: category.sort_order,
    isActive: !!category.is_active,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
    productCount: productCountResult?.count ?? 0,
    children,
  }

  await setCache(kv, cacheKey, result, CACHE_TTL.CATEGORIES)
  return result
}

export async function createCategory(
  data: {
    name: string
    description?: string
    parentId?: string
    imageUrl?: string
    sortOrder?: number
  },
  adminId: string,
  db: D1Database,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const baseSlug = slugify(data.name)

  const { results: existingSlugs } = await db
    .prepare('SELECT slug FROM categories WHERE slug LIKE ? AND deleted_at IS NULL')
    .bind(`${baseSlug}%`)
    .all<{ slug: string }>()

  const slug = generateUniqueSlug(data.name, existingSlugs.map(r => r.slug))

  if (data.parentId) {
    const parent = await db
      .prepare('SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL')
      .bind(data.parentId)
      .first()
    if (!parent) {
      throw new Error('PARENT_NOT_FOUND')
    }
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db
    .prepare(
      'INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)'
    )
    .bind(
      id,
      data.name,
      slug,
      data.description ?? null,
      data.imageUrl ?? null,
      data.parentId ?? null,
      data.sortOrder ?? 0,
      now,
      now
    )
    .run()

  await invalidateCategoryCache(kv)

  await createAuditLog(db, {
    userId: adminId,
    action: 'CREATE',
    entity: 'category',
    entityId: id,
    changes: JSON.stringify(data),
  })

  const category = await db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .bind(id)
    .first<CategoryRow>()

  return mapRowToCategory(category!)
}

export async function updateCategory(
  id: string,
  data: {
    name?: string
    description?: string | null
    parentId?: string | null
    imageUrl?: string | null
    sortOrder?: number
    isActive?: number
  },
  adminId: string,
  db: D1Database,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const existing = await db
    .prepare('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL')
    .bind(id)
    .first<CategoryRow>()

  if (!existing) {
    throw new Error('CATEGORY_NOT_FOUND')
  }

  const updates: string[] = []
  const values: any[] = []

  let newSlug = existing.slug

  if (data.name !== undefined && data.name !== existing.name) {
    const baseSlug = slugify(data.name)
    const { results: existingSlugs } = await db
      .prepare('SELECT slug FROM categories WHERE slug LIKE ? AND id != ? AND deleted_at IS NULL')
      .bind(`${baseSlug}%`, id)
      .all<{ slug: string }>()
    newSlug = generateUniqueSlug(data.name, existingSlugs.map(r => r.slug))
    updates.push('name = ?', 'slug = ?')
    values.push(data.name, newSlug)
  }

  if (data.description !== undefined) {
    updates.push('description = ?')
    values.push(data.description ?? null)
  }

  if (data.parentId !== undefined) {
    if (data.parentId !== null) {
      if (data.parentId === id) {
        throw new Error('CIRCULAR_REFERENCE')
      }
      const parent = await db
        .prepare('SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL')
        .bind(data.parentId)
        .first()
      if (!parent) {
        throw new Error('PARENT_NOT_FOUND')
      }
    }
    updates.push('parent_id = ?')
    values.push(data.parentId ?? null)
  }

  if (data.sortOrder !== undefined) {
    updates.push('sort_order = ?')
    values.push(data.sortOrder)
  }

  if (data.isActive !== undefined) {
    updates.push('is_active = ?')
    values.push(data.isActive)
  }

  if (data.imageUrl !== undefined) {
    if (data.imageUrl === null && existing.image_url) {
      try {
        const publicId = existing.image_url.split('/upload/')[1]?.split('.')[0].split('/').slice(1).join('/')
        if (publicId) await deleteFromCloudinary(publicId, env)
      } catch {}
    }
    updates.push('image_url = ?')
    values.push(data.imageUrl)
  }

  if (updates.length === 0) {
    return mapRowToCategory(existing)
  }

  updates.push("updated_at = datetime('now')")
  values.push(id)

  await db
    .prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  await invalidateCategoryCache(kv)

  await createAuditLog(db, {
    userId: adminId,
    action: 'UPDATE',
    entity: 'category',
    entityId: id,
    changes: JSON.stringify(data),
  })

  const updated = await db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .bind(id)
    .first<CategoryRow>()

  return mapRowToCategory(updated!)
}

export async function deleteCategory(
  id: string,
  adminId: string,
  db: D1Database,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const category = await db
    .prepare('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL')
    .bind(id)
    .first<CategoryRow>()

  if (!category) {
    throw new Error('CATEGORY_NOT_FOUND')
  }

  const productCount = await db
    .prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1 AND deleted_at IS NULL')
    .bind(id)
    .first<{ count: number }>()

  if (productCount && productCount.count > 0) {
    throw new Error('CATEGORY_HAS_PRODUCTS')
  }

  const childCount = await db
    .prepare('SELECT COUNT(*) as count FROM categories WHERE parent_id = ? AND is_active = 1 AND deleted_at IS NULL')
    .bind(id)
    .first<{ count: number }>()

  if (childCount && childCount.count > 0) {
    throw new Error('CATEGORY_HAS_CHILDREN')
  }

  await db
    .prepare("UPDATE categories SET deleted_at = datetime('now'), is_active = 0, updated_at = datetime('now') WHERE id = ?")
    .bind(id)
    .run()

  if (category.image_url) {
    try {
      const publicId = category.image_url.split('/upload/')[1]?.split('.')[0].split('/').slice(1).join('/')
      if (publicId) await deleteFromCloudinary(publicId, env)
    } catch {}
  }

  await invalidateCategoryCache(kv)

  await createAuditLog(db, {
    userId: adminId,
    action: 'DELETE',
    entity: 'category',
    entityId: id,
  })
}

export async function uploadCategoryImage(
  id: string,
  file: File,
  adminId: string,
  db: D1Database,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const category = await db
    .prepare('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL')
    .bind(id)
    .first<CategoryRow>()

  if (!category) {
    throw new Error('CATEGORY_NOT_FOUND')
  }

  const result = await uploadImageToCloudinary(file, 'categories', env)

  if (category.image_url) {
    try {
      const publicId = category.image_url.split('/upload/')[1]?.split('.')[0].split('/').slice(1).join('/')
      if (publicId) await deleteFromCloudinary(publicId, env)
    } catch {}
  }

  await db
    .prepare("UPDATE categories SET image_url = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(result.url, id)
    .run()

  await invalidateCategoryCache(kv)

  await createAuditLog(db, {
    userId: adminId,
    action: 'UPDATE',
    entity: 'category',
    entityId: id,
    changes: JSON.stringify({ imageUploaded: true }),
  })

  const updated = await db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .bind(id)
    .first<CategoryRow>()

  return mapRowToCategory(updated!)
}
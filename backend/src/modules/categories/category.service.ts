import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../utils/supabase'
import { createAuditLog } from '../../utils/audit'
import { CACHE_TTL, getFromCache, setCache, deleteCache, deleteCacheByPrefix } from '../../utils/cache'
import { slugify, generateUniqueSlug } from '../../utils/slug'
import { uploadImageToCloudinary, deleteFromCloudinary } from '../../utils/upload'
import type { CloudflareBindings } from '../../types/bindings'

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
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

interface CategoryFilters {
  parentId?: string | null
  isActive?: boolean
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
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function invalidateCategoryCache(kv: KVNamespace) {
  await Promise.all([
    deleteCache(kv, 'categories:tree'),
    deleteCacheByPrefix(kv, 'categories:slug:'),
    deleteCacheByPrefix(kv, 'categories:list:'),
  ])
}

export async function getCategoriesCached(
  supabase: SupabaseClient,
  kv: KVNamespace,
  filters?: CategoryFilters
): Promise<{ tree: CategoryTreeNode[] } | { list: ReturnType<typeof mapRowToCategory>[] }> {
  if (!filters || (filters.isActive === undefined && filters.parentId === undefined)) {
    const cached = await getFromCache<CategoryTreeNode[]>(kv, 'categories:tree')
    if (cached) return { tree: cached }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw new AppError('Failed to fetch categories', 500)
    const rows = data as CategoryRow[]

    const categoryMap = new Map<string, CategoryTreeNode>()
    const roots: CategoryTreeNode[] = []

    for (const row of rows) {
      const node: CategoryTreeNode = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        imageUrl: row.image_url,
        parentId: row.parent_id,
        sortOrder: row.sort_order,
        isActive: row.is_active,
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
    return { tree: roots }
  }

  const sortedFilterParams = JSON.stringify(filters)
  const cacheKey = `categories:list:${sortedFilterParams}`
  const cached = await getFromCache<ReturnType<typeof mapRowToCategory>[]>(kv, cacheKey)
  if (cached) return { list: cached }

  let query = supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)

  if (filters.parentId !== undefined) {
    if (filters.parentId === null) {
      query = query.is('parent_id', null)
    } else {
      query = query.eq('parent_id', filters.parentId)
    }
  }

  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  query = query.order('sort_order', { ascending: true }).order('name', { ascending: true })

  const { data, error } = await query
  if (error) throw new AppError('Failed to fetch categories', 500)

  const mapped = (data as CategoryRow[]).map(mapRowToCategory)
  await setCache(kv, cacheKey, mapped, CACHE_TTL.CATEGORIES)
  return { list: mapped }
}

export async function getCategoryTree(
  supabase: SupabaseClient,
  kv: KVNamespace
): Promise<CategoryTreeNode[]> {
  const result = await getCategoriesCached(supabase, kv)
  if ('tree' in result) return result.tree
  return []
}

export async function getCategoryBySlug(
  slug: string,
  supabase: SupabaseClient,
  kv: KVNamespace
): Promise<CategoryDetail> {
  const cacheKey = `categories:slug:${slug}`
  const cached = await getFromCache<CategoryDetail>(kv, cacheKey)
  if (cached) return cached

  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  if (error || !category) {
    throw new AppError('CATEGORY_NOT_FOUND', 404)
  }

  const row = category as CategoryRow

  let parentName: string | null = null
  let parentSlug: string | null = null

  if (row.parent_id) {
    const { data: parent } = await supabase
      .from('categories')
      .select('name, slug')
      .eq('id', row.parent_id)
      .is('deleted_at', null)
      .single()

    if (parent) {
      parentName = parent.name
      parentSlug = parent.slug
    }
  }

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', row.id)
    .eq('is_active', true)
    .is('deleted_at', null)

  const { data: childrenRows } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', row.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const children: CategoryTreeNode[] = (childrenRows as CategoryRow[] || []).map(child => ({
    id: child.id,
    name: child.name,
    slug: child.slug,
    description: child.description,
    imageUrl: child.image_url,
    parentId: child.parent_id,
    sortOrder: child.sort_order,
    isActive: child.is_active,
    createdAt: child.created_at,
    updatedAt: child.updated_at,
    children: [],
  }))

  const result: CategoryDetail = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    parentId: row.parent_id,
    parentName,
    parentSlug,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productCount: productCount ?? 0,
    children,
  }

  await setCache(kv, cacheKey, result, CACHE_TTL.CATEGORIES)
  return result
}

export async function createCategory(
  supabase: SupabaseClient,
  data: {
    name: string
    description?: string
    parentId?: string
    imageUrl?: string
    sortOrder?: number
  },
  adminUserId: string,
  kv: KVNamespace
) {
  const baseSlug = slugify(data.name)

  const { data: existingSlugs } = await supabase
    .from('categories')
    .select('slug')
    .ilike('slug', `${baseSlug}%`)
    .is('deleted_at', null)

  const slug = generateUniqueSlug(data.name, (existingSlugs || []).map(r => r.slug))

  if (data.parentId) {
    const { data: parent } = await supabase
      .from('categories')
      .select('id')
      .eq('id', data.parentId)
      .is('deleted_at', null)
      .single()

    if (!parent) {
      throw new AppError('PARENT_NOT_FOUND', 404)
    }
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const insertData: Record<string, unknown> = {
    id,
    name: data.name,
    slug,
    description: data.description ?? null,
    image_url: data.imageUrl ?? null,
    parent_id: data.parentId ?? null,
    sort_order: data.sortOrder ?? 0,
    is_active: true,
    created_at: now,
    updated_at: now,
  }

  const { error } = await supabase.from('categories').insert(insertData)
  if (error) throw new AppError('Failed to create category', 500)

  await invalidateCategoryCache(kv)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'category',
    entityId: id,
    changes: data,
  })

  const { data: created } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  return mapRowToCategory(created as CategoryRow)
}

export async function updateCategory(
  supabase: SupabaseClient,
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
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const { data: existing, error: fetchError } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('CATEGORY_NOT_FOUND', 404)
  }

  const row = existing as CategoryRow
  const updates: Record<string, unknown> = {}
  let newSlug = row.slug

  if (data.name !== undefined && data.name !== row.name) {
    const baseSlug = slugify(data.name)
    const { data: existingSlugs } = await supabase
      .from('categories')
      .select('slug')
      .ilike('slug', `${baseSlug}%`)
      .neq('id', id)
      .is('deleted_at', null)

    newSlug = generateUniqueSlug(data.name, (existingSlugs || []).map(r => r.slug))
    updates.name = data.name
    updates.slug = newSlug
  }

  if (data.description !== undefined) {
    updates.description = data.description ?? null
  }

  if (data.parentId !== undefined) {
    if (data.parentId !== null) {
      if (data.parentId === id) {
        throw new AppError('CIRCULAR_REFERENCE', 400)
      }
      const { data: parent } = await supabase
        .from('categories')
        .select('id')
        .eq('id', data.parentId)
        .is('deleted_at', null)
        .single()

      if (!parent) {
        throw new AppError('PARENT_NOT_FOUND', 404)
      }
    }
    updates.parent_id = data.parentId ?? null
  }

  if (data.sortOrder !== undefined) {
    updates.sort_order = data.sortOrder
  }

  if (data.isActive !== undefined) {
    updates.is_active = data.isActive
  }

  if (data.imageUrl !== undefined) {
    if (data.imageUrl === null && row.image_url) {
      try {
        const publicId = row.image_url.split('/upload/')[1]?.split('.')[0].split('/').slice(1).join('/')
        if (publicId) await deleteFromCloudinary(publicId, env)
      } catch {}
    }
    updates.image_url = data.imageUrl
  }

  if (Object.keys(updates).length === 0) {
    return mapRowToCategory(row)
  }

  updates.updated_at = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)

  if (updateError) throw new AppError('Failed to update category', 500)

  await invalidateCategoryCache(kv)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'category',
    entityId: id,
    changes: data,
  })

  const { data: updated } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  return mapRowToCategory(updated as CategoryRow)
}

export async function deleteCategory(
  supabase: SupabaseClient,
  id: string,
  adminUserId: string,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const { data: category, error: fetchError } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !category) {
    throw new AppError('CATEGORY_NOT_FOUND', 404)
  }

  const row = category as CategoryRow

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
    .eq('is_active', true)
    .is('deleted_at', null)

  if (productCount && productCount > 0) {
    throw new AppError('CATEGORY_HAS_PRODUCTS', 409)
  }

  const { count: childCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', id)
    .eq('is_active', true)
    .is('deleted_at', null)

  if (childCount && childCount > 0) {
    throw new AppError('CATEGORY_HAS_CHILDREN', 409)
  }

  const now = new Date().toISOString()
  const { error: deleteError } = await supabase
    .from('categories')
    .update({ deleted_at: now, is_active: false, updated_at: now })
    .eq('id', id)

  if (deleteError) throw new AppError('Failed to delete category', 500)

  if (row.image_url) {
    try {
      const publicId = row.image_url.split('/upload/')[1]?.split('.')[0].split('/').slice(1).join('/')
      if (publicId) await deleteFromCloudinary(publicId, env)
    } catch {}
  }

  await invalidateCategoryCache(kv)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'category',
    entityId: id,
  })
}

export async function uploadCategoryImage(
  supabase: SupabaseClient,
  id: string,
  file: File,
  adminUserId: string,
  kv: KVNamespace,
  env: CloudflareBindings
) {
  const { data: category, error: fetchError } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !category) {
    throw new AppError('CATEGORY_NOT_FOUND', 404)
  }

  const row = category as CategoryRow

  const result = await uploadImageToCloudinary(file, 'categories', env)

  if (row.image_url) {
    try {
      const publicId = row.image_url.split('/upload/')[1]?.split('.')[0].split('/').slice(1).join('/')
      if (publicId) await deleteFromCloudinary(publicId, env)
    } catch {}
  }

  await supabase
    .from('categories')
    .update({ image_url: result.url, updated_at: new Date().toISOString() })
    .eq('id', id)

  await invalidateCategoryCache(kv)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'category',
    entityId: id,
    changes: { imageUploaded: true },
  })

  const { data: updated } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  return mapRowToCategory(updated as CategoryRow)
}
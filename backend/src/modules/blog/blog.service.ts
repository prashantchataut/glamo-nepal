import type { SupabaseClient } from '@supabase/supabase-js'
import type { CloudflareBindings } from '../../types/bindings'
import { AppError, handleSupabaseError } from '../../utils/supabase'
import { CACHE_TTL, getFromCache, setCache, deleteCacheByPrefix } from '../../utils/cache'
import { createAuditLog } from '../../utils/audit'
import { slugify, generateUniqueSlug } from '../../utils/slug'
import { uploadImageToCloudinary, deleteFromCloudinary } from '../../utils/upload'

const CACHE_PREFIX = 'blogs:'

function calculateReadTime(content: string): number {
  const wordCount = content.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

export async function getPublishedBlogs(
  supabase: SupabaseClient,
  kv: KVNamespace,
  filters: { category?: string; page: number; limit: number }
) {
  const cacheKey = `${CACHE_PREFIX}list:${filters.category || 'all'}:${filters.page}:${filters.limit}`
  const cached = await getFromCache<any>(kv, cacheKey)
  if (cached) return cached

  const from = (filters.page - 1) * filters.limit
  const to = from + filters.limit - 1

  let query = supabase
    .from('blogs')
    .select('id, title, slug, excerpt, cover_image_url, category, tags, view_count, read_time_minutes, published_at, created_at', { count: 'exact' })
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .range(from, to)

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  const { data, error, count } = await query

  if (error) handleSupabaseError(error, 'getPublishedBlogs')

  const result = {
    posts: data || [],
    total: count || 0,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil((count || 0) / filters.limit),
  }

  await setCache(kv, cacheKey, result, CACHE_TTL.POPUP)
  return result
}

export async function getBlogCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('blogs')
    .select('category')
    .eq('is_published', true)
    .is('deleted_at', null)
    .not('category', 'is', null)

  if (error) handleSupabaseError(error, 'getBlogCategories')

  const categories = [...new Set(data.map((row: any) => row.category).filter(Boolean))]
  return categories
}

export async function getBlogBySlug(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .is('deleted_at', null)
    .single()

  if (error) handleSupabaseError(error, 'getBlogBySlug')
  if (!data) throw new AppError('Blog post not found', 404)

  supabase
    .from('blogs')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id)
    .then(() => {})

  const readTime = data.read_time_minutes || calculateReadTime(data.content || '')

  return { ...data, read_time_minutes: readTime }
}

export async function createBlog(supabase: SupabaseClient, data: any, authorId: string) {
  const { data: existingSlugs } = await supabase
    .from('blogs')
    .select('slug')

  const slugList = (existingSlugs || []).map((row: any) => row.slug)
  const slug = generateUniqueSlug(data.title, slugList)

  const readTime = data.content ? calculateReadTime(data.content) : 1

  const tags = typeof data.tags === 'string'
    ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : data.tags

  const insertData: Record<string, any> = {
    title: data.title,
    slug,
    excerpt: data.excerpt ?? null,
    content: data.content,
    category: data.category ?? null,
    meta_title: data.metaTitle ?? null,
    meta_description: data.metaDescription ?? null,
    tags: tags ?? null,
    read_time_minutes: readTime,
    author_id: authorId,
    is_published: false,
  }

  const { data: blog, error } = await supabase
    .from('blogs')
    .insert(insertData)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'createBlog')

  await createAuditLog(supabase, {
    userId: authorId,
    action: 'CREATE',
    entity: 'blog',
    entityId: blog.id,
    changes: data,
  })

  return blog
}

export async function updateBlog(supabase: SupabaseClient, id: string, data: any, adminUserId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('blogs')
    .select('id, slug, title, content')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError) handleSupabaseError(fetchError, 'fetchBlogForUpdate')
  if (!existing) throw new AppError('Blog post not found', 404)

  const updateData: Record<string, any> = {}

  if (data.title !== undefined) {
    updateData.title = data.title
    const { data: allSlugs } = await supabase
      .from('blogs')
      .select('slug')
      .neq('id', id)
    const slugList = (allSlugs || []).map((row: any) => row.slug)
    updateData.slug = generateUniqueSlug(data.title, slugList)
  }
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
  if (data.content !== undefined) {
    updateData.content = data.content
    updateData.read_time_minutes = calculateReadTime(data.content)
  }
  if (data.category !== undefined) updateData.category = data.category
  if (data.metaTitle !== undefined) updateData.meta_title = data.metaTitle
  if (data.metaDescription !== undefined) updateData.meta_description = data.metaDescription
  if (data.tags !== undefined) {
    updateData.tags = typeof data.tags === 'string'
      ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : data.tags
  }
  if (data.isPublished !== undefined) updateData.is_published = data.isPublished

  const { data: blog, error } = await supabase
    .from('blogs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'updateBlog')

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'blog',
    entityId: id,
    changes: data,
  })

  return blog
}

export async function publishBlog(supabase: SupabaseClient, id: string, adminUserId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('blogs')
    .select('id, is_published')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError) handleSupabaseError(fetchError, 'fetchBlogForPublish')
  if (!existing) throw new AppError('Blog post not found', 404)

  const { data: blog, error } = await supabase
    .from('blogs')
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'publishBlog')

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'PUBLISH',
    entity: 'blog',
    entityId: id,
  })

  return blog
}

export async function unpublishBlog(supabase: SupabaseClient, id: string, adminUserId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('blogs')
    .select('id, is_published')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError) handleSupabaseError(fetchError, 'fetchBlogForUnpublish')
  if (!existing) throw new AppError('Blog post not found', 404)

  const { data: blog, error } = await supabase
    .from('blogs')
    .update({ is_published: false, published_at: null })
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'unpublishBlog')

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UNPUBLISH',
    entity: 'blog',
    entityId: id,
  })

  return blog
}

export async function deleteBlog(supabase: SupabaseClient, id: string, adminUserId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('blogs')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError) handleSupabaseError(fetchError, 'fetchBlogForDelete')
  if (!existing) throw new AppError('Blog post not found', 404)

  const { error } = await supabase
    .from('blogs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) handleSupabaseError(error, 'deleteBlog')

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'blog',
    entityId: id,
  })
}

export async function uploadCoverImage(
  supabase: SupabaseClient,
  id: string,
  file: File,
  env: CloudflareBindings
) {
  const { data: existing, error: fetchError } = await supabase
    .from('blogs')
    .select('id, cover_image_url')
    .eq('id', id)
    .single()

  if (fetchError) handleSupabaseError(fetchError, 'fetchBlogForCoverUpload')
  if (!existing) throw new AppError('Blog post not found', 404)

  if (existing.cover_image_url) {
    const publicId = existing.cover_image_url.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '')
    try {
      await deleteFromCloudinary(publicId, env)
    } catch {}
  }

  const { url } = await uploadImageToCloudinary(file, 'blog', env)

  const { data: blog, error } = await supabase
    .from('blogs')
    .update({ cover_image_url: url })
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, 'updateBlogCoverImage')

  return blog
}
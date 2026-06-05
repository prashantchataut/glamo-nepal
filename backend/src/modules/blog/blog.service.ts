import type { Client } from '@libsql/client'
import type { NetlifyBindings } from '../../types/bindings'
import { AppError, handleDbError, fromSqliteBool, toSqliteBool, safeJsonParse, safeJsonStringify } from '../../utils/turso-helpers'
import { CACHE_TTL, getFromCache, setCache } from '../../utils/cache'
import { createAuditLog } from '../../utils/audit'
import { generateUniqueSlug } from '../../utils/slug'
import { uploadImageToCloudinary, deleteFromCloudinary } from '../../utils/upload'

const CACHE_PREFIX = 'blogs:'

function calculateReadTime(content: string): number {
  const wordCount = content.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

export async function getPublishedBlogs(
  db: Client,
  filters: { category?: string; page: number; limit: number }
) {
  const cacheKey = `${CACHE_PREFIX}list:${filters.category || 'all'}:${filters.page}:${filters.limit}`
  const cached = await getFromCache<any>(cacheKey)
  if (cached) return cached

  const offset = (filters.page - 1) * filters.limit

  const whereClauses: string[] = ['is_published = 1', 'deleted_at IS NULL']
  const args: any[] = []

  if (filters.category) {
    whereClauses.push('category = ?')
    args.push(filters.category)
  }

  const countArgs = [...args]
  const whereStr = whereClauses.join(' AND ')

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM blogs WHERE ${whereStr}`,
    args: countArgs,
  })

  const dataResult = await db.execute({
    sql: `SELECT id, title, slug, excerpt, cover_image_url, category, tags, view_count, read_time_minutes, published_at, created_at FROM blogs WHERE ${whereStr} ORDER BY published_at DESC LIMIT ? OFFSET ?`,
    args: [...args, filters.limit, offset],
  })

  const total = Number(countResult.rows[0]?.count ?? 0)

  const result = {
    posts: dataResult.rows.map(row => ({
      ...row,
      tags: safeJsonParse(row.tags as string, []),
      is_published: fromSqliteBool(row.is_published as number),
    })),
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  }

  await setCache(cacheKey, result, CACHE_TTL.POPUP)
  return result
}

export async function getBlogCategories(db: Client) {
  const result = await db.execute({
    sql: `SELECT DISTINCT category FROM blogs WHERE is_published = 1 AND deleted_at IS NULL AND category IS NOT NULL`,
    args: [],
  })

  return result.rows.map(row => String(row.category)).filter(Boolean)
}

export async function getBlogBySlug(db: Client, slug: string) {
  const result = await db.execute({
    sql: `SELECT * FROM blogs WHERE slug = ? AND is_published = 1 AND deleted_at IS NULL`,
    args: [slug],
  })

  const data = result.rows[0]
  if (!data) throw new AppError('Blog post not found', 404)

  db.execute({
    sql: `UPDATE blogs SET view_count = view_count + 1 WHERE id = ?`,
    args: [data.id],
  }).catch(() => {})

  const readTime = Number(data.read_time_minutes) || calculateReadTime(String(data.content || ''))

  return { ...data, tags: safeJsonParse(data.tags as string, []), read_time_minutes: readTime }
}

export async function createBlog(db: Client, data: any, authorId: string) {
  const existingResult = await db.execute({
    sql: `SELECT slug FROM blogs`,
    args: [],
  })

  const slugList = existingResult.rows.map(row => String(row.slug))
  const slug = generateUniqueSlug(data.title, slugList)

  const readTime = data.content ? calculateReadTime(data.content) : 1
  const tags = typeof data.tags === 'string'
    ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : data.tags

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO blogs (id, title, slug, excerpt, content, category, meta_title, meta_description, tags, read_time_minutes, author_id, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    args: [
      id, data.title, slug, data.excerpt ?? null, data.content, data.category ?? null,
      data.metaTitle ?? null, data.metaDescription ?? null,
      safeJsonStringify(tags ?? null), readTime, authorId, now, now,
    ],
  })

  await createAuditLog(db, {
    userId: authorId,
    action: 'CREATE',
    entity: 'blog',
    entityId: id,
    changes: data,
  })

  const blogResult = await db.execute({
    sql: `SELECT * FROM blogs WHERE id = ?`,
    args: [id],
  })

  const blog = blogResult.rows[0]
  return { ...blog, tags: safeJsonParse(blog.tags as string, []) }
}

export async function updateBlog(db: Client, id: string, data: any, adminUserId: string) {
  const existingResult = await db.execute({
    sql: `SELECT id, slug, title, content FROM blogs WHERE id = ? AND deleted_at IS NULL`,
    args: [id],
  })

  const existing = existingResult.rows[0]
  if (!existing) throw new AppError('Blog post not found', 404)

  const updates: string[] = []
  const args: any[] = []

  if (data.title !== undefined) {
    const allSlugsResult = await db.execute({
      sql: `SELECT slug FROM blogs WHERE id != ?`,
      args: [id],
    })
    const slugList = allSlugsResult.rows.map(r => String(r.slug))
    const newSlug = generateUniqueSlug(data.title, slugList)
    updates.push('title = ?', 'slug = ?')
    args.push(data.title, newSlug)
  }
  if (data.excerpt !== undefined) { updates.push('excerpt = ?'); args.push(data.excerpt) }
  if (data.content !== undefined) {
    updates.push('content = ?', 'read_time_minutes = ?')
    args.push(data.content, calculateReadTime(data.content))
  }
  if (data.category !== undefined) { updates.push('category = ?'); args.push(data.category) }
  if (data.metaTitle !== undefined) { updates.push('meta_title = ?'); args.push(data.metaTitle) }
  if (data.metaDescription !== undefined) { updates.push('meta_description = ?'); args.push(data.metaDescription) }
  if (data.tags !== undefined) {
    const tags = typeof data.tags === 'string'
      ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : data.tags
    updates.push('tags = ?')
    args.push(safeJsonStringify(tags))
  }
  if (data.isPublished !== undefined) { updates.push('is_published = ?'); args.push(toSqliteBool(data.isPublished)) }

  if (updates.length > 0) {
    updates.push('updated_at = ?')
    args.push(new Date().toISOString())
    args.push(id)

    await db.execute({
      sql: `UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`,
      args,
    })
  }

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'blog',
    entityId: id,
    changes: data,
  })

  const blogResult = await db.execute({
    sql: `SELECT * FROM blogs WHERE id = ?`,
    args: [id],
  })

  const blog = blogResult.rows[0]
  return { ...blog, tags: safeJsonParse(blog.tags as string, []) }
}

export async function publishBlog(db: Client, id: string, adminUserId: string) {
  const existingResult = await db.execute({
    sql: `SELECT id, is_published FROM blogs WHERE id = ? AND deleted_at IS NULL`,
    args: [id],
  })

  if (!existingResult.rows[0]) throw new AppError('Blog post not found', 404)

  const now = new Date().toISOString()
  await db.execute({
    sql: `UPDATE blogs SET is_published = 1, published_at = ?, updated_at = ? WHERE id = ?`,
    args: [now, now, id],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'PUBLISH',
    entity: 'blog',
    entityId: id,
  })

  const blogResult = await db.execute({
    sql: `SELECT * FROM blogs WHERE id = ?`,
    args: [id],
  })

  const blog = blogResult.rows[0]
  return { ...blog, tags: safeJsonParse(blog.tags as string, []) }
}

export async function unpublishBlog(db: Client, id: string, adminUserId: string) {
  const existingResult = await db.execute({
    sql: `SELECT id, is_published FROM blogs WHERE id = ? AND deleted_at IS NULL`,
    args: [id],
  })

  if (!existingResult.rows[0]) throw new AppError('Blog post not found', 404)

  const now = new Date().toISOString()
  await db.execute({
    sql: `UPDATE blogs SET is_published = 0, published_at = NULL, updated_at = ? WHERE id = ?`,
    args: [now, id],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UNPUBLISH',
    entity: 'blog',
    entityId: id,
  })

  const blogResult = await db.execute({
    sql: `SELECT * FROM blogs WHERE id = ?`,
    args: [id],
  })

  const blog = blogResult.rows[0]
  return { ...blog, tags: safeJsonParse(blog.tags as string, []) }
}

export async function deleteBlog(db: Client, id: string, adminUserId: string) {
  const existingResult = await db.execute({
    sql: `SELECT id FROM blogs WHERE id = ? AND deleted_at IS NULL`,
    args: [id],
  })

  if (!existingResult.rows[0]) throw new AppError('Blog post not found', 404)

  await db.execute({
    sql: `UPDATE blogs SET deleted_at = ? WHERE id = ?`,
    args: [new Date().toISOString(), id],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'blog',
    entityId: id,
  })
}

export async function uploadCoverImage(
  db: Client,
  id: string,
  file: File,
  env: NetlifyBindings
) {
  const existingResult = await db.execute({
    sql: `SELECT id, cover_image_url FROM blogs WHERE id = ?`,
    args: [id],
  })

  const existing = existingResult.rows[0]
  if (!existing) throw new AppError('Blog post not found', 404)

  if (existing.cover_image_url) {
    const publicId = String(existing.cover_image_url).split('/').slice(-2).join('/').replace(/\.[^.]+$/, '')
    try {
      await deleteFromCloudinary(publicId, env)
    } catch {}
  }

  const { url } = await uploadImageToCloudinary(file, 'blog', env)

  await db.execute({
    sql: `UPDATE blogs SET cover_image_url = ? WHERE id = ?`,
    args: [url, id],
  })

  const blogResult = await db.execute({
    sql: `SELECT * FROM blogs WHERE id = ?`,
    args: [id],
  })

  const blog = blogResult.rows[0]
  return { ...blog, tags: safeJsonParse(blog.tags as string, []) }
}
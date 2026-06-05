import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import { AppError } from '../../utils/turso-helpers'
import * as BlogService from './blog.service'

export async function getBlogPosts(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const query = c.get('validatedQuery') || {}
    const filters = {
      category: query.category,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    }
    const result = await BlogService.getPublishedBlogs(db, filters)
    return ApiResponse.paginated(c, 'Blog posts fetched', result.posts, result.total, result.page, result.limit)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch blog posts', 500)
  }
}

export async function getBlogCategories(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const result = await BlogService.getBlogCategories(db)
    return ApiResponse.success(c, 'Blog categories fetched', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch blog categories', 500)
  }
}

export async function getBlogPostBySlug(c: Context<AppEnv>) {
  try {
    const { slug } = c.req.param()
    const db = c.get('db')
    const result = await BlogService.getBlogBySlug(db, slug)
    return ApiResponse.success(c, 'Blog post fetched', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch blog post', 500)
  }
}

export async function createBlogPost(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    const db = c.get('db')
    const result = await BlogService.createBlog(db, data, user.id)
    return ApiResponse.success(c, 'Blog post created', result, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to create blog post', 500)
  }
}

export async function updateBlogPost(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const db = c.get('db')
    const user = c.get('user')
    const result = await BlogService.updateBlog(db, id, data, user.id)
    return ApiResponse.success(c, 'Blog post updated', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update blog post', 500)
  }
}

export async function publishBlogPost(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const user = c.get('user')
    const result = await BlogService.publishBlog(db, id, user.id)
    return ApiResponse.success(c, 'Blog post published', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to publish blog post', 500)
  }
}

export async function unpublishBlogPost(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const user = c.get('user')
    const result = await BlogService.unpublishBlog(db, id, user.id)
    return ApiResponse.success(c, 'Blog post unpublished', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to unpublish blog post', 500)
  }
}

export async function deleteBlogPost(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const user = c.get('user')
    await BlogService.deleteBlog(db, id, user.id)
    return ApiResponse.success(c, 'Blog post deleted', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete blog post', 500)
  }
}

export async function uploadBlogCover(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const formData = await c.req.formData()
    const raw = formData.get('file')
    if (!raw || typeof raw === 'string') {
      return ApiResponse.error(c, 'No file provided', 400)
    }
    const file: File = raw
    const result = await BlogService.uploadCoverImage(db, id, file, c.env)
    return ApiResponse.success(c, 'Cover image uploaded', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to upload cover image', 500)
  }
}
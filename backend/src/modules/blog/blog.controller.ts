import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as BlogService from './blog.service'

export async function getBlogPosts(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await BlogService.getBlogPosts(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch blog posts', 500)
  }
}

export async function getBlogCategories(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await BlogService.getBlogCategories(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch blog categories', 500)
  }
}

export async function getBlogPostBySlug(c: Context<AppEnv>) {
  try {
    const { slug } = c.req.param()
    const supabase = c.get('supabase')
    const result = await BlogService.getBlogPostBySlug(slug, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch blog post', 500)
  }
}

export async function createBlogPost(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await BlogService.createBlogPost(user.id, data, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to create blog post', 500)
  }
}

export async function updateBlogPost(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await BlogService.updateBlogPost(id, data, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to update blog post', 500)
  }
}

export async function publishBlogPost(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const result = await BlogService.publishBlogPost(id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to publish blog post', 500)
  }
}

export async function unpublishBlogPost(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const result = await BlogService.unpublishBlogPost(id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to unpublish blog post', 500)
  }
}

export async function deleteBlogPost(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    await BlogService.deleteBlogPost(id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to delete blog post', 500)
  }
}

export async function uploadBlogCover(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const result = await BlogService.uploadBlogCover(id, null as any, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to upload cover image', 500)
  }
}
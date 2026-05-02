import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as CategoryService from './category.service'

export async function getCategories(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const filters: { parentId?: string | null; isActive?: boolean } = {}

    const parentIdQuery = c.req.query('parentId')
    const isActiveQuery = c.req.query('isActive')

    if (parentIdQuery === 'null') {
      filters.parentId = null
    } else if (parentIdQuery) {
      filters.parentId = parentIdQuery
    }

    if (isActiveQuery !== undefined) {
      filters.isActive = isActiveQuery === 'true'
    }

    const result = await CategoryService.getCategoriesCached(supabase, kv, filters)
    return ApiResponse.success(c, 'Categories fetched successfully', result)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch categories', 500)
  }
}

export async function getCategoryBySlug(c: Context<AppEnv>) {
  try {
    const { slug } = c.req.param()
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const category = await CategoryService.getCategoryBySlug(slug, supabase, kv)
    return ApiResponse.success(c, 'Category fetched successfully', category)
  } catch (error: any) {
    if (error.message === 'CATEGORY_NOT_FOUND') {
      return ApiResponse.error(c, 'Category not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch category', 500)
  }
}

export async function createCategory(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const category = await CategoryService.createCategory(supabase, data, user.id, kv)
    return ApiResponse.success(c, 'Category created successfully', category, 201)
  } catch (error: any) {
    if (error.message === 'PARENT_NOT_FOUND') {
      return ApiResponse.error(c, 'Parent category not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to create category', 500)
  }
}

export async function updateCategory(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const category = await CategoryService.updateCategory(supabase, id, data, user.id, kv, c.env)
    return ApiResponse.success(c, 'Category updated successfully', category)
  } catch (error: any) {
    if (error.message === 'CATEGORY_NOT_FOUND') {
      return ApiResponse.error(c, 'Category not found', 404)
    }
    if (error.message === 'PARENT_NOT_FOUND') {
      return ApiResponse.error(c, 'Parent category not found', 404)
    }
    if (error.message === 'CIRCULAR_REFERENCE') {
      return ApiResponse.error(c, 'Category cannot be its own parent', 400)
    }
    return ApiResponse.error(c, error.message || 'Failed to update category', 500)
  }
}

export async function deleteCategory(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV
    await CategoryService.deleteCategory(supabase, id, user.id, kv, c.env)
    return ApiResponse.success(c, 'Category deleted successfully', null)
  } catch (error: any) {
    if (error.message === 'CATEGORY_NOT_FOUND') {
      return ApiResponse.error(c, 'Category not found', 404)
    }
    if (error.message === 'CATEGORY_HAS_PRODUCTS') {
      return ApiResponse.error(c, 'Cannot delete category with active products', 409)
    }
    if (error.message === 'CATEGORY_HAS_CHILDREN') {
      return ApiResponse.error(c, 'Cannot delete category with child categories', 409)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete category', 500)
  }
}

export async function uploadCategoryImage(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const body = await c.req.parseBody()
    const file = body.image

    if (!file || !(file instanceof File)) {
      return ApiResponse.error(c, 'Image file is required', 400)
    }

    const category = await CategoryService.uploadCategoryImage(supabase, id, file, user.id, kv, c.env)
    return ApiResponse.success(c, 'Category image uploaded successfully', category)
  } catch (error: any) {
    if (error.message === 'CATEGORY_NOT_FOUND') {
      return ApiResponse.error(c, 'Category not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to upload image', 500)
  }
}
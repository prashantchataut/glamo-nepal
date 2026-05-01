import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as CategoryService from './category.service'

export async function getCategoryTree(c: Context<AppEnv>) {
  try {
    const tree = await CategoryService.getCategoryTree(c.env.DB, c.env.KV)
    return ApiResponse.success(c, 'Categories fetched successfully', tree)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch categories', 500)
  }
}

export async function getCategoryBySlug(c: Context<AppEnv>) {
  try {
    const { slug } = c.req.param()
    const category = await CategoryService.getCategoryBySlug(slug, c.env.DB, c.env.KV)
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
    const category = await CategoryService.createCategory(data, user.id, c.env.DB, c.env.KV, c.env)
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
    const category = await CategoryService.updateCategory(id, data, user.id, c.env.DB, c.env.KV, c.env)
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
    await CategoryService.deleteCategory(id, user.id, c.env.DB, c.env.KV, c.env)
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
    const body = await c.req.parseBody()
    const file = body.image

    if (!file || !(file instanceof File)) {
      return ApiResponse.error(c, 'Image file is required', 400)
    }

    const category = await CategoryService.uploadCategoryImage(id, file, user.id, c.env.DB, c.env.KV, c.env)
    return ApiResponse.success(c, 'Category image uploaded successfully', category)
  } catch (error: any) {
    if (error.message === 'CATEGORY_NOT_FOUND') {
      return ApiResponse.error(c, 'Category not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to upload image', 500)
  }
}
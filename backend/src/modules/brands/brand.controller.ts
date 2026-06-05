import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as BrandService from './brand.service'

export async function getAllBrands(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const filters: { isActive?: boolean } = {}

    const isActiveQuery = c.req.query('isActive')
    if (isActiveQuery !== undefined) {
      filters.isActive = isActiveQuery === 'true'
    }

    const brands = await BrandService.getAllBrandsCached(db, Object.keys(filters).length > 0 ? filters : undefined)
    return ApiResponse.success(c, 'Brands fetched successfully', brands)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch brands', 500)
  }
}

export async function getBrandBySlug(c: Context<AppEnv>) {
  try {
    const { slug } = c.req.param()
    const db = c.get('db')
    const brand = await BrandService.getBrandBySlug(slug, db)

    if (!brand) {
      return ApiResponse.error(c, 'Brand not found', 404)
    }

    return ApiResponse.success(c, 'Brand fetched successfully', brand)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch brand', 500)
  }
}

export async function createBrand(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const user = c.get('user')
    const db = c.get('db')
    const brand = await BrandService.createBrand(db, data, user.id)
    return ApiResponse.success(c, 'Brand created successfully', brand, 201)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to create brand', 500)
  }
}

export async function updateBrand(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const user = c.get('user')
    const db = c.get('db')
    const brand = await BrandService.updateBrand(db, id, data, user.id)
    return ApiResponse.success(c, 'Brand updated successfully', brand)
  } catch (error: any) {
    if (error.message === 'BRAND_NOT_FOUND') {
      return ApiResponse.error(c, 'Brand not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to update brand', 500)
  }
}

export async function deleteBrand(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const db = c.get('db')
    await BrandService.deleteBrand(db, id, user.id)
    return ApiResponse.success(c, 'Brand deleted successfully', null)
  } catch (error: any) {
    if (error.message === 'BRAND_NOT_FOUND') {
      return ApiResponse.error(c, 'Brand not found', 404)
    }
    if (error.message === 'BRAND_HAS_PRODUCTS') {
      return ApiResponse.error(c, 'Cannot delete brand with active products', 409)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete brand', 500)
  }
}
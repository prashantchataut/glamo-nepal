import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/supabase'
import { ApiResponse } from '../../utils/response'
import * as BannerService from './banner.service'

export async function getBanners(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const result = await BannerService.getActiveBanners(supabase, kv)
    return ApiResponse.success(c, 'Banners fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch banners', 500)
  }
}

export async function getBannersByPosition(c: Context<AppEnv>) {
  try {
    const { pos } = c.req.param()
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const result = await BannerService.getActiveBanners(supabase, kv, pos)
    return ApiResponse.success(c, 'Banners fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch banners', 500)
  }
}

export async function createBanner(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const result = await BannerService.createBanner(data, user.id, supabase, kv)
    return ApiResponse.success(c, 'Banner created successfully', result, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to create banner', 500)
  }
}

export async function updateBanner(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const result = await BannerService.updateBanner(id, data, user.id, supabase, kv)
    return ApiResponse.success(c, 'Banner updated successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update banner', 500)
  }
}

export async function deleteBanner(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV
    await BannerService.deleteBanner(id, user.id, supabase, kv)
    return ApiResponse.success(c, 'Banner deleted successfully', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete banner', 500)
  }
}

export async function reorderBanners(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const user = c.get('user')
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const result = await BannerService.reorderBanners(data.items, user.id, supabase, kv)
    return ApiResponse.success(c, 'Banners reordered successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to reorder banners', 500)
  }
}

export async function getAllBanners(c: Context<AppEnv>) {
  try {
    const query = c.get('validatedQuery') || c.req.query()
    const supabase = c.get('supabase')
    const filters = {
      position: query.position,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    }
    const result = await BannerService.getAllBanners(filters, supabase)
    return ApiResponse.paginated(c, 'Banners fetched successfully', result.banners, result.total, result.page, result.limit)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch banners', 500)
  }
}
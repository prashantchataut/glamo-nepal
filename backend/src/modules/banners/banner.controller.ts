import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as BannerService from './banner.service'

export async function getBanners(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await BannerService.getBanners(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch banners', 500)
  }
}

export async function getBannersByPosition(c: Context<AppEnv>) {
  try {
    const { pos } = c.req.param()
    const supabase = c.get('supabase')
    const result = await BannerService.getBannersByPosition(pos, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch banners', 500)
  }
}

export async function createBanner(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await BannerService.createBanner(data, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to create banner', 500)
  }
}

export async function updateBanner(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await BannerService.updateBanner(id, data, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to update banner', 500)
  }
}

export async function deleteBanner(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    await BannerService.deleteBanner(id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to delete banner', 500)
  }
}

export async function reorderBanners(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await BannerService.reorderBanners(data.orders, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to reorder banners', 500)
  }
}
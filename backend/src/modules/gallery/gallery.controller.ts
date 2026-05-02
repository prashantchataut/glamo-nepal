import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as GalleryService from './gallery.service'

export async function getGallery(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await GalleryService.getGallery(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch gallery', 500)
  }
}

export async function createGalleryItem(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await GalleryService.createGalleryItem(data, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to create gallery item', 500)
  }
}

export async function updateGalleryItem(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await GalleryService.updateGalleryItem(id, data, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to update gallery item', 500)
  }
}

export async function deleteGalleryItem(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    await GalleryService.deleteGalleryItem(id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to delete gallery item', 500)
  }
}

export async function reorderGallery(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await GalleryService.reorderGallery(data.orders, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to reorder gallery', 500)
  }
}
import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import { AppError } from '../../utils/supabase'
import * as GalleryService from './gallery.service'

export async function getGallery(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const query = c.req.query()
    const filters: { category?: string } = {}
    if (query.category) filters.category = query.category
    const result = await GalleryService.getGalleryItems(supabase, kv, filters)
    return ApiResponse.success(c, 'Gallery items fetched', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch gallery', 500)
  }
}

export async function createGalleryItem(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const user = c.get('user')
    const result = await GalleryService.createGalleryItem(supabase, data, user.id)
    return ApiResponse.success(c, 'Gallery item created', result, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to create gallery item', 500)
  }
}

export async function updateGalleryItem(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const user = c.get('user')
    const result = await GalleryService.updateGalleryItem(supabase, id, data, user.id)
    return ApiResponse.success(c, 'Gallery item updated', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update gallery item', 500)
  }
}

export async function deleteGalleryItem(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const user = c.get('user')
    await GalleryService.deleteGalleryItem(supabase, id, user.id)
    return ApiResponse.success(c, 'Gallery item deleted', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete gallery item', 500)
  }
}

export async function reorderGallery(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const user = c.get('user')
    await GalleryService.reorderGalleryItems(supabase, data.items, user.id)
    return ApiResponse.success(c, 'Gallery items reordered', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to reorder gallery', 500)
  }
}
import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as PopupService from './popup.service'

export async function getActivePopups(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await PopupService.getActivePopups(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch active popups', 500)
  }
}

export async function getPopups(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await PopupService.getPopups(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch popups', 500)
  }
}

export async function createPopup(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await PopupService.createPopup(data, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to create popup', 500)
  }
}

export async function updatePopup(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await PopupService.updatePopup(id, data, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to update popup', 500)
  }
}

export async function deletePopup(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    await PopupService.deletePopup(id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to delete popup', 500)
  }
}
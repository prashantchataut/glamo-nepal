import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import { AppError } from '../../utils/supabase'
import * as PopupService from './popup.service'

export async function getActivePopup(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const kv = c.env.KV
    const result = await PopupService.getActivePopup(supabase, kv)
    return ApiResponse.success(c, 'Active popup fetched', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch active popup', 500)
  }
}

export async function getAllPopups(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await PopupService.getAllPopups(supabase)
    return ApiResponse.success(c, 'Popups fetched', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch popups', 500)
  }
}

export async function createPopup(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const user = c.get('user')
    const result = await PopupService.createPopup(supabase, data, user.id)
    return ApiResponse.success(c, 'Popup created', result, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to create popup', 500)
  }
}

export async function updatePopup(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const user = c.get('user')
    const result = await PopupService.updatePopup(supabase, id, data, user.id)
    return ApiResponse.success(c, 'Popup updated', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update popup', 500)
  }
}

export async function deletePopup(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const user = c.get('user')
    await PopupService.deletePopup(supabase, id, user.id)
    return ApiResponse.success(c, 'Popup deleted', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete popup', 500)
  }
}
import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import { AppError } from '../../utils/supabase'
import * as SettingsService from './settings.service'

export async function getPublicSettings(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await SettingsService.getPublicSettings(supabase, c.env.KV)
    return ApiResponse.success(c, 'Public settings fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch public settings', 500)
  }
}

export async function getSettings(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await SettingsService.getAllSettings(supabase)
    return ApiResponse.success(c, 'Settings fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch settings', 500)
  }
}

export async function updateSettings(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const user = c.get('user')
    const result = await SettingsService.updateSettings(supabase, data.settings, user.id, c.env.KV)
    return ApiResponse.success(c, result.message, null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update settings', 500)
  }
}
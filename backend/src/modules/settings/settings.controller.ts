import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as SettingsService from './settings.service'

export async function getPublicSettings(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await SettingsService.getPublicSettings(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch public settings', 500)
  }
}

export async function getSettings(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await SettingsService.getSettings(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch settings', 500)
  }
}

export async function updateSettings(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await SettingsService.updateSettings(data, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to update settings', 500)
  }
}
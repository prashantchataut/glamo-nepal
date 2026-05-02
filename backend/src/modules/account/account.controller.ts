import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/supabase'
import { ApiResponse } from '../../utils/response'
import * as AccountService from './account.service'

export async function getProfile(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await AccountService.getProfile(supabase, user.id)
    return ApiResponse.success(c, 'Profile fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch profile', 500)
  }
}

export async function updateProfile(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await AccountService.updateProfile(supabase, user.id, data, user.id)
    return ApiResponse.success(c, 'Profile updated successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update profile', 500)
  }
}

export async function uploadAvatar(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')
    const body = await c.req.parseBody()
    const file = body['avatar']
    if (!file || !(file instanceof File)) {
      return ApiResponse.error(c, 'No avatar file provided', 400)
    }
    const result = await AccountService.uploadAvatar(supabase, user.id, file, c.env)
    return ApiResponse.success(c, 'Avatar uploaded successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    if (error.message?.startsWith('Invalid file type') || error.message?.startsWith('File size exceeds')) {
      return ApiResponse.error(c, error.message, 400)
    }
    return ApiResponse.error(c, error.message || 'Failed to upload avatar', 500)
  }
}

export async function getAddresses(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await AccountService.getAddresses(supabase, user.id)
    return ApiResponse.success(c, 'Addresses fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch addresses', 500)
  }
}

export async function createAddress(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await AccountService.createAddress(supabase, user.id, data)
    return ApiResponse.success(c, 'Address created successfully', result, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to create address', 500)
  }
}

export async function updateAddress(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await AccountService.updateAddress(supabase, user.id, id, data)
    return ApiResponse.success(c, 'Address updated successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update address', 500)
  }
}

export async function deleteAddress(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    await AccountService.deleteAddress(supabase, user.id, id)
    return ApiResponse.success(c, 'Address deleted successfully', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete address', 500)
  }
}

export async function setDefaultAddress(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const result = await AccountService.setDefaultAddress(supabase, user.id, id)
    return ApiResponse.success(c, 'Default address set successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to set default address', 500)
  }
}
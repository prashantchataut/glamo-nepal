import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { getFullEnv } from '../../utils/env'
import { AppError } from '../../utils/turso-helpers'
import { ApiResponse } from '../../utils/response'
import * as AccountService from './account.service'

export async function getProfile(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const db = c.get('db')
    const result = await AccountService.getProfile(db, user.id)
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
    const db = c.get('db')
    const result = await AccountService.updateProfile(db, user.id, data, user.id)
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
    const db = c.get('db')
    const body = await c.req.parseBody()
    const file = body['avatar']
    if (!file || !(file instanceof File)) {
      return ApiResponse.error(c, 'No avatar file provided', 400)
    }
    const result = await AccountService.uploadAvatar(db, user.id, file, getFullEnv(c))
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
    const db = c.get('db')
    const result = await AccountService.getAddresses(db, user.id)
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
    const db = c.get('db')
    const result = await AccountService.createAddress(db, user.id, data)
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
    const db = c.get('db')
    const result = await AccountService.updateAddress(db, user.id, id, data)
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
    const db = c.get('db')
    await AccountService.deleteAddress(db, user.id, id)
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
    const db = c.get('db')
    const result = await AccountService.setDefaultAddress(db, user.id, id)
    return ApiResponse.success(c, 'Default address set successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to set default address', 500)
  }
}
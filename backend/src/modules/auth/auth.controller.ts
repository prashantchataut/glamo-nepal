import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/turso-helpers'
import { ApiResponse } from '../../utils/response'
import * as AuthService from './auth.service'

export async function register(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const db = c.get('db')
    const result = await AuthService.register(data, db)
    return ApiResponse.success(c, 'Registration successful', result, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode, error.code ? [error.code] : [])
    }
    return ApiResponse.error(c, error.message || 'Registration failed', 500)
  }
}

export async function findOrCreateUser(c: Context<AppEnv>) {
  try {
    const authUser = c.get('user')
    const db = c.get('db')
    const result = await AuthService.findOrCreateUser({
      uid: authUser.id,
      email: authUser.email,
    }, db)
    return ApiResponse.success(c, 'User synced', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode, error.code ? [error.code] : [])
    }
    return ApiResponse.error(c, error.message || 'User sync failed', 500)
  }
}

export async function getMe(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const db = c.get('db')
    const result = await AuthService.getMe(user.id, db)
    return ApiResponse.success(c, 'User fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode, error.code ? [error.code] : [])
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch user', 500)
  }
}

export async function updateProfile(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    const db = c.get('db')
    const result = await AuthService.updateUserProfile(user.id, data, db)
    return ApiResponse.success(c, 'Profile updated successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode, error.code ? [error.code] : [])
    }
    return ApiResponse.error(c, error.message || 'Profile update failed', 500)
  }
}

export async function logout(c: Context<AppEnv>) {
  return ApiResponse.success(c, 'Logged out successfully', null)
}
import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/supabase'
import { ApiResponse } from '../../utils/response'
import * as AuthService from './auth.service'

function setAuthCookies(c: Context<AppEnv>, accessToken: string, refreshToken: string) {
  c.header('Set-Cookie', [
    `__Host-access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`,
    `__Host-refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`,
  ].join(', '))
}

function clearAuthCookies(c: Context<AppEnv>) {
  c.header('Set-Cookie', [
    `__Host-access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    `__Host-refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
  ].join(', '))
}

export async function register(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await AuthService.register(data, supabase)

    if (result.accessToken && result.refreshToken) {
      setAuthCookies(c, result.accessToken, result.refreshToken)
    }

    return ApiResponse.success(c, 'Registration successful. Please verify your email.', result.user, 201)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Registration failed', 500)
  }
}

export async function login(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await AuthService.login(data, supabase)

    setAuthCookies(c, result.accessToken, result.refreshToken)

    return ApiResponse.success(c, 'Login successful', result.user)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Login failed', 500)
  }
}

export async function refreshToken(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await AuthService.refreshToken(data.refreshToken, supabase)

    setAuthCookies(c, result.accessToken, result.refreshToken)

    return ApiResponse.success(c, 'Token refreshed', result.user)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Token refresh failed', 500)
  }
}

export async function logout(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const authHeader = c.req.header('Authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    if (accessToken) {
      await AuthService.logout(accessToken, supabase)
    }

    clearAuthCookies(c)
    return ApiResponse.success(c, 'Logged out successfully', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Logout failed', 500)
  }
}

export async function forgotPassword(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    await AuthService.forgotPassword(data.email, supabase, c.env.FRONTEND_URL)
    return ApiResponse.success(c, 'If an account with that email exists, a reset link has been sent.', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to process request', 500)
  }
}

export async function resetPassword(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    await AuthService.resetPassword(data.password, supabase)
    return ApiResponse.success(c, 'Password reset successfully', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Password reset failed', 500)
  }
}

export async function getMe(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await AuthService.getMe(user.id, supabase)
    return ApiResponse.success(c, 'User fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch user', 500)
  }
}
import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as AuthService from './auth.service'

export async function register(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const result = await AuthService.register(data, c.env.DB, c.env)
    return ApiResponse.success(c, 'Registration successful. Please verify your email.', result.user, 201)
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      return ApiResponse.error(c, 'Email already registered', 409)
    }
    return ApiResponse.error(c, error.message || 'Registration failed', 500)
  }
}

export async function login(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const result = await AuthService.login(data, c.env.DB, c.env, c)
    return ApiResponse.success(c, 'Login successful', result.user)
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return ApiResponse.error(c, 'Invalid email or password', 401)
    }
    if (error.message === 'OAUTH_ACCOUNT') {
      return ApiResponse.error(c, 'This account uses Google sign-in. Please use Google to log in.', 400)
    }
    if (error.message === 'ACCOUNT_DISABLED') {
      return ApiResponse.error(c, 'Account is disabled', 403)
    }
    return ApiResponse.error(c, error.message || 'Login failed', 500)
  }
}

export async function logout(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    if (user) {
      await AuthService.logout(user.id, c.env.DB, c)
    }
    return ApiResponse.success(c, 'Logged out successfully', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Logout failed', 500)
  }
}

export async function refreshToken(c: Context<AppEnv>) {
  try {
    const cookieHeader = c.req.header('Cookie')
    let token: string | undefined
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)__Host-refresh_token=([^;]+)/)
      token = match?.[1]
    }

    if (!token) {
      return ApiResponse.error(c, 'No refresh token provided', 401)
    }

    const result = await AuthService.refreshToken(token, c.env.DB, c.env, c)
    return ApiResponse.success(c, 'Token refreshed', result.user)
  } catch (error: any) {
    if (error.message === 'INVALID_TOKEN' || error.message === 'TOKEN_EXPIRED' || error.message === 'NO_TOKEN') {
      return ApiResponse.error(c, 'Invalid or expired refresh token', 401)
    }
    if (error.message === 'USER_NOT_FOUND') {
      return ApiResponse.error(c, 'User not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Token refresh failed', 500)
  }
}

export async function verifyEmail(c: Context<AppEnv>) {
  try {
    const { token } = c.req.param()
    if (!token) {
      return ApiResponse.error(c, 'Verification token is required', 400)
    }

    await AuthService.verifyEmail(token, c.env.DB)
    return ApiResponse.success(c, 'Email verified successfully', null)
  } catch (error: any) {
    if (error.message === 'INVALID_TOKEN') {
      return ApiResponse.error(c, 'Invalid verification token', 400)
    }
    if (error.message === 'TOKEN_EXPIRED') {
      return ApiResponse.error(c, 'Verification token has expired', 400)
    }
    return ApiResponse.error(c, error.message || 'Email verification failed', 500)
  }
}

export async function forgotPassword(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    await AuthService.forgotPassword(data.email, c.env.DB, c.env)
    return ApiResponse.success(c, 'If an account with that email exists, a reset link has been sent.', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to process request', 500)
  }
}

export async function resetPassword(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    await AuthService.resetPassword(data.token, data.password, c.env.DB)
    return ApiResponse.success(c, 'Password reset successfully', null)
  } catch (error: any) {
    if (error.message === 'INVALID_TOKEN') {
      return ApiResponse.error(c, 'Invalid or expired reset token', 400)
    }
    if (error.message === 'TOKEN_EXPIRED') {
      return ApiResponse.error(c, 'Reset token has expired', 400)
    }
    return ApiResponse.error(c, error.message || 'Password reset failed', 500)
  }
}

export async function changePassword(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const data = c.get('validatedBody')
    await AuthService.changePassword(user.id, data.currentPassword, data.newPassword, c.env.DB)
    return ApiResponse.success(c, 'Password changed successfully', null)
  } catch (error: any) {
    if (error.message === 'INVALID_CURRENT_PASSWORD') {
      return ApiResponse.error(c, 'Current password is incorrect', 400)
    }
    return ApiResponse.error(c, error.message || 'Password change failed', 500)
  }
}

export async function googleOAuthGetUrl(c: Context<AppEnv>) {
  try {
    const url = AuthService.googleOAuthGetUrl(c.env)
    return ApiResponse.success(c, 'Google OAuth URL generated', { url })
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to generate OAuth URL', 500)
  }
}

export async function googleOAuthCallback(c: Context<AppEnv>) {
  try {
    const code = c.req.query('code')
    if (!code) {
      return c.redirect(`${c.env.FRONTEND_URL}/login?error=google_auth_failed`)
    }

    const result = await AuthService.googleOAuthCallback(code, c.env.DB, c.env, c)
    return c.redirect(`${c.env.FRONTEND_URL}/auth/callback?success=true`)
  } catch (error: any) {
    return c.redirect(`${c.env.FRONTEND_URL}/login?error=google_auth_failed`)
  }
}

export async function getMe(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const result = await AuthService.getMe(user.id, c.env.DB)
    return ApiResponse.success(c, 'User fetched successfully', result)
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return ApiResponse.error(c, 'User not found', 404)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch user', 500)
  }
}
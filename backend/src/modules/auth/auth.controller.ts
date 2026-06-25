import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/turso-helpers'
import { ApiResponse } from '../../utils/response'
import * as AuthService from './auth.service'

export async function sendVerificationEmailController(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody') as { email: string }
    const db = c.get('db')
    const env = c.env

    const result = await db.execute({
      sql: "SELECT id, email, first_name FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1",
      args: [data.email.toLowerCase()],
    })

    if (result.rows.length === 0) {
      return ApiResponse.success(c, 'If an account with that email exists, a verification email has been sent.', null)
    }

    const user = result.rows[0] as any

    const alreadyVerified = await db.execute({
      sql: "SELECT id FROM users WHERE id = ? AND email_verified = 1",
      args: [user.id],
    })
    if (alreadyVerified.rows.length > 0) {
      return ApiResponse.success(c, 'Your email is already verified.', null)
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await db.execute({
      sql: `INSERT INTO email_verifications (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [crypto.randomUUID(), user.id, token, expiresAt],
    }).catch(() => {
      return db.execute({
        sql: "UPDATE email_verifications SET token = ?, expires_at = ?, created_at = datetime('now') WHERE user_id = ?",
        args: [token, expiresAt, user.id],
      })
    })

    if (env.RESEND_API_KEY) {
      const { sendVerificationEmail } = await import('../../utils/email')
      await sendVerificationEmail(user.email, user.first_name || 'there', token, env)
    }

    return ApiResponse.success(c, 'If an account with that email exists, a verification email has been sent.', null)
  } catch (error: any) {
    console.error('Send verification email error:', error)
    return ApiResponse.success(c, 'If an account with that email exists, a verification email has been sent.', null)
  }
}

export async function verifyEmailController(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody') as { token: string }
    const db = c.get('db')

    const result = await db.execute({
      sql: "SELECT * FROM email_verifications WHERE token = ? AND expires_at > datetime('now') AND used_at IS NULL LIMIT 1",
      args: [data.token],
    })

    if (result.rows.length === 0) {
      return ApiResponse.error(c, 'Invalid or expired verification token', 400, ['INVALID_TOKEN'])
    }

    const verification = result.rows[0] as any

    await db.execute({
      sql: "UPDATE users SET email_verified = 1, updated_at = datetime('now') WHERE id = ?",
      args: [verification.user_id],
    })

    await db.execute({
      sql: "UPDATE email_verifications SET used_at = datetime('now') WHERE id = ?",
      args: [verification.id],
    })

    return ApiResponse.success(c, 'Email verified successfully.', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode, error.code ? [error.code] : [])
    }
    return ApiResponse.error(c, error.message || 'Email verification failed', 500)
  }
}

export async function register(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const db = c.get('db')
    const result = await AuthService.register(data, db)

    if (c.env.RESEND_API_KEY && result.user?.email) {
      try {
        const token = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        await db.execute({
          sql: `INSERT INTO email_verifications (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
          args: [crypto.randomUUID(), result.user.id, token, expiresAt],
        }).catch(() => {
          return db.execute({
            sql: "UPDATE email_verifications SET token = ?, expires_at = ?, created_at = datetime('now') WHERE user_id = ?",
            args: [token, expiresAt, result.user.id],
          })
        })
        const { sendVerificationEmail } = await import('../../utils/email')
        await sendVerificationEmail(result.user.email, result.user.firstName || 'there', token, c.env)
      } catch (err) {
        console.error('Failed to send verification email after registration:', err)
      }
    }

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
    const body = await c.req.json().catch(() => ({} as Record<string, unknown>))
    const result = await AuthService.findOrCreateUser({
      uid: authUser.id,
      email: authUser.email,
      firstName: typeof body.firstName === 'string' ? body.firstName : undefined,
      lastName: typeof body.lastName === 'string' ? body.lastName : undefined,
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

export async function forgotPassword(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody') as { email: string }
    const db = c.get('db')
    const env = c.env

    const result = await db.execute({
      sql: "SELECT id, email, first_name FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1",
      args: [data.email.toLowerCase()],
    })

    const accountExists = result.rows.length > 0

    if (!accountExists) {
      return ApiResponse.success(c, 'If an account with that email exists, a reset link has been sent.', { accountExists })
    }

    const user = result.rows[0]
    const resetToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    await db.execute({
      sql: `INSERT INTO password_resets (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [crypto.randomUUID(), (user as any).id, resetToken, expiresAt],
    }).catch(() => {
      return db.execute({
        sql: "UPDATE password_resets SET token = ?, expires_at = ?, created_at = datetime('now') WHERE user_id = ?",
        args: [resetToken, expiresAt, (user as any).id],
      })
    })

    if (env.RESEND_API_KEY) {
      const { sendPasswordReset } = await import('../../utils/email')
      await sendPasswordReset((user as any).email, resetToken, env)
    } else {
      console.warn('[Auth] RESEND_API_KEY is not set. Password reset email was NOT sent. Set RESEND_API_KEY in backend/.env to enable email delivery.')
    }

    return ApiResponse.success(c, 'If an account with that email exists, a reset link has been sent.', { accountExists })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return ApiResponse.success(c, 'If an account with that email exists, a reset link has been sent.', { accountExists: false })
  }
}

export async function resetPassword(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody') as { password: string; token: string }
    const db = c.get('db')
    const { token, password } = data

    const resetResult = await db.execute({
      sql: "SELECT * FROM password_resets WHERE token = ? AND expires_at > datetime('now') AND used_at IS NULL LIMIT 1",
      args: [token],
    })

    if (resetResult.rows.length === 0) {
      return ApiResponse.error(c, 'Invalid or expired reset token', 400, ['INVALID_TOKEN'])
    }

    const reset = resetResult.rows[0] as any
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    const updateResult = await db.execute({
      sql: "UPDATE password_resets SET used_at = datetime('now') WHERE id = ? AND used_at IS NULL",
      args: [reset.id],
    })

    const changes = updateResult.rowsAffected ?? 0
    if (changes === 0) {
      return ApiResponse.error(c, 'This reset token has already been used. Please request a new one.', 400, ['TOKEN_ALREADY_USED'])
    }

    await db.execute({
      sql: "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
      args: [hashedPassword, reset.user_id],
    })

    return ApiResponse.success(c, 'Password has been reset successfully.', null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode, error.code ? [error.code] : [])
    }
    return ApiResponse.error(c, error.message || 'Password reset failed', 500)
  }
}
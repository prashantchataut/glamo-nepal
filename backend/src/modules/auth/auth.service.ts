import { hashPassword, comparePassword } from '../../utils/password'
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../../utils/jwt'
import { sendEmail, verifyEmail as verifyEmailTemplate, passwordReset as passwordResetTemplate } from '../../utils/email'
import type { CloudflareBindings } from '../../types/bindings'
import type { Context } from 'hono'

async function sha256(input: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

interface UserRow {
  id: string
  email: string
  phone: string | null
  password_hash: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: string
  is_active: number
  email_verified: number
  phone_verified: number
  google_id: string | null
  created_at: string
  updated_at: string
}

function sanitizeUser(user: UserRow) {
  const { password_hash, ...rest } = user
  return {
    ...rest,
    isActive: !!rest.is_active,
    emailVerified: !!rest.email_verified,
    phoneVerified: !!rest.phone_verified,
  }
}

export async function register(
  data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    phone?: string
  },
  db: D1Database,
  env: CloudflareBindings
) {
  const existing = await db
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(data.email)
    .first()

  if (existing) {
    throw new Error('EMAIL_EXISTS')
  }

  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(data.password)

  await db
    .prepare(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, data.email, passwordHash, data.firstName ?? null, data.lastName ?? null, data.phone ?? null, 'CUSTOMER', 1, 0)
    .run()

  const rawToken = crypto.randomUUID()
  const tokenHash = await sha256(rawToken)
  const verificationId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await db
    .prepare('INSERT INTO email_verifications (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .bind(verificationId, id, tokenHash, expiresAt)
    .run()

  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${rawToken}`
  const userName = data.firstName || data.email.split('@')[0]
  const html = verifyEmailTemplate(userName, verificationUrl)
  await sendEmail(data.email, 'Verify your email - GLAMO Nepal', html, env)

  const user = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<UserRow>()

  return { user: sanitizeUser(user!), verificationToken: rawToken }
}

export async function login(
  data: { email: string; password: string; rememberMe?: boolean },
  db: D1Database,
  env: CloudflareBindings,
  c: Context
) {
  const user = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(data.email)
    .first<UserRow>()

  if (!user) {
    throw new Error('INVALID_CREDENTIALS')
  }

  if (!user.password_hash) {
    throw new Error('OAUTH_ACCOUNT')
  }

  const valid = await comparePassword(data.password, user.password_hash)
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS')
  }

  if (!user.is_active) {
    throw new Error('ACCOUNT_DISABLED')
  }

  const tokenPayload = { id: user.id, email: user.email, role: user.role }
  const accessToken = await generateAccessToken(tokenPayload, env.JWT_PRIVATE_KEY)
  const refreshToken = await generateRefreshToken(tokenPayload, env.JWT_PRIVATE_KEY)

  const refreshTokenId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await db
    .prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .bind(refreshTokenId, user.id, refreshToken, expiresAt)
    .run()

  setAuthCookies(c, accessToken, refreshToken)

  return { user: sanitizeUser(user), accessToken, refreshToken }
}

export async function logout(userId: string, db: D1Database, c: Context) {
  const cookieHeader = c.req.header('Cookie')
  let token: string | undefined
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)__Host-refresh_token=([^;]+)/)
    token = match?.[1]
  }

  if (token) {
    await db
      .prepare('UPDATE refresh_tokens SET revoked_at = datetime(\'now\') WHERE token = ? AND user_id = ?')
      .bind(token, userId)
      .run()
  }

  clearAuthCookies(c)
}

export async function refreshToken(token: string, db: D1Database, env: CloudflareBindings, c: Context) {
  if (!token) {
    throw new Error('NO_TOKEN')
  }

  const stored = await db
    .prepare('SELECT * FROM refresh_tokens WHERE token = ? AND revoked_at IS NULL')
    .bind(token)
    .first<{ id: string; user_id: string; token: string; expires_at: string }>()

  if (!stored) {
    throw new Error('INVALID_TOKEN')
  }

  if (new Date(stored.expires_at) < new Date()) {
    await db
      .prepare('UPDATE refresh_tokens SET revoked_at = datetime(\'now\') WHERE id = ?')
      .bind(stored.id)
      .run()
    throw new Error('TOKEN_EXPIRED')
  }

  const user = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(stored.user_id)
    .first<UserRow>()

  if (!user || !user.is_active) {
    throw new Error('USER_NOT_FOUND')
  }

  await db
    .prepare('UPDATE refresh_tokens SET revoked_at = datetime(\'now\') WHERE id = ?')
    .bind(stored.id)
    .run()

  const tokenPayload = { id: user.id, email: user.email, role: user.role }
  const newAccessToken = await generateAccessToken(tokenPayload, env.JWT_PRIVATE_KEY)
  const newRefreshToken = await generateRefreshToken(tokenPayload, env.JWT_PRIVATE_KEY)

  const newRefreshTokenId = crypto.randomUUID()
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await db
    .prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .bind(newRefreshTokenId, user.id, newRefreshToken, newExpiresAt)
    .run()

  setAuthCookies(c, newAccessToken, newRefreshToken)

  return { user: sanitizeUser(user), accessToken: newAccessToken, refreshToken: newRefreshToken }
}

export async function verifyEmail(token: string, db: D1Database) {
  const tokenHash = await sha256(token)

  const verification = await db
    .prepare('SELECT * FROM email_verifications WHERE token = ? AND used_at IS NULL')
    .bind(tokenHash)
    .first<{ id: string; user_id: string; token: string; expires_at: string }>()

  if (!verification) {
    throw new Error('INVALID_TOKEN')
  }

  if (new Date(verification.expires_at) < new Date()) {
    throw new Error('TOKEN_EXPIRED')
  }

  await db
    .prepare('UPDATE users SET email_verified = 1, updated_at = datetime(\'now\') WHERE id = ?')
    .bind(verification.user_id)
    .run()

  await db
    .prepare('UPDATE email_verifications SET used_at = datetime(\'now\') WHERE id = ?')
    .bind(verification.id)
    .run()
}

export async function forgotPassword(email: string, db: D1Database, env: CloudflareBindings) {
  const user = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<UserRow>()

  if (!user) {
    return
  }

  const rawToken = crypto.randomUUID()
  const tokenHash = await sha256(rawToken)
  const resetId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  await db
    .prepare('INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .bind(resetId, user.id, tokenHash, expiresAt)
    .run()

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`
  const userName = user.first_name || user.email.split('@')[0]
  const html = passwordResetTemplate(userName, resetUrl)
  await sendEmail(email, 'Reset your password - GLAMO Nepal', html, env)
}

export async function resetPassword(token: string, newPassword: string, db: D1Database) {
  const tokenHash = await sha256(token)

  const reset = await db
    .prepare('SELECT * FROM password_resets WHERE token = ? AND used_at IS NULL')
    .bind(tokenHash)
    .first<{ id: string; user_id: string; token: string; expires_at: string }>()

  if (!reset) {
    throw new Error('INVALID_TOKEN')
  }

  if (new Date(reset.expires_at) < new Date()) {
    throw new Error('TOKEN_EXPIRED')
  }

  const passwordHash = await hashPassword(newPassword)

  await db
    .prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .bind(passwordHash, reset.user_id)
    .run()

  await db
    .prepare('UPDATE password_resets SET used_at = datetime(\'now\') WHERE id = ?')
    .bind(reset.id)
    .run()

  await db
    .prepare('UPDATE refresh_tokens SET revoked_at = datetime(\'now\') WHERE user_id = ? AND revoked_at IS NULL')
    .bind(reset.user_id)
    .run()
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  db: D1Database
) {
  const user = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first<UserRow>()

  if (!user || !user.password_hash) {
    throw new Error('USER_NOT_FOUND')
  }

  const valid = await comparePassword(currentPassword, user.password_hash)
  if (!valid) {
    throw new Error('INVALID_CURRENT_PASSWORD')
  }

  const passwordHash = await hashPassword(newPassword)

  await db
    .prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .bind(passwordHash, userId)
    .run()
}

export function googleOAuthGetUrl(env: CloudflareBindings) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${new URL(env.FRONTEND_URL).origin}/api/v1/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function googleOAuthCallback(code: string, db: D1Database, env: CloudflareBindings, c: Context) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${new URL(env.FRONTEND_URL).origin}/api/v1/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('GOOGLE_TOKEN_ERROR')
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string; id_token: string }
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!userInfoResponse.ok) {
    throw new Error('GOOGLE_USER_ERROR')
  }

  const googleUser = (await userInfoResponse.json()) as {
    sub: string
    email: string
    given_name?: string
    family_name?: string
    picture?: string
  }

  let user = await db
    .prepare('SELECT * FROM users WHERE google_id = ?')
    .bind(googleUser.sub)
    .first<UserRow>()

  if (!user) {
    user = await db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(googleUser.email)
      .first<UserRow>()

    if (user) {
      await db
        .prepare('UPDATE users SET google_id = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .bind(googleUser.sub, user.id)
        .run()
      user = await db
        .prepare('SELECT * FROM users WHERE id = ?')
        .bind(user.id)
        .first<UserRow>()
    } else {
      const id = crypto.randomUUID()
      await db
        .prepare(
          'INSERT INTO users (id, email, first_name, last_name, avatar_url, google_id, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          id,
          googleUser.email,
          googleUser.given_name ?? null,
          googleUser.family_name ?? null,
          googleUser.picture ?? null,
          googleUser.sub,
          'CUSTOMER',
          1,
          1
        )
        .run()
      user = await db
        .prepare('SELECT * FROM users WHERE id = ?')
        .bind(id)
        .first<UserRow>()
    }
  }

  const tokenPayload = { id: user!.id, email: user!.email, role: user!.role }
  const accessToken = await generateAccessToken(tokenPayload, env.JWT_PRIVATE_KEY)
  const refreshToken = await generateRefreshToken(tokenPayload, env.JWT_PRIVATE_KEY)

  const refreshTokenId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await db
    .prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .bind(refreshTokenId, user!.id, refreshToken, expiresAt)
    .run()

  setAuthCookies(c, accessToken, refreshToken)

  return { user: sanitizeUser(user!), accessToken, refreshToken }
}

export async function getMe(userId: string, db: D1Database) {
  const user = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first<UserRow>()

  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  return sanitizeUser(user)
}
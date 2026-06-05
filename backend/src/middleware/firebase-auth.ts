import { createMiddleware } from 'hono/factory'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import type { AppEnv } from '../types/bindings'

const FIREBASE_PROJECT_ID = 'ankura-studio'
const JWKS_URI = `https://www.googleapis.com/service_accounts/v1/jwk/cert?email=firebase-adminsdk-fbsvc@${FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`

let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null

function getJWKS() {
  if (!cachedJWKS) {
    cachedJWKS = createRemoteJWKSet(new URL(JWKS_URI))
  }
  return cachedJWKS
}

export async function verifyFirebaseToken(token: string): Promise<{ uid: string; email: string }> {
  const jwks = getJWKS()
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  })

  return {
    uid: payload.sub!,
    email: payload.email as string,
  }
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
    ?? getCookieToken(c)

  if (!token) {
    return c.json({ success: false, message: 'Unauthorized: no token provided', errors: [] }, 401)
  }

  try {
    const { uid, email } = await verifyFirebaseToken(token)

    const db = c.get('db')
    const result = await db.execute({
      sql: 'SELECT id, role, is_active FROM users WHERE id = ?',
      args: [uid],
    })

    const profile = result.rows[0]
    if (!profile) {
      return c.json({ success: false, message: 'Unauthorized: user not found', errors: [] }, 401)
    }

    const isActive = profile.is_active
    if (typeof isActive === 'number' ? isActive !== 1 : !isActive) {
      return c.json({ success: false, message: 'Unauthorized: user inactive', errors: [] }, 401)
    }

    c.set('user', {
      id: profile.id as string,
      email,
      role: profile.role as string,
      isActive: typeof isActive === 'number' ? isActive === 1 : !!isActive,
    })

    await next()
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ success: false, message: 'Unauthorized: invalid token', errors: [] }, 401)
  }
})

function getCookieToken(c: Parameters<typeof authMiddleware>[0]): string | undefined {
  const cookieHeader = c.req.header('Cookie')
  if (!cookieHeader) return undefined
  const match = cookieHeader.match(/(?:^|;\s*)__Host-access_token=([^;]+)/)
  return match?.[1]
}
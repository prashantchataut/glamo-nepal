import { createMiddleware } from 'hono/factory'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { getEnv } from '../utils/env'
import type { AppEnv } from '../types/bindings'

function getFirebaseProjectId(c: Parameters<typeof authMiddleware>[0]): string {
  const envProjectId = getEnv(c, 'FIREBASE_PROJECT_ID')
  if (envProjectId) return envProjectId
  throw new Error('FIREBASE_PROJECT_ID environment variable is not set')
}

function buildJwksUri(projectId: string): string {
  return `https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com`
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function getJWKS(projectId: string) {
  if (!jwksCache.has(projectId)) {
    jwksCache.set(projectId, createRemoteJWKSet(new URL(buildJwksUri(projectId))))
  }
  return jwksCache.get(projectId)!
}

export async function verifyFirebaseToken(token: string, projectId: string): Promise<{ uid: string; email: string }> {
  const jwks = getJWKS(projectId)
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  })

  return {
    uid: payload.sub!,
    email: payload.email as string,
  }
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const adminSession = getAdminSessionToken(c)
  if (adminSession) {
    const adminUser = await verifyAdminSession(adminSession)
    if (adminUser) {
      const db = c.get('db')
      const result = await db.execute({
        sql: "SELECT id, role, is_active FROM users WHERE email = ? AND deleted_at IS NULL AND role IN ('ADMIN', 'SUPER_ADMIN')",
        args: [adminUser.email],
      })
      if (result.rows.length > 0) {
        const profile = result.rows[0]
        const isActive = profile.is_active
        c.set('user', {
          id: profile.id as string,
          email: adminUser.email,
          role: profile.role as string,
          isActive: typeof isActive === 'number' ? isActive === 1 : !!isActive,
        })
        await next()
        return
      }
    }
  }

  const token = c.req.header('Authorization')?.replace('Bearer ', '')
    ?? getCookieToken(c)

  if (!token) {
    return c.json({ success: false, message: 'Unauthorized: no token provided', errors: [] }, 401)
  }

  try {
    const projectId = getFirebaseProjectId(c)
    const { uid, email } = await verifyFirebaseToken(token, projectId)

    const isSyncRoute = c.req.path.endsWith('/sync')

    if (isSyncRoute) {
      c.set('user', { id: uid, email, role: 'customer', isActive: true })
    } else {
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
    }
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ success: false, message: 'Unauthorized: invalid token', errors: [] }, 401)
  }

  await next()
})

function getCookieToken(c: Parameters<typeof authMiddleware>[0]): string | undefined {
  const cookieHeader = c.req.header('Cookie')
  if (!cookieHeader) return undefined
  const match = cookieHeader.match(/(?:^|;\s*)glamo-access-token=([^;]+)/)
  return match?.[1]
}

function getAdminSessionToken(c: Parameters<typeof authMiddleware>[0]): string | undefined {
  const cookieHeader = c.req.header('Cookie')
  if (!cookieHeader) return undefined
  const cookieName = process.env.NODE_ENV === 'production' ? '__Host-glamo-admin-session' : 'glamo-admin-session'
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`))
  return match?.[1]
}

async function verifyAdminSession(token: string): Promise<{ email: string; name: string; role: string } | null> {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET
  if (!secret) return null

  try {
    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) return null

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(encodedPayload))
    const expectedBase64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')

    if (signature !== expectedBase64) return null

    const padding = encodedPayload.length % 4
    const padded = padding ? encodedPayload + '='.repeat(4 - padding) : encodedPayload
    const payload = JSON.parse(atob(padded.replaceAll('-', '+').replaceAll('_', '/')))

    if (payload.role !== 'admin') return null
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null

    return { email: payload.email, name: payload.name, role: payload.role }
  } catch {
    return null
  }
}
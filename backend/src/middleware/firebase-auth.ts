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
  // Client-issued Firebase ID tokens are signed by securetoken.google.com
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
      // For /sync, we don't enforce DB existence so the route can create the user
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
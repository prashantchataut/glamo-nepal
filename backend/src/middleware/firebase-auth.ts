import { createMiddleware } from 'hono/factory'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { getEnv } from '../utils/env'
import type { AppEnv } from '../types/bindings'

function getFirebaseProjectId(c: Parameters<typeof authMiddleware>[0]): string {
  const envProjectId = getEnv(c, 'FIREBASE_PROJECT_ID')
  if (envProjectId) return envProjectId
  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (publicProjectId) return publicProjectId
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

function getSuperAdminEmails(): { owner: string; admins: string[] } {
  const raw = process.env.SUPER_ADMIN_EMAILS || process.env.ADMIN_EMAIL || ''
  const emails = raw.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean)
  return {
    owner: emails[0] || '',
    admins: emails,
  }
}

function isSuperAdmin(email: string): boolean {
  return getSuperAdminEmails().admins.includes(email.toLowerCase())
}

function isOwner(email: string): boolean {
  return getSuperAdminEmails().owner === email.toLowerCase()
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const adminSession = getAdminSessionToken(c)
  if (adminSession) {
const adminUser = await verifyAdminSession(adminSession)
      if (adminUser) {
        if (adminUser.jti) {
          try {
            const db = c.get('db')
            const revoked = await db.execute({
              sql: "SELECT id FROM admin_session_revocations WHERE jti = ? LIMIT 1",
              args: [adminUser.jti],
            })
            if (revoked.rows.length > 0) {
              return c.json({ success: false, message: 'Session revoked', errors: [] }, 401)
            }
          } catch {
            // Revocation table may not exist yet; allow through if check fails
          }
        }
        const db = c.get('db')
      const result = await db.execute({
        sql: "SELECT id, role, is_active FROM users WHERE email = ? AND deleted_at IS NULL AND role IN ('ADMIN', 'SUPER_ADMIN')",
        args: [adminUser.email],
      })
      if (result.rows.length > 0) {
        const profile = result.rows[0]
        const isActive = profile.is_active
        const role = isOwner(adminUser.email) ? 'OWNER' : (profile.role as string)
        c.set('user', {
          id: profile.id as string,
          email: adminUser.email,
          role,
          isActive: typeof isActive === 'number' ? isActive === 1 : !!isActive,
        })
        await next()
        return
      }

      if (isSuperAdmin(adminUser.email)) {
        const db = c.get('db')
        const existingAdmin = await db.execute({
          sql: "SELECT id, role, is_active FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1",
          args: [adminUser.email],
        })
        if (existingAdmin.rows.length > 0) {
          const profile = existingAdmin.rows[0]
          const isActive = profile.is_active
          const role = isOwner(adminUser.email) ? 'OWNER' : 'SUPER_ADMIN'
          c.set('user', {
            id: profile.id as string,
            email: adminUser.email,
            role,
            isActive: typeof isActive === 'number' ? isActive === 1 : !!isActive,
          })
        } else {
          const adminId = crypto.randomUUID()
          const role = isOwner(adminUser.email) ? 'OWNER' : 'SUPER_ADMIN'
          try {
            await db.execute({
              sql: `INSERT INTO users (id, email, first_name, role, is_active, email_verified, created_at, updated_at)
                    VALUES (?, ?, 'GLAMO Admin', ?, 1, 1, datetime('now'), datetime('now'))`,
              args: [adminId, adminUser.email, role],
            })
            c.set('user', {
              id: adminId,
              email: adminUser.email,
              role,
              isActive: true,
            })
          } catch (error: any) {
            if (error?.message?.includes('UNIQUE constraint')) {
              const retryResult = await db.execute({
                sql: "SELECT id, role, is_active FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1",
                args: [adminUser.email],
              })
              if (retryResult.rows.length > 0) {
                const profile = retryResult.rows[0]
                const isActive = profile.is_active
                const role = isOwner(adminUser.email) ? 'OWNER' : 'SUPER_ADMIN'
                c.set('user', {
                  id: profile.id as string,
                  email: adminUser.email,
                  role,
                  isActive: typeof isActive === 'number' ? isActive === 1 : !!isActive,
                })
              } else {
                console.error('[Auth] Admin user exists but cannot be retrieved, denying access')
                return c.json({ success: false, message: 'Unauthorized', errors: [] }, 401)
              }
            } else {
              console.error('[Auth] Failed to create admin user, denying access')
              return c.json({ success: false, message: 'Unauthorized', errors: [] }, 401)
            }
          }
        }
        await next()
        return
      }
    }
  }

  const authHeader = c.req.header('Authorization')
  const cookieToken = getCookieToken(c)
  const rawToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : (authHeader || undefined)
  const token = rawToken || cookieToken

  if (!token) {
    if (c.req.path.startsWith('/api/v1/admin')) {
      return c.json({ success: false, message: 'Route not found', errors: [] }, 404)
    }
    return c.json({ success: false, message: 'Unauthorized: no token provided', errors: [] }, 401)
  }

  const tokenParts = token.split('.')
  if (tokenParts.length !== 3) {
    console.error('[Auth] Invalid token format')
    return c.json({ success: false, message: 'Unauthorized: invalid token format', errors: [] }, 401)
  }

  try {
    const projectId = getFirebaseProjectId(c)
    const { uid, email } = await verifyFirebaseToken(token, projectId)

    const isSyncRoute = c.req.path.endsWith('/sync')

    if (isSyncRoute) {
      const db = c.get('db')
      const result = await db.execute({
        sql: 'SELECT id, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL',
        args: [uid],
      })

      if (result.rows.length > 0) {
        const profile = result.rows[0]
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
      } else {
        c.set('user', { id: uid, email, role: 'CUSTOMER', isActive: true })
      }
    } else {
      const db = c.get('db')
      const result = await db.execute({
        sql: 'SELECT id, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL',
        args: [uid],
      })

      const profile = result.rows[0]
      if (!profile) {
        const emailLocal = email?.split('@')[0] || ''
        const nameParts = emailLocal.split(/[._-]/)
        const firstName = nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1) || ''
        const lastName = nameParts.slice(1).join(' ') || null
        try {
          await db.execute({
            sql: `INSERT INTO users (id, email, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
                  VALUES (?, ?, ?, ?, 'CUSTOMER', 1, 1, datetime('now'), datetime('now'))`,
            args: [uid, email || null, firstName, lastName],
          })
        } catch (insertError: any) {
          if (insertError?.message?.includes('UNIQUE constraint')) {
            const retryResult = await db.execute({
              sql: 'SELECT id, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL',
              args: [uid],
            })
            if (retryResult.rows.length > 0) {
              const retryProfile = retryResult.rows[0]
              const retryActive = retryProfile.is_active
              c.set('user', {
                id: retryProfile.id as string,
                email,
                role: retryProfile.role as string,
                isActive: typeof retryActive === 'number' ? retryActive === 1 : !!retryActive,
              })
              await next()
              return
            }
            const byEmail = await db.execute({
              sql: 'SELECT id, role, is_active FROM users WHERE LOWER(email) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
              args: [email],
            })
            if (byEmail.rows.length > 0) {
              const existing = byEmail.rows[0]
              c.set('user', {
                id: existing.id as string,
                email,
                role: existing.role as string,
                isActive: typeof existing.is_active === 'number' ? existing.is_active === 1 : !!existing.is_active,
              })
              await next()
              return
            }
          }
          console.error('[Auth] Failed to auto-create user:', insertError instanceof Error ? `${insertError.name}: ${insertError.message}` : String(insertError))
          return c.json({ success: false, message: 'Unauthorized: user not found', errors: [] }, 401)
        }
        c.set('user', {
          id: uid,
          email,
          role: 'CUSTOMER',
          isActive: true,
        })
      } else {
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
    }
  } catch (error) {
    console.error('[Auth] Token verification failed:', error instanceof Error ? `${error.name}: ${error.message}` : String(error))
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

export async function verifyAdminSession(token: string): Promise<{ email: string; name: string; role: string; jti?: string } | null> {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET
  if (!secret || secret.length === 0) return null

  try {
    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) return null

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(encodedPayload))
    const expectedBase64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')

    const sigBytes = Uint8Array.from(atob(signature.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0))
    const expBytes = Uint8Array.from(atob(expectedBase64.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0))
    if (sigBytes.length !== expBytes.length) return null
    let mismatch = 0
    for (let i = 0; i < sigBytes.length; i++) {
      mismatch |= sigBytes[i] ^ expBytes[i]
    }
    if (mismatch !== 0) return null

    const padding = encodedPayload.length % 4
    const padded = padding ? encodedPayload + '='.repeat(4 - padding) : encodedPayload
    const payload = JSON.parse(atob(padded.replaceAll('-', '+').replaceAll('_', '/')))

    if (payload.role !== 'admin') return null
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null

    return { email: payload.email, name: payload.name, role: payload.role, jti: payload.jti }
  } catch {
    return null
  }
}

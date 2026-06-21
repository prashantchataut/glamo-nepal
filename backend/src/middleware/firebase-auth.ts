import { createMiddleware } from 'hono/factory'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { getEnv } from '../utils/env'
import type { AppEnv } from '../types/bindings'
import { verifyProxyTrust, readProxyTrustSecret, PROXY_TRUST_HEADER } from '../utils/proxy-trust'

function adminCookieNames(): string[] {
  return ['__Host-glamo-admin-session', 'glamo-admin-session']
}

function extractCookieValue(cookieHeader: string, cookieName: string): string | undefined {
  const escaped = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`))
  return match?.[1]
}

async function verifyAdminCookie(c: Parameters<typeof authMiddleware>[0], cookieHeader: string): Promise<{ email: string; name: string; role: string } | null> {
  let token: string | undefined
  for (const name of adminCookieNames()) {
    token = extractCookieValue(cookieHeader, name)
    if (token) break
  }
  if (!token) return null
  const secret = getEnv(c, 'ADMIN_SESSION_SECRET') || getEnv(c, 'AUTH_SECRET')
  if (!secret) return null

  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encodedPayload, signature] = parts

  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sigBytes = Uint8Array.from(atob(signature.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(signature.length / 4) * 4, '=')), (c) => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(encodedPayload))
    if (!valid) return null

    const payload = JSON.parse(atob(encodedPayload.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=')))
    if (payload.role !== 'admin' && payload.role !== 'ADMIN' && payload.role !== 'OWNER' && payload.role !== 'SUPER_ADMIN') return null
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null

    return { email: payload.email, name: payload.name || 'Admin', role: payload.role }
  } catch {
    return null
  }
}

function getFirebaseProjectId(c: Parameters<typeof authMiddleware>[0]): string {
  const envProjectId = getEnv(c, 'FIREBASE_PROJECT_ID')
  if (envProjectId) return envProjectId
  throw new Error('FIREBASE_PROJECT_ID environment variable is not set')
}

const FIREBASE_JWKS_URI = 'https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com'

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function getJWKS(projectId: string) {
  if (!jwksCache.has(projectId)) {
    jwksCache.set(projectId, createRemoteJWKSet(new URL(FIREBASE_JWKS_URI)))
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

function getSuperAdminEmails(c: Parameters<typeof authMiddleware>[0]): { owner: string; admins: string[] } {
  const raw = getEnv(c, 'SUPER_ADMIN_EMAILS') || getEnv(c, 'ADMIN_EMAIL') || ''
  const emails = raw.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean)
  return {
    owner: emails[0] || '',
    admins: emails,
  }
}

function isSuperAdmin(c: Parameters<typeof authMiddleware>[0], email: string): boolean {
  return getSuperAdminEmails(c).admins.includes(email.toLowerCase())
}

function isOwner(c: Parameters<typeof authMiddleware>[0], email: string): boolean {
  return getSuperAdminEmails(c).owner === email.toLowerCase()
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  // PROXY-TRUST PATH (preferred): the Vercel edge proxy validates the admin
  // cookie + CSRF locally with ITS OWN secrets, then vouches for the verified
  // identity via a short-lived (30s) HMAC-signed header. This collapses the
  // 3-synced-secrets requirement (ADMIN_SESSION_SECRET + CSRF_SECRET +
  // AUTH_SECRET) to a single PROXY_TRUST_SECRET, and keeps admin auth working
  // even when the cookie-signing secrets drift across deployments.
  const trustSecret = readProxyTrustSecret({ env: c.env as unknown as Record<string, string | undefined> })
  if (trustSecret) {
    const trustHeader = c.req.header(PROXY_TRUST_HEADER)
    const trust = await verifyProxyTrust(trustHeader, trustSecret)
    if (trust.ok && trust.payload) {
      const email = trust.payload.email

      // Anonymous vouch (empty email): the proxy validated CSRF but NOT
      // identity. This is the customer-checkout case. Grant NO admin
      // privileges — fall through to the legacy path below, which will
      // require a Firebase token for customer endpoints and 401 otherwise.
      // We must NEVER let an empty-email vouch satisfy an admin route.
      if (email) {
        // The proxy already verified the cookie, so the email is authenticated.
        // Resolve the matching user row so admin_id audit logs point at a real
        // user. If none exists yet (fresh admin before first login synced them),
        // fall back to the super-admin bootstrap path below — never block a
        // proxy-vouched admin solely because the row is missing.
        try {
          const db = c.get('db')
          const result = await db.execute({
            sql: "SELECT id, role, is_active FROM users WHERE email = ? AND deleted_at IS NULL",
            args: [email],
          })
          if (result.rows.length > 0) {
            const profile = result.rows[0]
            const isActive = profile.is_active
            const role = trust.payload.role || (profile.role as string)
            c.set('user', {
              id: profile.id as string,
              email,
              role,
              isActive: typeof isActive === 'number' ? isActive === 1 : !!isActive,
            })
            await next()
            return
          }
        } catch {
          // DB unavailable — fall through to super-admin check below.
        }

        // No user row, but the proxy vouched for a super-admin email → trust it.
        // This mirrors the legacy cookie path's bootstrap behaviour.
        if (isSuperAdmin(c, email)) {
          const role = isOwner(c, email) ? 'OWNER' : 'SUPER_ADMIN'
          c.set('user', {
            id: `admin:${email}`,
            email,
            role,
            isActive: true,
          })
          await next()
          return
        }
      }
    }
  }

  const adminSession = getAdminSessionToken(c)
  if (adminSession) {
    const adminUser = await verifyAdminSession(c, adminSession)
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
        const role = isOwner(c, adminUser.email) ? 'OWNER' : (profile.role as string)
        c.set('user', {
          id: profile.id as string,
          email: adminUser.email,
          role,
          isActive: typeof isActive === 'number' ? isActive === 1 : !!isActive,
        })
        await next()
        return
      }

      if (isSuperAdmin(c, adminUser.email)) {
        const db2 = c.get('db')
        const existingAdmin = await db2.execute({
          sql: "SELECT id, role, is_active FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1",
          args: [adminUser.email],
        })
        if (existingAdmin.rows.length > 0) {
          const profile = existingAdmin.rows[0]
          const isActive = profile.is_active
          const role = isOwner(c, adminUser.email) ? 'OWNER' : 'SUPER_ADMIN'
          c.set('user', {
            id: profile.id as string,
            email: adminUser.email,
            role,
            isActive: typeof isActive === 'number' ? isActive === 1 : !!isActive,
          })
        } else {
          const adminId = crypto.randomUUID()
          const role = isOwner(c, adminUser.email) ? 'OWNER' : 'SUPER_ADMIN'
          try {
            await db2.execute({
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
              const retryResult = await db2.execute({
                sql: "SELECT id, role, is_active FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1",
                args: [adminUser.email],
              })
              if (retryResult.rows.length > 0) {
                const profile = retryResult.rows[0]
                const isActive = profile.is_active
                const role2 = isOwner(c, adminUser.email) ? 'OWNER' : 'SUPER_ADMIN'
                c.set('user', {
                  id: profile.id as string,
                  email: adminUser.email,
                  role: role2,
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

  if (!token && c.req.path.startsWith('/api/v1/admin')) {
    const cookieHeader = c.req.header('Cookie') || ''
    const adminCookieUser = await verifyAdminCookie(c, cookieHeader)
    if (adminCookieUser) {
      c.set('user', {
        id: `admin:${adminCookieUser.email}`,
        email: adminCookieUser.email,
        role: adminCookieUser.role,
        isActive: true,
      })
      await next()
      return
    }
    return c.json({ success: false, message: 'Unauthorized: admin session required', errors: [] }, 401)
  }

  if (!token) {
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
        return c.json({ success: false, message: 'User not found. Please sync your account first.', errors: [] }, 401)
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
  for (const name of adminCookieNames()) {
    const token = extractCookieValue(cookieHeader, name)
    if (token) return token
  }
  return undefined
}

export async function verifyAdminSession(c: Parameters<typeof authMiddleware>[0], token: string): Promise<{ email: string; name: string; role: string; jti?: string } | null> {
  const secret = getEnv(c, 'ADMIN_SESSION_SECRET') || getEnv(c, 'AUTH_SECRET')
  if (!secret || secret.length === 0) return null

  try {
    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) return null

    // base64url -> base64 (with padding). HMAC-SHA256 signatures are 43 base64url
    // chars (len % 4 === 3); atob() throws without padding, so pad explicitly.
    const base64UrlToBase64 = (value: string) =>
      value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=')

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sigBytes = Uint8Array.from(atob(base64UrlToBase64(signature)), (c) => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(encodedPayload))
    if (!valid) return null

    const payload = JSON.parse(atob(base64UrlToBase64(encodedPayload)))

    if (payload.role !== 'admin') return null
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null

    return { email: payload.email, name: payload.name, role: payload.role, jti: payload.jti }
  } catch {
    return null
  }
}
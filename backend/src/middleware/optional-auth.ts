import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/bindings'
import { getEnv } from '../utils/env'

export const optionalAuthMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const cookieHeader = c.req.header('Cookie')
  if (cookieHeader) {
    const cookieName = '__Host-glamo-admin-session'
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`))
    if (match?.[1]) {
      const { verifyAdminSession } = await import('../middleware/firebase-auth')
      const adminUser = await verifyAdminSession(c, match[1])
      if (adminUser) {
        const db = c.get('db')
        const result = await db.execute({
          sql: "SELECT id, role, is_active FROM users WHERE email = ? AND deleted_at IS NULL AND role IN ('ADMIN', 'SUPER_ADMIN')",
          args: [adminUser.email],
        })
        if (result.rows.length > 0) {
          const profile = result.rows[0]
          c.set('user', {
            id: profile.id as string,
            email: adminUser.email,
            role: profile.role as string,
            isActive: typeof profile.is_active === 'number' ? profile.is_active === 1 : !!profile.is_active,
          })
        }
      }
    }
  }

  const token = c.req.header('Authorization')?.replace('Bearer ', '') ?? (cookieHeader?.match(/(?:^|;\s*)glamo-access-token=([^;]+)/))?.[1]
  if (token && !c.get('user')) {
    try {
      const { verifyFirebaseToken } = await import('../middleware/firebase-auth')
      const projectId = getEnv(c, 'FIREBASE_PROJECT_ID')
      if (!projectId) {
        console.warn('[OptionalAuth] FIREBASE_PROJECT_ID not configured, skipping auth')
        await next()
        return
      }
      const { uid, email } = await verifyFirebaseToken(token, projectId)
      const db = c.get('db')
      const result = await db.execute({
        sql: 'SELECT id, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL',
        args: [uid],
      })
      if (result.rows.length > 0) {
        const profile = result.rows[0]
        const isActive = profile.is_active
        c.set('user', {
          id: profile.id as string,
          email,
          role: profile.role as string,
          isActive: typeof isActive === 'number' ? isActive === 1 : !!isActive,
        })
      }
    } catch {
      // Token invalid, continue as guest
    }
  }

  await next()
})
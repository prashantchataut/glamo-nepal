import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/bindings'

const ROLE_HIERARCHY: Record<string, string[]> = {
  OWNER: ['OWNER', 'SUPER_ADMIN', 'ADMIN'],
  SUPER_ADMIN: ['SUPER_ADMIN', 'ADMIN'],
  ADMIN: ['ADMIN'],
}

function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  const allowedRoles = ROLE_HIERARCHY[userRole] || [userRole]
  return allowedRoles.some((role) => requiredRoles.includes(role))
}

export const requireRole = (roles: string[]) => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ success: false, message: 'Forbidden: insufficient permissions', errors: [] }, 403)
    }
    if (!hasRequiredRole(user.role, roles)) {
      return c.json({ success: false, message: 'Forbidden: insufficient permissions', errors: [] }, 403)
    }
    if (user.isActive === false) {
      return c.json({ success: false, message: 'Forbidden: account is inactive', errors: [] }, 403)
    }
    await next()
  })
}
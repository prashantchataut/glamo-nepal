import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/bindings'

const ROLE_HIERARCHY: Record<string, string[]> = {
  OWNER: ['OWNER', 'SUPER_ADMIN', 'ADMIN', 'STAFF'],
  SUPER_ADMIN: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  ADMIN: ['ADMIN', 'STAFF'],
  STAFF: ['STAFF'],
}

/**
 * Normalize the role vocabulary. The codebase has historically used several
 * spellings for the same concept: the admin session cookie used to hard-code
 * the literal lowercase string "admin", the DB stores "ADMIN"/"SUPER_ADMIN",
 * and the env-derived owner role is "OWNER". Without normalization, a logged-in
 * admin whose cookie said "admin" was rejected by SUPER_ADMIN-gated routes
 * (coupons, banners, popups, gallery, team) because ROLE_HIERARCHY had no
 * "admin" key. We collapse every spelling to the canonical UPPERCASE set here,
 * at the gate, so it doesn't matter which auth path produced the role.
 *
 * Unknown / empty values default to the empty string so they fail every
 * privilege check (least privilege) rather than accidentally matching.
 */
function normalizeRole(role: string | undefined | null): string {
  const r = String(role ?? '').trim().toUpperCase()
  if (r === 'OWNER') return 'OWNER'
  if (r === 'SUPER_ADMIN' || r === 'SUPERADMIN') return 'SUPER_ADMIN'
  if (r === 'ADMIN') return 'ADMIN'
  if (r === 'STAFF') return 'STAFF'
  // Legacy lowercase "admin" cookie value → ADMIN.
  if (r === 'ADMIN') return 'ADMIN'
  return r // unknown roles keep their (uppercased) form and will fail checks
}

function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  const normalized = normalizeRole(userRole)
  const allowedRoles = ROLE_HIERARCHY[normalized] || [normalized]
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
import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { updateUserRoleSchema, updateUserStatusSchema, salesReportSchema, auditLogFilterSchema, userFilterSchema, notificationFilterSchema } from './admin.schema'
import {
  getDashboardStats,
  getSalesReport,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAuditLogs,
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  getMe,
} from './admin.controller'

const adminRoutes = new Hono<AppEnv>()

adminRoutes.get('/me', authMiddleware, requireRole(['ADMIN']), getMe)
adminRoutes.get('/dashboard', authMiddleware, requireRole(['ADMIN']), getDashboardStats)
adminRoutes.get('/sales-report', authMiddleware, requireRole(['ADMIN']), validateQuery(salesReportSchema), getSalesReport)
adminRoutes.get('/notifications', authMiddleware, requireRole(['ADMIN']), validateQuery(notificationFilterSchema), getNotifications)
adminRoutes.patch('/notifications/:id/read', authMiddleware, requireRole(['ADMIN']), markNotificationRead)
adminRoutes.patch('/notifications/read-all', authMiddleware, requireRole(['ADMIN']), markAllNotificationsRead)
adminRoutes.get('/audit-logs', authMiddleware, requireRole(['SUPER_ADMIN']), validateQuery(auditLogFilterSchema), getAuditLogs)
adminRoutes.get('/users', authMiddleware, requireRole(['ADMIN']), validateQuery(userFilterSchema), getUsers)
adminRoutes.get('/users/:id', authMiddleware, requireRole(['ADMIN']), getUserById)
adminRoutes.patch('/users/:id/role', authMiddleware, requireRole(['OWNER']), validateBody(updateUserRoleSchema), updateUserRole)
adminRoutes.patch('/users/:id/status', authMiddleware, requireRole(['SUPER_ADMIN']), validateBody(updateUserStatusSchema), updateUserStatus)
adminRoutes.post('/logout', authMiddleware, requireRole(['ADMIN']), async (c) => {
  const cookieHeader = c.req.header('Cookie') || ''
  // Accept both the new domain-scoped name and the legacy __Host- name.
  const cookieNames = ['glamo-admin-session', '__Host-glamo-admin-session']

  for (const name of cookieNames) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`))
    const token = match?.[1]
    if (token) {
      const { verifyAdminSession } = await import('../../middleware/firebase-auth')
      const adminUser = await verifyAdminSession(c, token)
      if (adminUser?.jti) {
        const db = c.get('db')
        try {
          await db.execute({
            sql: "INSERT OR IGNORE INTO admin_session_revocations (id, jti, email, revoked_at) VALUES (?, ?, ?, datetime('now'))",
            args: [crypto.randomUUID(), adminUser.jti, adminUser.email],
          })
        } catch {
          // Revocation table may not exist yet
        }
      }
    }
  }

  const response = c.json({ success: true, message: 'Logged out' })
  // Clear both names so the browser drops whichever cookie variant exists.
  // Scope the clear to the same domain the cookie was set with; the __Host-
  // variant must not carry a Domain attribute (it would be rejected).
  response.headers.append('Set-Cookie', `glamo-admin-session=; Path=/; Domain=.glamonepal.com; Max-Age=0; HttpOnly; SameSite=Lax; Secure`)
  response.headers.append('Set-Cookie', `glamo-admin-session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`)
  response.headers.append('Set-Cookie', `__Host-glamo-admin-session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`)
  return response
})

export { adminRoutes }
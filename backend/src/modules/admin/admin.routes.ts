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
  const user = c.get('user')
  const cookieHeader = c.req.header('Cookie') || ''
  const cookieName = process.env.NODE_ENV === 'production' ? '__Host-glamo-admin-session' : 'glamo-admin-session'
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`))
  const token = match?.[1]

  if (token) {
    const { verifyAdminSession } = await import('../../middleware/firebase-auth')
    const adminUser = await verifyAdminSession(token)
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

  return c.json({ success: true, message: 'Logged out' })
})

export { adminRoutes }
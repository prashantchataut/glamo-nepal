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

export { adminRoutes }
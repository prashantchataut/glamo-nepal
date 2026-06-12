import { z } from 'zod'

export const salesReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN']),
})

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
})

export const auditLogFilterSchema = z.object({
  entity: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  page: z.coerce.number().int().positive().max(500).default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

export const userFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN']).optional(),
  isActive: z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
  page: z.coerce.number().int().positive().max(500).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const notificationFilterSchema = z.object({
  isRead: z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
  page: z.coerce.number().int().positive().max(500).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type SalesReportInput = z.infer<typeof salesReportSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>
export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>
export type UserFilterInput = z.infer<typeof userFilterSchema>
export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>
import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import { AppError } from '../../utils/turso-helpers'
import * as AdminService from './admin.service'

export async function getDashboardStats(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const result = await AdminService.getDashboardStats(db)
    return ApiResponse.success(c, 'Dashboard stats fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch dashboard stats', 500)
  }
}

export async function getSalesReport(c: Context<AppEnv>) {
  try {
    const query = c.get('validatedQuery')
    const db = c.get('db')
    const result = await AdminService.getSalesReport(db, query.startDate, query.endDate, query.groupBy)
    return ApiResponse.success(c, 'Sales report fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch sales report', 500)
  }
}

export async function getNotifications(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const db = c.get('db')
    const query = c.get('validatedQuery') || {}
    const isRead = query.isRead
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20
    const result = await AdminService.getNotifications(db, user.id, user.role, { isRead, page, limit })
    return ApiResponse.paginated(c, 'Notifications fetched successfully', result.notifications, result.total, result.page, result.limit)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch notifications', 500)
  }
}

export async function markNotificationRead(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const db = c.get('db')
    const result = await AdminService.markNotificationRead(db, id, user.id, user.role)
    return ApiResponse.success(c, result.message, null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to mark notification', 500)
  }
}

export async function markAllNotificationsRead(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const db = c.get('db')
    const result = await AdminService.markAllNotificationsRead(db, user.id)
    return ApiResponse.success(c, result.message, null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to mark notifications', 500)
  }
}

export async function getAuditLogs(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const query = c.get('validatedQuery') || {}
    const entity = query.entity
    const entityId = query.entityId
    const userId = query.userId
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 50
    const result = await AdminService.getAuditLogs(db, { entity, entityId, userId, page, limit })
    return ApiResponse.paginated(c, 'Audit logs fetched successfully', result.logs, result.total, result.page, result.limit)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch audit logs', 500)
  }
}

export async function getUsers(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const query = c.get('validatedQuery') || c.req.query()
    const search = query.search
    const role = query.role
    const isActive = query.isActive
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20
    const result = await AdminService.getUsers(db, { search, role, isActive, page, limit })
    return ApiResponse.paginated(c, 'Users fetched successfully', result.users, result.total, result.page, result.limit)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch users', 500)
  }
}

export async function getUserById(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const db = c.get('db')
    const result = await AdminService.getUser(db, id)
    return ApiResponse.success(c, 'User fetched successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch user', 500)
  }
}

export async function updateUserRole(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const user = c.get('user')
    const db = c.get('db')
    const result = await AdminService.updateUserRole(db, id, data.role, user.id)
    return ApiResponse.success(c, result.message, null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update user role', 500)
  }
}

export async function updateUserStatus(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const user = c.get('user')
    const db = c.get('db')
    const result = await AdminService.updateUserStatus(db, id, data.isActive, user.id)
    return ApiResponse.success(c, result.message, null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to update user status', 500)
  }
}
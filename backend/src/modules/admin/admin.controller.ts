import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as AdminService from './admin.service'

export async function getDashboardStats(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await AdminService.getDashboardStats(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch dashboard stats', 500)
  }
}

export async function getSalesReport(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await AdminService.getSalesReport(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch sales report', 500)
  }
}

export async function getNotifications(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await AdminService.getNotifications(user.id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch notifications', 500)
  }
}

export async function markNotificationRead(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const result = await AdminService.markNotificationRead(id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to mark notification', 500)
  }
}

export async function markAllNotificationsRead(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await AdminService.markAllNotificationsRead(user.id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to mark notifications', 500)
  }
}

export async function getAuditLogs(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await AdminService.getAuditLogs(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch audit logs', 500)
  }
}

export async function getUsers(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await AdminService.getUsers(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch users', 500)
  }
}

export async function getUserById(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    const result = await AdminService.getUserById(id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch user', 500)
  }
}

export async function updateUserRole(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await AdminService.updateUserRole(id, data.role, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to update user role', 500)
  }
}

export async function updateUserStatus(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await AdminService.updateUserStatus(id, data.isActive, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to update user status', 500)
  }
}
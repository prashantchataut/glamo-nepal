import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/turso-helpers'
import { ApiResponse } from '../../utils/response'
import * as InventoryService from './inventory.service'

export async function getStockReport(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const query = c.get('validatedQuery') || c.req.query()
    const filters = {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      search: query.search,
      lowStockOnly: query.lowStockOnly === true || query.lowStockOnly === 'true',
      outOfStockOnly: query.outOfStockOnly === true || query.outOfStockOnly === 'true',
    }
    const report = await InventoryService.getStockReport(db, filters)
    return ApiResponse.success(c, 'Stock report retrieved', report)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to retrieve stock report', 500)
  }
}

export async function getLowStockAlerts(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const alerts = await InventoryService.getLowStockAlerts(db)
    return ApiResponse.success(c, 'Low stock alerts retrieved', alerts)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to retrieve low stock alerts', 500)
  }
}

export async function getInventoryLogs(c: Context<AppEnv>) {
  try {
    const filters = c.get('validatedQuery')
    const db = c.get('db')
    const result = await InventoryService.getInventoryLogs(db, filters)
    return ApiResponse.paginated(
      c,
      'Inventory logs retrieved',
      result.logs,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit
    )
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to retrieve inventory logs', 500)
  }
}

import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as InventoryService from './inventory.service'

export async function getStockReport(c: Context<AppEnv>) {
  try {
    const report = await InventoryService.getStockReport(c.env.DB)
    return ApiResponse.success(c, 'Stock report retrieved', report)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to retrieve stock report', 500)
  }
}

export async function getLowStockAlerts(c: Context<AppEnv>) {
  try {
    const alerts = await InventoryService.getLowStockAlerts(c.env.DB)
    return ApiResponse.success(c, 'Low stock alerts retrieved', alerts)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to retrieve low stock alerts', 500)
  }
}

export async function getInventoryLogs(c: Context<AppEnv>) {
  try {
    const filters = c.get('validatedQuery')
    const result = await InventoryService.getInventoryLogs(filters, c.env.DB)
    return ApiResponse.paginated(
      c,
      'Inventory logs retrieved',
      result.logs,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit
    )
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to retrieve inventory logs', 500)
  }
}
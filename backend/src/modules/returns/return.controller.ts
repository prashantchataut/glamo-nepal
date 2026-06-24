import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/turso-helpers'
import { ApiResponse } from '../../utils/response'
import * as ReturnService from './return.service'

export async function getReturns(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const filters = c.get('validatedQuery') || c.req.query()
    const result = await ReturnService.listReturns(filters, db)
    return ApiResponse.paginated(c, 'Returns fetched successfully', result.returns, result.pagination.total, result.pagination.page, result.pagination.limit)
  } catch (error: any) {
    if (error instanceof AppError) return ApiResponse.error(c, error.message, error.statusCode)
    return ApiResponse.error(c, error.message || 'Failed to fetch returns', 500)
  }
}

export async function createReturn(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const user = c.get('user')
    const data = c.get('validatedBody')
    const result = await ReturnService.createReturn(data, user.id, db)
    return ApiResponse.success(c, 'Return request created successfully', result, 201)
  } catch (error: any) {
    if (error instanceof AppError) return ApiResponse.error(c, error.message, error.statusCode)
    return ApiResponse.error(c, error.message || 'Failed to create return request', 500)
  }
}

export async function updateReturn(c: Context<AppEnv>) {
  try {
    const db = c.get('db')
    const user = c.get('user')
    const { id } = c.req.param()
    const data = c.get('validatedBody')
    const result = await ReturnService.updateReturn(id, data, user.id, db)
    return ApiResponse.success(c, 'Return request updated successfully', result)
  } catch (error: any) {
    if (error instanceof AppError) return ApiResponse.error(c, error.message, error.statusCode)
    return ApiResponse.error(c, error.message || 'Failed to update return request', 500)
  }
}

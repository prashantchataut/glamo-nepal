import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface SuccessResponse<T> {
  success: true
  message: string
  data: T
  pagination: PaginationMeta | null
}

interface ErrorResponse {
  success: false
  message: string
  errors: string[]
}

export class ApiResponse {
  static success<T>(
    c: Context,
    message: string,
    data: T,
    status = 200,
    pagination: PaginationMeta | null = null
  ) {
    const response: SuccessResponse<T> = {
      success: true,
      message,
      data,
      pagination,
    }
    return c.json(response, status as ContentfulStatusCode)
  }

  static error(
    c: Context,
    message: string,
    status = 500,
    errors: string[] = []
  ) {
    const response: ErrorResponse = {
      success: false,
      message,
      errors,
    }
    return c.json(response, status as ContentfulStatusCode)
  }

  static paginated<T>(
    c: Context,
    message: string,
    data: T[],
    total: number,
    page: number,
    limit: number
  ) {
    const totalPages = Math.ceil(total / limit)
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
    }
    return ApiResponse.success(c, message, data, 200, pagination)
  }
}
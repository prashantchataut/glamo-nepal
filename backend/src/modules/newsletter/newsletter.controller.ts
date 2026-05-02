import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import { AppError } from '../../utils/supabase'
import * as NewsletterService from './newsletter.service'

export async function subscribe(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
    const result = await NewsletterService.subscribe(supabase, data.email, ip, c.env.KV)
    return ApiResponse.success(c, result.message, null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to subscribe', 500)
  }
}

export async function unsubscribe(c: Context<AppEnv>) {
  try {
    const token = c.req.query('token') || ''
    const supabase = c.get('supabase')
    const result = await NewsletterService.unsubscribe(supabase, token)
    return ApiResponse.success(c, result.message, null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to unsubscribe', 500)
  }
}

export async function getSubscribers(c: Context<AppEnv>) {
  try {
    const query = c.get('validatedQuery') || c.req.query()
    const supabase = c.get('supabase')
    const isActive = query.isActive !== undefined ? query.isActive : undefined
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20
    const result = await NewsletterService.getSubscribers(supabase, { isActive, page, limit })
    return ApiResponse.paginated(c, 'Subscribers fetched successfully', result.subscribers, result.total, result.page, result.limit)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch subscribers', 500)
  }
}

export async function exportSubscribers(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const csv = await NewsletterService.exportSubscribers(supabase)
    c.header('Content-Type', 'text/csv')
    c.header('Content-Disposition', 'attachment; filename=subscribers.csv')
    return c.body(csv)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to export subscribers', 500)
  }
}

export async function deleteSubscriber(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const supabase = c.get('supabase')
    const result = await NewsletterService.deleteSubscriber(supabase, id, user.id)
    return ApiResponse.success(c, result.message, null)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to delete subscriber', 500)
  }
}
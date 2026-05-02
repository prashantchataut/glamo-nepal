import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as NewsletterService from './newsletter.service'

export async function subscribe(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await NewsletterService.subscribe(data.email, data.name, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to subscribe', 500)
  }
}

export async function unsubscribe(c: Context<AppEnv>) {
  try {
    const { token } = c.req.query()
    const supabase = c.get('supabase')
    const result = await NewsletterService.unsubscribe(token, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to unsubscribe', 500)
  }
}

export async function getSubscribers(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await NewsletterService.getSubscribers(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to fetch subscribers', 500)
  }
}

export async function exportSubscribers(c: Context<AppEnv>) {
  try {
    const supabase = c.get('supabase')
    const result = await NewsletterService.exportSubscribers(supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to export subscribers', 500)
  }
}

export async function deleteSubscriber(c: Context<AppEnv>) {
  try {
    const { id } = c.req.param()
    const supabase = c.get('supabase')
    await NewsletterService.deleteSubscriber(id, supabase)
    return ApiResponse.success(c, 'Not yet implemented', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to delete subscriber', 500)
  }
}
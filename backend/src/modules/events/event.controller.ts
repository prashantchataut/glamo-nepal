import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as EventService from './event.service'

export async function trackEvents(c: Context<AppEnv>) {
  try {
    const body = c.get('validatedBody')
    const { session_id, user_id, events } = body
    const db = c.get('db')

    await EventService.trackEvents(session_id, user_id, events, db)

    return c.body(null, 204)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to track events', 500)
  }
}
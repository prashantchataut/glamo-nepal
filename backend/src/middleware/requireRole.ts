import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/bindings'

export const requireRole = (roles: string[]) => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user')
    if (!user || !roles.includes(user.role)) {
      return c.json({ success: false, message: 'Forbidden: insufficient permissions', errors: [] }, 403)
    }
    await next()
  })
}
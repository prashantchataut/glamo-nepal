import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/bindings'
import { verifyToken } from '../utils/jwt'

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
    ?? getCookieToken(c)

  if (!token) {
    return c.json({ success: false, message: 'Unauthorized: no token provided', errors: [] }, 401)
  }

  let payload: { id: string; email: string; role: string }
  try {
    payload = await verifyToken(token, c.env.JWT_PUBLIC_KEY)
  } catch {
    return c.json({ success: false, message: 'Unauthorized: invalid token', errors: [] }, 401)
  }

  const userId = payload.id
  if (!userId) {
    return c.json({ success: false, message: 'Unauthorized: invalid token payload', errors: [] }, 401)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL'
  ).bind(userId).first<{ id: string; email: string; role: string; is_active: number }>()

  if (!user || !user.is_active) {
    return c.json({ success: false, message: 'Unauthorized: user not found or inactive', errors: [] }, 401)
  }

  c.set('user', {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: !!user.is_active,
  })

  await next()
})

function getCookieToken(c: Parameters<typeof authMiddleware>[0]): string | undefined {
  const cookieHeader = c.req.header('Cookie')
  if (!cookieHeader) return undefined

  const match = cookieHeader.match(/(?:^|;\s*)__Host-access_token=([^;]+)/)
  return match?.[1]
}
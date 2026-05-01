import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/bindings'
import { importSPKI, jwtVerify } from 'jose'

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '') 
    ?? getCookieToken(c)

  if (!token) {
    return c.json({ success: false, message: 'Unauthorized: no token provided', errors: [] }, 401)
  }

  let payload: Record<string, unknown>
  try {
    const publicKey = await importSPKI(c.env.JWT_PUBLIC_KEY, 'RS256')
    const { payload: decoded } = await jwtVerify(token, publicKey)
    payload = decoded as Record<string, unknown>
  } catch {
    return c.json({ success: false, message: 'Unauthorized: invalid token', errors: [] }, 401)
  }

  const userId = payload.sub
  if (!userId) {
    return c.json({ success: false, message: 'Unauthorized: invalid token payload', errors: [] }, 401)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, role, isActive FROM User WHERE id = ?'
  ).bind(userId).first<{ id: string; email: string; role: string; isActive: number }>()

  if (!user || !user.isActive) {
    return c.json({ success: false, message: 'Unauthorized: user not found or inactive', errors: [] }, 401)
  }

  c.set('user', {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: !!user.isActive,
  })

  await next()
})

function getCookieToken(c: Parameters<typeof authMiddleware>[0]): string | undefined {
  const cookieHeader = c.req.header('Cookie')
  if (!cookieHeader) return undefined

  const match = cookieHeader.match(/(?:^|;\s*)__Host-access_token=([^;]+)/)
  return match?.[1]
}
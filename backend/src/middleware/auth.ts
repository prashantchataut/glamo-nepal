import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/bindings'

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
    ?? getCookieToken(c)

  if (!token) {
    return c.json({ success: false, message: 'Unauthorized: no token provided', errors: [] }, 401)
  }

  const supabase = c.get('supabase')

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return c.json({ success: false, message: 'Unauthorized: invalid token', errors: [] }, 401)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) {
    return c.json({ success: false, message: 'Unauthorized: user not found or inactive', errors: [] }, 401)
  }

  c.set('user', {
    id: profile.id,
    email: user.email ?? '',
    role: profile.role,
    isActive: profile.is_active,
  })

  await next()
})

function getCookieToken(c: Parameters<typeof authMiddleware>[0]): string | undefined {
  const cookieHeader = c.req.header('Cookie')
  if (!cookieHeader) return undefined
  const match = cookieHeader.match(/(?:^|;\s*)__Host-access_token=([^;]+)/)
  return match?.[1]
}
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { AppEnv } from '../types/bindings'

function createAuthMiddleware(supabaseMock: any) {
  return async (c: any, next: () => Promise<void>) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
      ?? (() => {
        const cookieHeader = c.req.header('Cookie')
        if (!cookieHeader) return undefined
        const match = cookieHeader.match(/(?:^|;\s*)__Host-access_token=([^;]+)/)
        return match?.[1]
      })()

    if (!token) {
      return c.json({ success: false, message: 'Unauthorized: no token provided', errors: [] }, 401)
    }

    const { data: { user }, error } = await supabaseMock.auth.getUser(token)

    if (error || !user) {
      return c.json({ success: false, message: 'Unauthorized: invalid token', errors: [] }, 401)
    }

    const { data: profile } = await supabaseMock
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
  }
}

describe('Auth Middleware', () => {
  it('rejects requests with no token', async () => {
    const supabaseMock = {
      auth: { getUser: vi.fn() },
      from: vi.fn(),
    }
    const app = new Hono<AppEnv>()
    app.use('*', createAuthMiddleware(supabaseMock))
    app.get('/protected', (c) => c.json({ ok: true }))

    const res = await app.request('/protected')
    expect(res.status).toBe(401)
    const body = (await res.json()) as { message: string }
    expect(body.message).toContain('no token provided')
  })

  it('rejects requests with invalid token', async () => {
    const supabaseMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' },
        }),
      },
      from: vi.fn(),
    }
    const app = new Hono<AppEnv>()
    app.use('*', createAuthMiddleware(supabaseMock))
    app.get('/protected', (c) => c.json({ ok: true }))

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer invalid-token' },
    })
    expect(res.status).toBe(401)
    const body = (await res.json()) as { message: string }
    expect(body.message).toContain('invalid token')
  })

  it('rejects requests from inactive users', async () => {
    const supabaseMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'inactive@test.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-1', role: 'CUSTOMER', is_active: false },
              error: null,
            }),
          }),
        }),
      }),
    }
    const app = new Hono<AppEnv>()
    app.use('*', createAuthMiddleware(supabaseMock))
    app.get('/protected', (c) => c.json({ ok: true }))

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(401)
    const body = (await res.json()) as { message: string }
    expect(body.message).toContain('not found or inactive')
  })

  it('allows requests from active users with valid token', async () => {
    const supabaseMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'admin@test.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-1', role: 'ADMIN', is_active: true },
              error: null,
            }),
          }),
        }),
      }),
    }
    const app = new Hono<AppEnv>()
    app.use('*', createAuthMiddleware(supabaseMock))
    app.get('/protected', (c) => {
      const user = c.get('user')
      return c.json({ ok: true, userId: user.id, role: user.role })
    })

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { userId: string; role: string }
    expect(body.userId).toBe('user-1')
    expect(body.role).toBe('ADMIN')
  })

  it('extracts token from cookie when Authorization header is missing', async () => {
    const supabaseMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'customer@test.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-1', role: 'CUSTOMER', is_active: true },
              error: null,
            }),
          }),
        }),
      }),
    }
    const app = new Hono<AppEnv>()
    app.use('*', createAuthMiddleware(supabaseMock))
    app.get('/protected', (c) => c.json({ ok: true }))

    const res = await app.request('/protected', {
      headers: { Cookie: '__Host-access_token=cookie-token-123' },
    })
    expect(res.status).toBe(200)
    expect(supabaseMock.auth.getUser).toHaveBeenCalledWith('cookie-token-123')
  })

  it('sets user context with correct fields', async () => {
    const supabaseMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'staff@test.com' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-1', role: 'STAFF', is_active: true },
              error: null,
            }),
          }),
        }),
      }),
    }
    const app = new Hono<AppEnv>()
    app.use('*', createAuthMiddleware(supabaseMock))
    app.get('/me', (c) => {
      const user = c.get('user')
      return c.json({
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      })
    })

    const res = await app.request('/me', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { id: string; email: string; role: string; isActive: boolean }
    expect(body.id).toBe('user-1')
    expect(body.email).toBe('staff@test.com')
    expect(body.role).toBe('STAFF')
    expect(body.isActive).toBe(true)
  })
})
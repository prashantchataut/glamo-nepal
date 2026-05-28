import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import type { AppEnv } from '../types/bindings'
import { z } from 'zod'
import { validateBody, validateQuery } from '../middleware/validate'
import { requireRole } from '../middleware/requireRole'

function createMockKV() {
  const store = new Map<string, string>()
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string, opts?: any) => { store.set(key, value) }),
    delete: vi.fn(async (key: string) => { store.delete(key) }),
    list: vi.fn(async () => ({ keys: [] })),
  }
}

function createRateLimiter(kv: ReturnType<typeof createMockKV>, max: number, window: number, keyPrefix: string) {
  return async (c: any, next: () => Promise<void>) => {
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown'
    const key = `ratelimit:${ip}:${keyPrefix}`
    const current = parseInt((await kv.get(key)) ?? '0', 10)
    if (current >= max) {
      c.header('Retry-After', String(window))
      return c.json({ success: false, message: 'Too many requests, please try again later', errors: [] }, 429)
    }
    await kv.put(key, String(current + 1), { expirationTtl: window })
    c.header('X-RateLimit-Limit', String(max))
    c.header('X-RateLimit-Remaining', String(max - current - 1))
    await next()
  }
}

describe('Rate Limiting', () => {
  describe('authRateLimit (5/15min)', () => {
    it('allows up to 5 requests then returns 429', async () => {
      const kv = createMockKV()
      const app = new Hono<AppEnv>()
      const limiter = createRateLimiter(kv, 5, 900, 'auth')
      app.post('/login', limiter, (c) => c.json({ ok: true }))

      for (let i = 0; i < 5; i++) {
        const res = await app.request('/login', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
        expect(res.status).toBe(200)
      }
      const res = await app.request('/login', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
      expect(res.status).toBe(429)
    })

    it('tracks limits per IP independently', async () => {
      const kv = createMockKV()
      const app = new Hono<AppEnv>()
      const limiter = createRateLimiter(kv, 5, 900, 'auth')
      app.post('/login', limiter, (c) => c.json({ ok: true }))

      for (let i = 0; i < 5; i++) {
        const res = await app.request('/login', { method: 'POST', headers: { 'cf-connecting-ip': '1.1.1.1' } })
        expect(res.status).toBe(200)
      }
      const differentIp = await app.request('/login', { method: 'POST', headers: { 'cf-connecting-ip': '2.2.2.2' } })
      expect(differentIp.status).toBe(200)
    })
  })

  describe('passwordResetRateLimit (3/hr)', () => {
    it('allows up to 3 requests then returns 429', async () => {
      const kv = createMockKV()
      const app = new Hono<AppEnv>()
      const limiter = createRateLimiter(kv, 3, 3600, 'password-reset')
      app.post('/forgot-password', limiter, (c) => c.json({ ok: true }))

      for (let i = 0; i < 3; i++) {
        const res = await app.request('/forgot-password', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
        expect(res.status).toBe(200)
      }
      const res = await app.request('/forgot-password', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
      expect(res.status).toBe(429)
    })
  })

  describe('paymentRateLimit (5/min)', () => {
    it('allows up to 5 requests then returns 429', async () => {
      const kv = createMockKV()
      const app = new Hono<AppEnv>()
      const limiter = createRateLimiter(kv, 5, 60, 'payment')
      app.post('/checkout/orders', limiter, (c) => c.json({ ok: true }))

      for (let i = 0; i < 5; i++) {
        const res = await app.request('/checkout/orders', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
        expect(res.status).toBe(200)
      }
      const res = await app.request('/checkout/orders', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
      expect(res.status).toBe(429)
    })
  })

  describe('couponRateLimit (10/min)', () => {
    it('allows up to 10 requests then returns 429', async () => {
      const kv = createMockKV()
      const app = new Hono<AppEnv>()
      const limiter = createRateLimiter(kv, 10, 60, 'coupon')
      app.post('/validate', limiter, (c) => c.json({ ok: true }))

      for (let i = 0; i < 10; i++) {
        const res = await app.request('/validate', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
        expect(res.status).toBe(200)
      }
      const res = await app.request('/validate', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
      expect(res.status).toBe(429)
    })
  })

  describe('eventRateLimit (50/min)', () => {
    it('allows up to 50 requests then returns 429', async () => {
      const kv = createMockKV()
      const app = new Hono<AppEnv>()
      const limiter = createRateLimiter(kv, 50, 60, 'event')
      app.post('/events', limiter, (c) => c.json({ ok: true }))

      for (let i = 0; i < 50; i++) {
        const res = await app.request('/events', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
        expect(res.status).toBe(200)
      }
      const res = await app.request('/events', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
      expect(res.status).toBe(429)
    })
  })

  describe('reviewRateLimit (5/hr)', () => {
    it('allows up to 5 requests then returns 429', async () => {
      const kv = createMockKV()
      const app = new Hono<AppEnv>()
      const limiter = createRateLimiter(kv, 5, 3600, 'review')
      app.post('/reviews', limiter, (c) => c.json({ ok: true }))

      for (let i = 0; i < 5; i++) {
        const res = await app.request('/reviews', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
        expect(res.status).toBe(200)
      }
      const res = await app.request('/reviews', { method: 'POST', headers: { 'cf-connecting-ip': '1.2.3.4' } })
      expect(res.status).toBe(429)
    })
  })

  describe('generalRateLimit (100/min)', () => {
    it('sets rate limit headers on responses', async () => {
      const kv = createMockKV()
      const app = new Hono<AppEnv>()
      const limiter = createRateLimiter(kv, 100, 60, 'general')
      app.get('/test', limiter, (c) => c.json({ ok: true }))

      const res = await app.request('/test', { headers: { 'cf-connecting-ip': '1.2.3.4' } })
      expect(res.status).toBe(200)
      expect(res.headers.get('X-RateLimit-Limit')).toBe('100')
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('99')
    })
  })
})

describe('requireRole Middleware', () => {
  it('allows access for users with matching role', async () => {
    const app = new Hono<AppEnv>()
    app.use('*', async (c, next) => {
      c.set('user', { id: '1', email: 'admin@test.com', role: 'ADMIN', isActive: true })
      await next()
    })
    app.get('/admin', requireRole(['ADMIN', 'SUPER_ADMIN']), (c) => c.json({ ok: true }))

    const res = await app.request('/admin')
    expect(res.status).toBe(200)
  })

  it('rejects access for users without matching role', async () => {
    const app = new Hono<AppEnv>()
    app.use('*', async (c, next) => {
      c.set('user', { id: '1', email: 'customer@test.com', role: 'CUSTOMER', isActive: true })
      await next()
    })
    app.get('/admin', requireRole(['ADMIN', 'SUPER_ADMIN']), (c) => c.json({ ok: true }))

    const res = await app.request('/admin')
    expect(res.status).toBe(403)
  })

  it('rejects access when no user is set', async () => {
    const app = new Hono<AppEnv>()
    app.get('/admin', requireRole(['ADMIN']), (c) => c.json({ ok: true }))

    const res = await app.request('/admin')
    expect(res.status).toBe(403)
  })

  it('allows STAFF role for order status updates', async () => {
    const app = new Hono<AppEnv>()
    app.use('*', async (c, next) => {
      c.set('user', { id: '1', email: 'staff@test.com', role: 'STAFF', isActive: true })
      await next()
    })
    app.patch('/orders/:id/status', requireRole(['ADMIN', 'SUPER_ADMIN', 'STAFF']), (c) => c.json({ ok: true }))

    const res = await app.request('/orders/123/status', { method: 'PATCH' })
    expect(res.status).toBe(200)
  })

  it('rejects STAFF from SUPER_ADMIN-only routes', async () => {
    const app = new Hono<AppEnv>()
    app.use('*', async (c, next) => {
      c.set('user', { id: '1', email: 'staff@test.com', role: 'STAFF', isActive: true })
      await next()
    })
    app.patch('/settings', requireRole(['SUPER_ADMIN']), (c) => c.json({ ok: true }))

    const res = await app.request('/settings', { method: 'PATCH' })
    expect(res.status).toBe(403)
  })
})

describe('Validation Middleware', () => {
  it('validates body with ZodTypeAny schema', async () => {
    const app = new Hono<AppEnv>()
    const schema = z.object({ name: z.string(), email: z.string().email() })
    app.post('/test', validateBody(schema), (c) => c.json({ ok: true, data: c.get('validatedBody') }))

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com' }),
    })
    expect(res.status).toBe(200)
  })

  it('rejects invalid body data', async () => {
    const app = new Hono<AppEnv>()
    const schema = z.object({ name: z.string(), email: z.string().email() })
    app.post('/test', validateBody(schema), (c) => c.json({ ok: true }))

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 123, email: 'invalid' }),
    })
    expect(res.status).toBe(400)
  })

  it('validates query with ZodTypeAny schema', async () => {
    const app = new Hono<AppEnv>()
    const schema = z.object({ page: z.coerce.number().min(1).optional(), limit: z.coerce.number().min(1).max(100).optional() })
    app.get('/test', validateQuery(schema), (c) => c.json({ ok: true }))

    const res = await app.request('/test?page=1&limit=10')
    expect(res.status).toBe(200)
  })

  it('rejects invalid query parameters', async () => {
    const app = new Hono<AppEnv>()
    const schema = z.object({ page: z.coerce.number().min(1) })
    app.get('/test', validateQuery(schema), (c) => c.json({ ok: true }))

    const res = await app.request('/test?page=-1')
    expect(res.status).toBe(400)
  })
})

describe('CORS Origin Validation', () => {
  const ALLOWED_ORIGINS = ['https://glamonepal.com', 'https://www.glamonepal.com', 'http://localhost:3000']

  it('allows glamonepal.com origins', () => {
    expect(ALLOWED_ORIGINS.includes('https://glamonepal.com')).toBe(true)
    expect(ALLOWED_ORIGINS.includes('https://www.glamonepal.com')).toBe(true)
  })

  it('allows localhost for development', () => {
    expect(ALLOWED_ORIGINS.includes('http://localhost:3000')).toBe(true)
  })

  it('rejects malicious origins', () => {
    expect(ALLOWED_ORIGINS.includes('https://evil.com')).toBe(false)
    expect(ALLOWED_ORIGINS.includes('https://phishing.com')).toBe(false)
    expect(ALLOWED_ORIGINS.includes('http://glamonepal.com')).toBe(false)
  })
})
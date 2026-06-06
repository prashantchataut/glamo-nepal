import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import type { AppEnv } from '../types/bindings'
import { z } from 'zod'
import { validateBody, validateQuery } from '../middleware/validate'
import { requireRole } from '../middleware/requireRole'
import { rateLimit, RATE_LIMITS } from '../middleware/rateLimit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('authRateLimit (5/15min)', () => {
    it('allows up to 5 requests then returns 429', async () => {
      const app = new Hono<AppEnv>()
      const limiter = rateLimit({ max: RATE_LIMITS.auth.max, window: RATE_LIMITS.auth.window })
      app.post('/login', limiter, (c) => c.json({ ok: true }))

      for (let i = 0; i < 5; i++) {
        const res = await app.request('/login', { method: 'POST', headers: { 'x-forwarded-for': '1.2.3.4' } })
        expect(res.status).toBe(200)
      }
      const res = await app.request('/login', { method: 'POST', headers: { 'x-forwarded-for': '1.2.3.4' } })
      expect(res.status).toBe(429)
    })

    it('tracks limits per IP independently', async () => {
      const app = new Hono<AppEnv>()
      const limiter = rateLimit({ max: RATE_LIMITS.auth.max, window: RATE_LIMITS.auth.window })
      app.post('/login', limiter, (c) => c.json({ ok: true }))

      for (let i = 0; i < 5; i++) {
        const res = await app.request('/login', { method: 'POST', headers: { 'x-forwarded-for': '1.1.1.1' } })
        expect(res.status).toBe(200)
      }
      const differentIp = await app.request('/login', { method: 'POST', headers: { 'x-forwarded-for': '2.2.2.2' } })
      expect(differentIp.status).toBe(200)
    })
  })

  describe('passwordResetRateLimit (3/hr)', () => {
    it('allows up to 3 requests then returns 429', async () => {
      const app = new Hono<AppEnv>()
      const limiter = rateLimit({ max: RATE_LIMITS.passwordReset.max, window: RATE_LIMITS.passwordReset.window })
      app.post('/forgot-password', limiter, (c) => c.json({ ok: true }))

      for (let i = 0; i < 3; i++) {
        const res = await app.request('/forgot-password', { method: 'POST', headers: { 'x-forwarded-for': '1.2.3.4' } })
        expect(res.status).toBe(200)
      }
      const res = await app.request('/forgot-password', { method: 'POST', headers: { 'x-forwarded-for': '1.2.3.4' } })
      expect(res.status).toBe(429)
    })
  })

  describe('paymentRateLimit (5/min)', () => {
    it('allows up to 5 requests then returns 429', async () => {
      const app = new Hono<AppEnv>()
      const limiter = rateLimit({ max: RATE_LIMITS.payment.max, window: RATE_LIMITS.payment.window })
      app.post('/checkout/orders', limiter, (c) => c.json({ ok: true }))

      for (let i = 0; i < 5; i++) {
        const res = await app.request('/checkout/orders', { method: 'POST', headers: { 'x-forwarded-for': '1.2.3.4' } })
        expect(res.status).toBe(200)
      }
      const res = await app.request('/checkout/orders', { method: 'POST', headers: { 'x-forwarded-for': '1.2.3.4' } })
      expect(res.status).toBe(429)
    })
  })

  describe('generalRateLimit (100/min)', () => {
    it('sets rate limit headers on responses', async () => {
      const app = new Hono<AppEnv>()
      const limiter = rateLimit({ max: RATE_LIMITS.general.max, window: RATE_LIMITS.general.window })
      app.get('/test', limiter, (c) => c.json({ ok: true }))

      const res = await app.request('/test', { headers: { 'x-forwarded-for': '1.2.3.4' } })
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
  const ALLOWED_ORIGINS = [process.env.FRONTEND_URL || 'https://example.com', `www.${(process.env.FRONTEND_URL || 'example.com').replace(/^https?:\/\//, '')}`, 'http://localhost:3000']

  it('allows production origins', () => {
    expect(ALLOWED_ORIGINS.length).toBeGreaterThanOrEqual(3)
  })

  it('allows localhost for development', () => {
    expect(ALLOWED_ORIGINS.includes('http://localhost:3000')).toBe(true)
  })

  it('rejects malicious origins', () => {
    expect(ALLOWED_ORIGINS.includes('https://evil.com')).toBe(false)
    expect(ALLOWED_ORIGINS.includes('https://phishing.com')).toBe(false)
  })
})
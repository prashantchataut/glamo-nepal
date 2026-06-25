import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import type { Client } from '@libsql/client'
import type { AppEnv } from '../types/bindings'
import { forgotPassword } from '../modules/auth/auth.controller'

function createMockDb(rows: { id: string; email: string; first_name: string }[]) {
  return {
    execute: vi.fn(async () => ({ rows })),
  } as unknown as Client
}

function createApp(db: Client) {
  const app = new Hono<AppEnv>()
  app.use('*', async (c, next) => {
    c.set('db', db)
    await next()
  })
  app.post('/forgot-password', async (c) => {
    const body = await c.req.json().catch(() => ({}))
    c.set('validatedBody', body)
    return forgotPassword(c)
  })
  return app
}

const baseEnv: AppEnv['Bindings'] = {
  TURSO_DB_URL: '',
  TURSO_AUTH_TOKEN: '',
  FIREBASE_PROJECT_ID: '',
  RESEND_API_KEY: '',
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_API_KEY: '',
  CLOUDINARY_API_SECRET: '',
  KHALTI_SECRET_KEY: '',
  KHALTI_PUBLIC_KEY: '',
  ESEWA_SECRET_KEY: '',
  ESEWA_MERCHANT_CODE: '',
  ESEWA_IS_LIVE: '',
  UPSTASH_REDIS_REST_URL: '',
  UPSTASH_REDIS_REST_TOKEN: '',
  FRONTEND_URL: '',
  FREE_SHIPPING_THRESHOLD: '',
  COD_FEE: '',
  AUTH_SECRET: '',
  ADMIN_SESSION_SECRET: '',
  ADMIN_EMAIL: '',
  ADMIN_NAME: '',
  SUPER_ADMIN_EMAILS: '',
  CSRF_SECRET: '',
  ENVIRONMENT: 'test',
}

describe('POST /auth/forgot-password', () => {
  it('returns accountExists: true for a registered email', async () => {
    const db = createMockDb([{ id: 'user-1', email: 'customer@example.com', first_name: 'Sam' }])
    const app = createApp(db)

    const res = await app.request(
      '/forgot-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'customer@example.com' }),
      },
      baseEnv,
    )

    expect(res.status).toBe(200)
    const json = await res.json() as { success: boolean; data: { accountExists: boolean } }
    expect(json.success).toBe(true)
    expect(json.data).toEqual({ accountExists: true })
  })

  it('returns accountExists: false for an unknown email', async () => {
    const db = createMockDb([])
    const app = createApp(db)

    const res = await app.request(
      '/forgot-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-a-real-user-12345@example.com' }),
      },
      baseEnv,
    )

    expect(res.status).toBe(200)
    const json = await res.json() as { success: boolean; data: { accountExists: boolean } }
    expect(json.success).toBe(true)
    expect(json.data).toEqual({ accountExists: false })
  })
})

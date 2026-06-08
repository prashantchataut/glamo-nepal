import type { Context } from 'hono'
import type { AppEnv } from '../types/bindings'

const IDEMPOTENCY_KEY_HEADER = 'x-idempotency-key'
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000

interface CacheEntry {
  status: number
  body: unknown
  createdAt: number
}

const idempotencyCache = new Map<string, CacheEntry>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of Array.from(idempotencyCache.entries())) {
    if (now - entry.createdAt > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key)
    }
  }
}, 60 * 60 * 1000)

export function idempotencyGuard() {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    const method = c.req.method.toUpperCase()
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
      await next()
      return
    }

    const key = c.req.header(IDEMPOTENCY_KEY_HEADER)
    if (!key) {
      await next()
      return
    }

    const cached = idempotencyCache.get(key)
    if (cached) {
      return new Response(JSON.stringify(cached.body), {
        status: cached.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await next()

    if (key && !idempotencyCache.has(key)) {
      const response = c.res
      if (response && response.status >= 200 && response.status < 400) {
        try {
          const cloned = response.clone()
          const body = await cloned.json()
          idempotencyCache.set(key, {
            status: response.status,
            body,
            createdAt: Date.now(),
          })
        } catch {
          // Response body not JSON, skip caching
        }
      }
    }
  }
}

export function markIdempotent(key: string, status: number, body: unknown): void {
  if (key && !idempotencyCache.has(key)) {
    idempotencyCache.set(key, { status, body, createdAt: Date.now() })
  }
}

export function checkIdempotencyKey(key: string): CacheEntry | undefined {
  return idempotencyCache.get(key)
}
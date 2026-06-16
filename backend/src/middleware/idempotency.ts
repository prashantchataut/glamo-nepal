import type { Context } from 'hono'
import type { AppEnv } from '../types/bindings'

const IDEMPOTENCY_KEY_HEADER = 'x-idempotency-key'
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000
const MAX_CACHE_SIZE = 10000
const MAX_KEY_LENGTH = 128
const IS_PRODUCTION = typeof process !== 'undefined' && process.env.NODE_ENV === 'production'

interface CacheEntry {
  status: number
  body: unknown
  createdAt: number
}

const idempotencyCache = new Map<string, CacheEntry>()

function evictExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of Array.from(idempotencyCache.entries())) {
    if (now - entry.createdAt > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key)
    }
  }
  if (idempotencyCache.size > MAX_CACHE_SIZE) {
    let oldestKey: string | null = null
    let oldestTime = Infinity
    for (const [key, entry] of idempotencyCache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }
    if (oldestKey) idempotencyCache.delete(oldestKey)
  }
}

let idempotencyCleanupTimer: ReturnType<typeof setInterval> | null = null
function startIdempotencyCleanup() {
  if (idempotencyCleanupTimer) return
  try {
    idempotencyCleanupTimer = setInterval(evictExpiredEntries, 60 * 60 * 1000)
  } catch {
    // setInterval not available in Workers global scope
  }
}

async function getFromRedis(key: string, env: AppEnv['Bindings']): Promise<CacheEntry | null> {
  const url = env?.UPSTASH_REDIS_REST_URL
  const token = env?.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  try {
    const res = await fetch(`${url}/get/idempotency:${key}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json() as { result: string | null }
    if (!data.result) return null
    return JSON.parse(data.result) as CacheEntry
  } catch {
    return null
  }
}

async function setToRedis(key: string, entry: CacheEntry, env: AppEnv['Bindings']): Promise<void> {
  const url = env?.UPSTASH_REDIS_REST_URL
  const token = env?.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return

  try {
    const ttlSeconds = Math.ceil(IDEMPOTENCY_TTL_MS / 1000)
    await fetch(`${url}/set/idempotency:${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([JSON.stringify(entry), 'EX', String(ttlSeconds)]),
    })
  } catch {
    // Redis write failure is non-critical; in-memory cache will serve as fallback
  }
}

export function idempotencyGuard() {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    startIdempotencyCleanup()
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

    if (key.length > MAX_KEY_LENGTH) {
      return c.json({ success: false, message: 'Idempotency key too long', errors: ['IDEMPOTENCY_KEY_TOO_LONG'] }, 400)
    }

    // Check Redis first (production), then memory fallback
    const env = c.env
    const redisEntry = await getFromRedis(key, env)
    if (redisEntry) {
      return new Response(JSON.stringify(redisEntry.body), {
        status: redisEntry.status,
        headers: { 'Content-Type': 'application/json' },
      })
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
          const entry: CacheEntry = { status: response.status, body, createdAt: Date.now() }
          idempotencyCache.set(key, entry)
          await setToRedis(key, entry, env)
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
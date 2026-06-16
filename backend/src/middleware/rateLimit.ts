// Rate limiter with Upstash Redis for production, in-memory fallback for development.
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars for production.
import type { Context } from 'hono'
import type { AppEnv } from '../types/bindings'

export const RATE_LIMITS = {
  auth: { max: 5, window: 15 * 60 },
  passwordReset: { max: 3, window: 60 * 60 },
  coupon: { max: 10, window: 60 },
  payment: { max: 5, window: 60 },
  event: { max: 50, window: 60 },
  review: { max: 5, window: 60 * 60 },
  contact: { max: 3, window: 60 * 60 },
  orderTracking: { max: 5, window: 60 },
  general: { max: 100, window: 60 },
} as const

export type RateLimitConfig = { max: number; window: number; keyGenerator?: (c: Context<AppEnv>) => string }

interface RateLimitEntry {
  count: number
  expires: number
}

const memoryStore = new Map<string, RateLimitEntry>()

let cleanupTimer: ReturnType<typeof setInterval> | null = null
function startCleanup() {
  if (cleanupTimer) return
  try {
    cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of Array.from(memoryStore.entries())) {
        if (entry.expires < now) memoryStore.delete(key)
      }
    }, 60_000)
  } catch {
    // setInterval not available in Workers global scope — rely on Redis
  }
}

async function redisIncrement(key: string, window: number, max: number, env: AppEnv['Bindings']): Promise<{ allowed: boolean; remaining: number }> {
  const url = env.UPSTASH_REDIS_REST_URL
  const token = env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return { allowed: false, remaining: 0 }

  try {
    const pipeline = [
      ['INCR', key],
      ['EXPIRE', key, window],
    ]
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(pipeline),
    })
    if (!res.ok) {
      console.error(`Rate limit Redis error: ${res.status}`)
      return { allowed: false, remaining: 0 }
    }
    const data = await res.json() as { result?: [number?, ...unknown[]] }
    const count = typeof data?.result?.[0] === 'number' ? data.result[0] : 0
    return { allowed: count <= max, remaining: Math.max(0, max - count) }
  } catch (err) {
    console.error('Rate limit Redis connection failed, falling back to memory:', err)
    return memoryIncrement(key, window, max)
  }
}

function memoryIncrement(key: string, window: number, max: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = memoryStore.get(key)
  let count = 0
  if (entry && entry.expires > now) count = entry.count
  if (count >= max) return { allowed: false, remaining: 0 }
  const newCount = count + 1
  memoryStore.set(key, { count: newCount, expires: now + window * 1000 })
  return { allowed: true, remaining: max - newCount }
}

function getClientIp(c: Context<AppEnv>): string {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim())
    const trustedProxyCount = parseInt((typeof process !== 'undefined' && process.env?.TRUSTED_PROXY_COUNT) || '1', 10)
    const clientIndex = Math.max(0, ips.length - trustedProxyCount)
    const clientIp = ips[clientIndex]
    if (clientIp) return clientIp
  }
  return c.req.header('x-real-ip') || c.req.header('cf-connecting-ip') || 'unknown'
}

export function rateLimit(config: RateLimitConfig) {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    startCleanup()
    try {
      const keyGenerator = config.keyGenerator ?? (() => {
        const ip = getClientIp(c)
        return `ratelimit:${ip}:${c.req.path}`
      })

      const key = keyGenerator(c)
      const env = c.env

      const result = env?.UPSTASH_REDIS_REST_URL && env?.UPSTASH_REDIS_REST_TOKEN
        ? await redisIncrement(key, config.window, config.max, env)
        : memoryIncrement(key, config.window, config.max)

      c.header('X-RateLimit-Limit', String(config.max))
      c.header('X-RateLimit-Remaining', String(result.remaining))

      if (!result.allowed) {
        c.header('Retry-After', String(config.window))
        return c.json({ success: false, message: 'Too many requests, please try again later', errors: [] }, 429)
      }
} catch (err) {
    console.error('Rate limiting error, denying request:', err)
    return c.json({ success: false, message: 'Too many requests, please try again later', errors: [] }, 429)
  }

    await next()
  }
}

export const authRateLimit = rateLimit({
  max: RATE_LIMITS.auth.max,
  window: RATE_LIMITS.auth.window,
  keyGenerator: (c) => {
    const ip = getClientIp(c)
    return `ratelimit:${ip}:auth`
  },
})

export const passwordResetRateLimit = rateLimit({
  max: RATE_LIMITS.passwordReset.max,
  window: RATE_LIMITS.passwordReset.window,
  keyGenerator: (c) => {
    const ip = getClientIp(c)
    return `ratelimit:${ip}:password-reset`
  },
})

export const couponRateLimit = rateLimit({
  max: RATE_LIMITS.coupon.max,
  window: RATE_LIMITS.coupon.window,
  keyGenerator: (c) => {
    const ip = getClientIp(c)
    return `ratelimit:${ip}:coupon`
  },
})

export const paymentRateLimit = rateLimit({
  max: RATE_LIMITS.payment.max,
  window: RATE_LIMITS.payment.window,
  keyGenerator: (c) => {
    const user = c.get('user')
    const id = user?.id ?? getClientIp(c)
    return `ratelimit:${id}:payment`
  },
})

export const generalRateLimit = rateLimit({
  max: RATE_LIMITS.general.max,
  window: RATE_LIMITS.general.window,
})

export const eventRateLimit = rateLimit({
  max: RATE_LIMITS.event.max,
  window: RATE_LIMITS.event.window,
  keyGenerator: (c) => {
    const ip = getClientIp(c)
    return `ratelimit:${ip}:event`
  },
})

export const reviewRateLimit = rateLimit({
  max: RATE_LIMITS.review.max,
  window: RATE_LIMITS.review.window,
  keyGenerator: (c) => {
    const user = c.get('user')
    const id = user?.id ?? getClientIp(c)
    return `ratelimit:${id}:review`
  },
})

export const contactRateLimit = rateLimit({
  max: RATE_LIMITS.contact.max,
  window: RATE_LIMITS.contact.window,
  keyGenerator: (c) => {
    const ip = getClientIp(c)
    return `ratelimit:${ip}:contact`
  },
})

export const orderTrackingRateLimit = rateLimit({
  max: RATE_LIMITS.orderTracking.max,
  window: RATE_LIMITS.orderTracking.window,
  keyGenerator: (c) => {
    const ip = getClientIp(c)
    return `ratelimit:${ip}:order-tracking`
  },
})

export const publicReadRateLimit = rateLimit({
  max: 30,
  window: 60,
  keyGenerator: (c) => {
    const ip = getClientIp(c)
    return `ratelimit:${ip}:public-read`
  },
})

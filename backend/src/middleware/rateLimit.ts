// Rate limiter using in-memory storage.
// IMPORTANT: This is per-instance only. On serverless platforms (e.g., Netlify Functions),
// each cold start gets a fresh store, so rate limiting is best-effort.
// For production-grade rate limiting, use Turso-backed or external rate limiting.
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
  general: { max: 100, window: 60 },
} as const

export type RateLimitConfig = { max: number; window: number; keyGenerator?: (c: Context<AppEnv>) => string }

const rateLimitStore = new Map<string, { count: number; expires: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    if (entry.expires < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60_000)

export function rateLimit(config: RateLimitConfig) {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    try {
      const keyGenerator = config.keyGenerator ?? (() => {
        const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'unknown'
        return `ratelimit:${ip}:${c.req.path}`
      })

      const key = keyGenerator(c)
      const now = Date.now()
      const entry = rateLimitStore.get(key)

      let count = 0
      if (entry && entry.expires > now) {
        count = entry.count
      }

      if (count >= config.max) {
        c.header('Retry-After', String(config.window))
        return c.json({
          success: false,
          message: 'Too many requests, please try again later',
          errors: [],
        }, 429)
      }

      const newCount = count + 1
      rateLimitStore.set(key, { count: newCount, expires: now + config.window * 1000 })

      c.header('X-RateLimit-Limit', String(config.max))
      c.header('X-RateLimit-Remaining', String(config.max - newCount))
    } catch (err) {
      console.warn('Rate limiting error, allowing request:', err)
    }

    await next()
  }
}

export const authRateLimit = rateLimit({
  max: RATE_LIMITS.auth.max,
  window: RATE_LIMITS.auth.window,
  keyGenerator: (c) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'unknown'
    return `ratelimit:${ip}:auth`
  },
})

export const passwordResetRateLimit = rateLimit({
  max: RATE_LIMITS.passwordReset.max,
  window: RATE_LIMITS.passwordReset.window,
  keyGenerator: (c) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'unknown'
    return `ratelimit:${ip}:password-reset`
  },
})

export const couponRateLimit = rateLimit({
  max: RATE_LIMITS.coupon.max,
  window: RATE_LIMITS.coupon.window,
  keyGenerator: (c) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'unknown'
    return `ratelimit:${ip}:coupon`
  },
})

export const paymentRateLimit = rateLimit({
  max: RATE_LIMITS.payment.max,
  window: RATE_LIMITS.payment.window,
  keyGenerator: (c) => {
    const user = c.get('user')
    const id = user?.id ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
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
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'unknown'
    return `ratelimit:${ip}:event`
  },
})

export const reviewRateLimit = rateLimit({
  max: RATE_LIMITS.review.max,
  window: RATE_LIMITS.review.window,
  keyGenerator: (c) => {
    const user = c.get('user')
    const id = user?.id ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    return `ratelimit:${id}:review`
  },
})

export const contactRateLimit = rateLimit({
  max: RATE_LIMITS.contact.max,
  window: RATE_LIMITS.contact.window,
  keyGenerator: (c) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'unknown'
    return `ratelimit:${ip}:contact`
  },
})

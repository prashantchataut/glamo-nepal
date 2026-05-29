import type { Context } from 'hono'
import type { AppEnv } from '../types/bindings'

export const RATE_LIMITS = {
  auth: { max: 5, window: 15 * 60 },
  passwordReset: { max: 3, window: 60 * 60 },
  coupon: { max: 10, window: 60 },
  payment: { max: 5, window: 60 },
  event: { max: 50, window: 60 },
  review: { max: 5, window: 60 * 60 },
  general: { max: 100, window: 60 },
} as const

export type RateLimitConfig = { max: number; window: number; keyGenerator?: (c: Context<AppEnv>) => string }

export function rateLimit(config: RateLimitConfig) {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    try {
      if (!c.env.KV) {
        console.warn('Rate limiting disabled: KV namespace not configured')
        await next()
        return
      }

      const keyGenerator = config.keyGenerator ?? (() => {
        const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown'
        return `ratelimit:${ip}:${c.req.path}`
      })

      const key = keyGenerator(c)
      const current = await c.env.KV.get<string>(key)

      const count = current ? parseInt(current, 10) : 0

      if (count >= config.max) {
        c.header('Retry-After', String(config.window))
        return c.json({
          success: false,
          message: 'Too many requests, please try again later',
          errors: [],
        }, 429)
      }

      const newCount = count + 1
      await c.env.KV.put(key, String(newCount), { expirationTtl: config.window })

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
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown'
    return `ratelimit:${ip}:auth`
  },
})

export const passwordResetRateLimit = rateLimit({
  max: RATE_LIMITS.passwordReset.max,
  window: RATE_LIMITS.passwordReset.window,
  keyGenerator: (c) => {
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown'
    return `ratelimit:${ip}:password-reset`
  },
})

export const couponRateLimit = rateLimit({
  max: RATE_LIMITS.coupon.max,
  window: RATE_LIMITS.coupon.window,
  keyGenerator: (c) => {
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown'
    return `ratelimit:${ip}:coupon`
  },
})

export const paymentRateLimit = rateLimit({
  max: RATE_LIMITS.payment.max,
  window: RATE_LIMITS.payment.window,
  keyGenerator: (c) => {
    const user = c.get('user')
    const id = user?.id ?? c.req.header('cf-connecting-ip') ?? 'unknown'
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
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown'
    return `ratelimit:${ip}:event`
  },
})

export const reviewRateLimit = rateLimit({
  max: RATE_LIMITS.review.max,
  window: RATE_LIMITS.review.window,
  keyGenerator: (c) => {
    const user = c.get('user')
    const id = user?.id ?? c.req.header('cf-connecting-ip') ?? 'unknown'
    return `ratelimit:${id}:review`
  },
})
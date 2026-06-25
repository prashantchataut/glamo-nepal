import type { Context } from 'hono'
import type { AppEnv } from '../types/bindings'

/**
 * Resolve the originating client IP and user agent for a request, taking
 * common proxy headers into account (Cloudflare, Vercel, generic
 * X-Forwarded-For chains). Falls back to null when no signal is present.
 */
export function extractClientInfo(c: Context<AppEnv>): { ipAddress: string | null; userAgent: string | null } {
  const cfIp = c.req.header('cf-connecting-ip') || c.req.header('true-client-ip')
  const xff = c.req.header('x-forwarded-for')
  const realIp = c.req.header('x-real-ip')
  const ip =
    cfIp ||
    (typeof xff === 'string' && xff.length > 0 ? xff.split(',')[0]?.trim() : null) ||
    realIp ||
    null

  const ua = c.req.header('user-agent') || null
  return { ipAddress: ip, userAgent: ua }
}

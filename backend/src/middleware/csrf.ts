import type { Context } from 'hono'
import type { AppEnv } from '../types/bindings'

const CSRF_COOKIE_NAME = 'glamo-csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

export function csrfProtection() {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    const method = c.req.method.toUpperCase()

    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      await next()
      return
    }

    const cookieHeader = c.req.header('cookie') || ''
    let cookieToken = ''
    for (const pair of cookieHeader.split(';')) {
      const trimmed = pair.trim()
      if (trimmed.startsWith(`${CSRF_COOKIE_NAME}=`)) {
        cookieToken = decodeURIComponent(trimmed.slice(CSRF_COOKIE_NAME.length + 1))
        break
      }
    }

    const headerToken = c.req.header(CSRF_HEADER_NAME)

    if (!cookieToken && !headerToken) {
      await next()
      return
    }

    if (!cookieToken) {
      return c.json({ success: false, message: 'Missing CSRF cookie. Please refresh the page.', errors: ['CSRF_COOKIE_MISSING'] }, 403)
    }

    if (!headerToken) {
      return c.json({ success: false, message: 'Missing CSRF token header. Please refresh the page.', errors: ['CSRF_HEADER_MISSING'] }, 403)
    }

    if (cookieToken !== headerToken) {
      return c.json({ success: false, message: 'CSRF token mismatch. Please refresh the page.', errors: ['CSRF_MISMATCH'] }, 403)
    }

    if (cookieToken.length < 32) {
      return c.json({ success: false, message: 'Invalid CSRF token.', errors: ['CSRF_INVALID'] }, 403)
    }

    await next()
  }
}
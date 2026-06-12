import type { Context } from 'hono'
import type { AppEnv } from '../types/bindings'
import { createHmac } from 'crypto'

const CSRF_COOKIE_NAME = 'glamo-csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.AUTH_SECRET || ''

const CSRF_EXEMPT_PATHS = [
  '/api/v1/auth/sync',
  '/api/v1/auth/register',
  '/api/v1/auth/logout',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/send-verification',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/me',
]

function getHmacKey(): Buffer | null {
  if (!CSRF_SECRET) return null
  return Buffer.from(CSRF_SECRET, 'utf-8')
}

function signToken(rawToken: string): string | null {
  const key = getHmacKey()
  if (!key) return rawToken
  const hmac = createHmac('sha256', key)
  hmac.update(rawToken)
  const sig = hmac.digest('base64').replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  return `${rawToken}.${sig}`
}

export function csrfProtection() {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    const method = c.req.method.toUpperCase()

    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      await next()
      return
    }

    const path = c.req.path
    if (CSRF_EXEMPT_PATHS.some((exempt) => path === exempt || path.startsWith(exempt + '/'))) {
      await next()
      return
    }

    const cookieHeader = c.req.header('cookie') || ''
    let signedCookieToken = ''
    for (const pair of cookieHeader.split(';')) {
      const trimmed = pair.trim()
      if (trimmed.startsWith(`${CSRF_COOKIE_NAME}=`)) {
        signedCookieToken = decodeURIComponent(trimmed.slice(CSRF_COOKIE_NAME.length + 1))
        break
      }
    }

    const headerToken = c.req.header(CSRF_HEADER_NAME)

    if (!signedCookieToken && !headerToken) {
      return c.json({ success: false, message: 'CSRF token missing. Please refresh the page and try again.', errors: ['CSRF_TOKEN_MISSING'] }, 403)
    }

    if (!signedCookieToken) {
      return c.json({ success: false, message: 'Missing CSRF cookie. Please refresh the page.', errors: ['CSRF_COOKIE_MISSING'] }, 403)
    }

    if (!headerToken) {
      return c.json({ success: false, message: 'Missing CSRF token header. Please refresh the page.', errors: ['CSRF_HEADER_MISSING'] }, 403)
    }

    let cookieRawToken: string | null = null
    const dotIndex = signedCookieToken.lastIndexOf('.')
    if (dotIndex === -1) {
      cookieRawToken = signedCookieToken
    } else {
      const expectedSigned = signToken(signedCookieToken.slice(0, dotIndex))
      if (expectedSigned && expectedSigned === signedCookieToken) {
        cookieRawToken = signedCookieToken.slice(0, dotIndex)
      }
    }

    if (!cookieRawToken || cookieRawToken !== headerToken) {
      return c.json({ success: false, message: 'CSRF token mismatch. Please refresh the page.', errors: ['CSRF_MISMATCH'] }, 403)
    }

    if (cookieRawToken.length < 32) {
      return c.json({ success: false, message: 'Invalid CSRF token.', errors: ['CSRF_INVALID'] }, 403)
    }

    await next()
  }
}
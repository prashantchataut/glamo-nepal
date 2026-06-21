import type { Context } from 'hono'
import type { AppEnv } from '../types/bindings'
import { getEnv } from '../utils/env'
import { verifyProxyTrust, readProxyTrustSecret, PROXY_TRUST_HEADER } from '../utils/proxy-trust'

const CSRF_COOKIE_NAME = 'glamo-csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

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

async function signToken(c: Context<AppEnv>, rawToken: string): Promise<string | null> {
  const secret = getEnv(c, 'CSRF_SECRET') || getEnv(c, 'AUTH_SECRET')
  if (!secret) return rawToken
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawToken))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  return `${rawToken}.${sigB64}`
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

    // PROXY-TRUST BYPASS: when the Vercel edge proxy has validated CSRF
    // locally and vouched for the identity via x-proxy-trust, the backend does
    // not need to re-verify CSRF (which would require CSRF_SECRET to match
    // across deployments — the exact drift that broke checkout). The trust
    // header is HMAC-signed and short-lived, so a valid one proves the proxy
    // already ran the CSRF check. Mutating admin/auth requests carrying it are
    // safe to let through.
    const trustSecret = readProxyTrustSecret({ env: c.env as unknown as Record<string, string | undefined> })
    if (trustSecret) {
      const trust = await verifyProxyTrust(c.req.header(PROXY_TRUST_HEADER), trustSecret)
      if (trust.ok && trust.payload) {
        await next()
        return
      }
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
      const expectedSigned = await signToken(c, signedCookieToken.slice(0, dotIndex))
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
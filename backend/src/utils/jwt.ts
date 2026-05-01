import { SignJWT, jwtVerify } from 'jose'
import type { Context } from 'hono'
import type { AppEnv } from '../types/bindings'
import { deleteCookie, setCookie } from 'hono/cookie'

interface TokenPayload {
  id: string
  email: string
  role: string
}

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

function getPrivateKey(key: string): Uint8Array {
  return new TextEncoder().encode(key)
}

function getPublicKey(key: string): Uint8Array {
  return new TextEncoder().encode(key)
}

export async function generateAccessToken(
  payload: TokenPayload,
  privateKey: string
): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getPrivateKey(privateKey))
  return token
}

export async function generateRefreshToken(
  payload: TokenPayload,
  privateKey: string
): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getPrivateKey(privateKey))
  return token
}

export async function verifyToken(
  token: string,
  publicKey: string
): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getPublicKey(publicKey), {
    algorithms: ['RS256'],
  })
  return payload as unknown as TokenPayload
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax' as const,
  path: '/',
}

const ACCESS_COOKIE = '__Host-access_token'
const REFRESH_COOKIE = '__Host-refresh_token'

export function setAuthCookies(
  c: Context<AppEnv>,
  accessToken: string,
  refreshToken: string
) {
  setCookie(c, ACCESS_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60,
  })
  setCookie(c, REFRESH_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60,
  })
}

export function clearAuthCookies(c: Context<AppEnv>) {
  deleteCookie(c, ACCESS_COOKIE, { path: '/' })
  deleteCookie(c, REFRESH_COOKIE, { path: '/' })
}
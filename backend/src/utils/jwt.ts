import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose'
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

let cachedPrivateKey: CryptoKey | null = null
let cachedPrivateKeyPem: string | null = null
let cachedPublicKey: CryptoKey | null = null
let cachedPublicKeyPem: string | null = null

async function getPrivateKey(pem: string): Promise<CryptoKey> {
  if (cachedPrivateKeyPem === pem && cachedPrivateKey) {
    return cachedPrivateKey
  }
  const key = await importPKCS8(pem, 'RS256')
  cachedPrivateKey = key
  cachedPrivateKeyPem = pem
  return key
}

async function getPublicKey(pem: string): Promise<CryptoKey> {
  if (cachedPublicKeyPem === pem && cachedPublicKey) {
    return cachedPublicKey
  }
  const key = await importSPKI(pem, 'RS256')
  cachedPublicKey = key
  cachedPublicKeyPem = pem
  return key
}

export async function generateAccessToken(
  payload: TokenPayload,
  privateKeyPem: string
): Promise<string> {
  const key = await getPrivateKey(privateKeyPem)
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(key)
  return token
}

export async function generateRefreshToken(
  payload: TokenPayload,
  privateKeyPem: string
): Promise<string> {
  const key = await getPrivateKey(privateKeyPem)
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(key)
  return token
}

export async function verifyToken(
  token: string,
  publicKeyPem: string
): Promise<TokenPayload> {
  const key = await getPublicKey(publicKeyPem)
  const { payload } = await jwtVerify(token, key, {
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
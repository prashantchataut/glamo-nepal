import type { Context } from 'hono'
import type { AppEnv } from '../types/bindings'

export function getEnv(c: Context<AppEnv>, key: keyof AppEnv['Bindings']): string {
  if (c.env && key in c.env) {
    return c.env[key] as string
  }
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key] as string
  }
  return ''
}

export function getFullEnv(c: Context<AppEnv>): AppEnv['Bindings'] {
  return {
    TURSO_DB_URL: getEnv(c, 'TURSO_DB_URL'),
    TURSO_AUTH_TOKEN: getEnv(c, 'TURSO_AUTH_TOKEN'),
    FIREBASE_PROJECT_ID: getEnv(c, 'FIREBASE_PROJECT_ID'),
    RESEND_API_KEY: getEnv(c, 'RESEND_API_KEY'),
    CLOUDINARY_CLOUD_NAME: getEnv(c, 'CLOUDINARY_CLOUD_NAME'),
    CLOUDINARY_API_KEY: getEnv(c, 'CLOUDINARY_API_KEY'),
    CLOUDINARY_API_SECRET: getEnv(c, 'CLOUDINARY_API_SECRET'),
    KHALTI_SECRET_KEY: getEnv(c, 'KHALTI_SECRET_KEY'),
    KHALTI_PUBLIC_KEY: getEnv(c, 'KHALTI_PUBLIC_KEY'),
    ESEWA_SECRET_KEY: getEnv(c, 'ESEWA_SECRET_KEY'),
    ESEWA_MERCHANT_CODE: getEnv(c, 'ESEWA_MERCHANT_CODE'),
    ESEWA_IS_LIVE: getEnv(c, 'ESEWA_IS_LIVE') || 'false',
    UPSTASH_REDIS_REST_URL: getEnv(c, 'UPSTASH_REDIS_REST_URL'),
    UPSTASH_REDIS_REST_TOKEN: getEnv(c, 'UPSTASH_REDIS_REST_TOKEN'),
    FRONTEND_URL: getEnv(c, 'FRONTEND_URL') || 'http://localhost:3000',
    FREE_SHIPPING_THRESHOLD: getEnv(c, 'FREE_SHIPPING_THRESHOLD') || '2500',
    COD_FEE: getEnv(c, 'COD_FEE') || '50',
    AUTH_SECRET: getEnv(c, 'AUTH_SECRET') || (() => { throw new Error('AUTH_SECRET is required') })(),
    ADMIN_SESSION_SECRET: getEnv(c, 'ADMIN_SESSION_SECRET'),
    ADMIN_EMAIL: getEnv(c, 'ADMIN_EMAIL'),
    ADMIN_NAME: getEnv(c, 'ADMIN_NAME'),
    SUPER_ADMIN_EMAILS: getEnv(c, 'SUPER_ADMIN_EMAILS'),
    CSRF_SECRET: getEnv(c, 'CSRF_SECRET'),
    ENVIRONMENT: getEnv(c, 'ENVIRONMENT') || 'development',
  }
}
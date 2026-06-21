import type { Client } from '@libsql/client'

export interface CloudflareBindings {
  TURSO_DB_URL: string
  TURSO_AUTH_TOKEN: string
  FIREBASE_PROJECT_ID: string
  RESEND_API_KEY: string
  CLOUDINARY_CLOUD_NAME: string
  CLOUDINARY_API_KEY: string
  CLOUDINARY_API_SECRET: string
  KHALTI_SECRET_KEY: string
  KHALTI_PUBLIC_KEY: string
  ESEWA_SECRET_KEY: string
  ESEWA_MERCHANT_CODE: string
  ESEWA_IS_LIVE: string
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  FRONTEND_URL: string
  FREE_SHIPPING_THRESHOLD: string
  COD_FEE: string
  AUTH_SECRET: string
  ADMIN_SESSION_SECRET: string
  // Single shared key for the Vercel proxy to vouch for admin identity. When
  // set, the backend trusts a signed x-proxy-trust header instead of needing
  // ADMIN_SESSION_SECRET/CSRF_SECRET to match across deployments. See
  // src/utils/proxy-trust.ts.
  PROXY_TRUST_SECRET?: string
  ADMIN_EMAIL: string
  ADMIN_NAME: string
  SUPER_ADMIN_EMAILS: string
  CSRF_SECRET: string
  ENVIRONMENT: string
  CONTACT_EMAIL?: string
  FROM_EMAIL?: string
}

export type AppEnv = {
  Bindings: CloudflareBindings
  Variables: {
    user: {
      id: string
      email: string
      role: string
      isActive: boolean
    }
    db: Client
    validatedBody: any
    validatedQuery: any
    validatedParams: any
    idempotencyKey?: string
  }
}
import type { Client } from '@libsql/client'

export interface NetlifyBindings {
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
}

export type AppEnv = {
  Bindings: NetlifyBindings
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
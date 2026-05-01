export interface CloudflareBindings {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
  JWT_PRIVATE_KEY: string
  JWT_PUBLIC_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  RESEND_API_KEY: string
  R2_PUBLIC_URL: string
  CLOUDINARY_CLOUD_NAME: string
  CLOUDINARY_API_KEY: string
  CLOUDINARY_API_SECRET: string
  KHALTI_SECRET_KEY: string
  ESEWA_SECRET_KEY: string
  ESEWA_MERCHANT_CODE: string
  FRONTEND_URL: string
  FREE_SHIPPING_THRESHOLD: string
  COD_FEE: string
  ADMIN_EMAIL: string
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
    validatedBody: any
    validatedQuery: any
    validatedParams: any
  }
}
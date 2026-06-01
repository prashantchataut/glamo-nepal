import { z } from 'zod'

const envSchema = z.object({
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().optional().default(''),
  R2_PUBLIC_URL: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  KHALTI_SECRET_KEY: z.string().optional().default(''),
  ESEWA_SECRET_KEY: z.string().optional().default(''),
  ESEWA_MERCHANT_CODE: z.string().optional().default(''),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  FREE_SHIPPING_THRESHOLD: z.string().default('2500'),
  COD_FEE: z.string().default('50'),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(env: Record<string, unknown>): Env {
  return envSchema.parse(env)
}
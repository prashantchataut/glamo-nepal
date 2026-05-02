import { z } from 'zod'

export const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  value: z.number().positive().optional(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  cartTotal: z.number().nonnegative(),
})

export const applyCouponSchema = z.object({
  code: z.string().min(1),
  cartTotal: z.number().nonnegative(),
})

export type CreateCouponInput = z.infer<typeof createCouponSchema>
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>
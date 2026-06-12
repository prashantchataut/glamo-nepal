import { z } from 'zod'

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.string(),
  expiresAt: z.string(),
})

export const updateCouponSchema = z.object({
  code: z.string().min(3).max(50).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  value: z.number().positive().optional(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const validateCouponSchema = z.object({
  code: z.string(),
  cartTotal: z.number().nonnegative(),
})

export const applyCouponSchema = z.object({
  code: z.string(),
  cartTotal: z.number().nonnegative(),
})

export const couponFilterSchema = z.object({
  isActive: z.string().optional().transform(v => v === 'true'),
  page: z.coerce.number().int().positive().max(500).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type CreateCouponInput = z.infer<typeof createCouponSchema>
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>
export type CouponFilterInput = z.infer<typeof couponFilterSchema>
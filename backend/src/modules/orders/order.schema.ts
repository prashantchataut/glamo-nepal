import { z } from 'zod'

const addressSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().default('Nepal'),
})

export const createOrderSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['KHALTI', 'ESEWA', 'CARD', 'COD']),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().min(1).max(99),
  })).min(1),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED']),
  comment: z.string().max(500).optional(),
})

export const orderFilterSchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  paymentMethod: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const applyCouponSchema = z.object({
  code: z.string().min(1),
})

export const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  type: z.enum(['PERCENTAGE', 'FLAT']),
  value: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.string(),
  expiresAt: z.string(),
  isActive: z.boolean().default(true),
})

export const updateCouponSchema = createCouponSchema.partial()
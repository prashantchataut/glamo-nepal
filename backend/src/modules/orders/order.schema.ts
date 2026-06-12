import { z } from 'zod'

const addressSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  address1: z.string().min(1).max(200).optional(),
  addressLine1: z.string().min(1).max(200).optional(),
  address2: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  ward: z.string().max(20).optional(),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().default('Nepal'),
  landmark: z.string().max(120).optional(),
}).refine((value) => Boolean(value.address1 || value.addressLine1), 'Address line is required')

const customerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20),
})

const orderItemSchema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(99),
  selectedShade: z.string().max(80).optional(),
  product: z.object({
    id: z.string().optional(),
    sku: z.string().optional(),
    slug: z.string().optional(),
    name: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    image: z.string().optional(),
    price: z.coerce.number().nonnegative().optional(),
    originalPrice: z.coerce.number().nonnegative().optional(),
  }).passthrough().optional(),
}).refine((value) => Boolean(value.productId || value.product?.id || value.product?.sku || value.product?.slug), 'Product identifier is required')

export const createOrderSchema = z.object({
  customer: customerSchema.optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val
      const normalized = val.toUpperCase().replace(/ /g, '_')
      if (normalized === 'COD') return 'CASH_ON_DELIVERY'
      if (normalized === 'CARDS') return 'CARD'
      return normalized
    },
    z.enum(['CASH_ON_DELIVERY', 'KHALTI', 'ESEWA', 'BANK_TRANSFER', 'CARD'])
  ),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  orderNotes: z.string().max(500).optional(),
  giftWrap: z.boolean().optional(),
  deliveryFee: z.coerce.number().nonnegative(),
  subtotal: z.coerce.number().nonnegative(),
  grandTotal: z.coerce.number().nonnegative(),
  currency: z.literal('NPR').optional(),
  items: z.array(orderItemSchema).min(1),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  comment: z.string().max(500).optional(),
})

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const verifyPaymentSchema = z.object({
  token: z.string().min(1).optional(),
  pidx: z.string().min(1).optional(),
  refId: z.string().min(1).optional(),
  transactionId: z.string().min(1).optional(),
})

export const orderFilterSchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  paymentMethod: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().max(500).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type OrderFilterInput = z.infer<typeof orderFilterSchema>
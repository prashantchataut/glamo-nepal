import { z } from 'zod'

const entityId = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/)

export const addToCartSchema = z.object({
  productId: entityId,
  variantId: entityId.optional(),
  quantity: z.number().int().min(1).default(1),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
})

export const idParamSchema = z.object({
  id: entityId,
})

export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
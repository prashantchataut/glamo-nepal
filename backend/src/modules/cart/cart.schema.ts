import { z } from 'zod'

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).default(1),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
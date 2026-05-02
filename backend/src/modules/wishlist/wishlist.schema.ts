import { z } from 'zod'

export const addToWishlistSchema = z.object({
  productId: z.string().uuid(),
})

export const idParamSchema = z.object({
  productId: z.string().uuid(),
})

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>
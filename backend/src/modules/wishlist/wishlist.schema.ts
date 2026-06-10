import { z } from 'zod'

const entityId = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/)

export const addToWishlistSchema = z.object({
  productId: entityId,
})

export const idParamSchema = z.object({
  productId: entityId,
})

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>
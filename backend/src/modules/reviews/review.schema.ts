import { z } from 'zod'

const entityId = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/)

export const createReviewSchema = z.object({
  productId: entityId,
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
})

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
})

export const reviewFilterSchema = z.object({
  productId: entityId.optional(),
  isApproved: z.string().optional().transform(v => v === 'true'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const idParamSchema = z.object({
  id: entityId,
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
export type ReviewFilterInput = z.infer<typeof reviewFilterSchema>
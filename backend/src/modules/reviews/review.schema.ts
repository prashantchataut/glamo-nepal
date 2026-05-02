import { z } from 'zod'

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
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
  productId: z.string().uuid().optional(),
  isApproved: z.string().optional().transform(v => v === 'true'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
export type ReviewFilterInput = z.infer<typeof reviewFilterSchema>
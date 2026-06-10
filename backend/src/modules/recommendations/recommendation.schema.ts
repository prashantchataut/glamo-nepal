import { z } from 'zod'

export const recommendationQuerySchema = z.object({
  context: z.enum(['home', 'product', 'cart', 'shop']),
  product_id: z.string().min(1).max(64).optional(),
  session_id: z.string().uuid(),
  user_id: z.string().min(1).max(128).optional(),
  limit: z.coerce.number().int().positive().max(20).default(8),
})

export const trendingQuerySchema = z.object({
  window: z.enum(['24h', '7d']).default('24h'),
  category: z.string().optional(),
  limit: z.coerce.number().int().positive().max(20).default(10),
})

export type RecommendationQueryInput = z.infer<typeof recommendationQuerySchema>
export type TrendingQueryInput = z.infer<typeof trendingQuerySchema>
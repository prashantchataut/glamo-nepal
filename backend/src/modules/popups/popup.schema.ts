import { z } from 'zod'

export const createPopupSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  type: z.enum(['PROMO', 'ANNOUNCEMENT', 'SURVEY']).default('PROMO'),
  position: z.enum(['CENTER', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'TOP']).default('CENTER'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const updatePopupSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  type: z.enum(['PROMO', 'ANNOUNCEMENT', 'SURVEY']).optional(),
  position: z.enum(['CENTER', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'TOP']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type CreatePopupInput = z.infer<typeof createPopupSchema>
export type UpdatePopupInput = z.infer<typeof updatePopupSchema>
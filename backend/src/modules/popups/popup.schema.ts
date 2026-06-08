import { z } from 'zod'

export const createPopupSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  triggerType: z.enum(['ON_LOAD', 'EXIT_INTENT', 'SCROLL_50', 'TIME_DELAY']).default('ON_LOAD'),
  delayMs: z.number().int().min(0).default(0),
  cookieDays: z.number().int().min(1).max(365).optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
})

export const updatePopupSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  triggerType: z.enum(['ON_LOAD', 'EXIT_INTENT', 'SCROLL_50', 'TIME_DELAY']).optional(),
  delayMs: z.number().int().min(0).optional(),
  cookieDays: z.number().int().min(1).max(365).optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type CreatePopupInput = z.infer<typeof createPopupSchema>
export type UpdatePopupInput = z.infer<typeof updatePopupSchema>
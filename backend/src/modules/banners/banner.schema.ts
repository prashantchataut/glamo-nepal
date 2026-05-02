import { z } from 'zod'

export const createBannerSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.string().max(500).optional(),
  link: z.string().optional(),
  position: z.string().default('hero'),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const updateBannerSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  subtitle: z.string().max(500).optional(),
  link: z.string().optional(),
  position: z.string().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const reorderBannersSchema = z.object({
  orders: z.array(z.object({ id: z.string(), order: z.number().int() })),
})

export type CreateBannerInput = z.infer<typeof createBannerSchema>
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>
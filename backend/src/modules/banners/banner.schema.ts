import { z } from 'zod'

export const createBannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.enum(['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP']).default('HERO'),
  sortOrder: z.number().int().default(0),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
})

export const updateBannerSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(300).optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  position: z.enum(['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP']).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
})

export const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  })),
})

export const bannerFilterSchema = z.object({
  position: z.enum(['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP']).optional(),
  page: z.coerce.number().int().positive().max(500).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type CreateBannerInput = z.infer<typeof createBannerSchema>
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>
export type ReorderInput = z.infer<typeof reorderSchema>
export type BannerFilterInput = z.infer<typeof bannerFilterSchema>
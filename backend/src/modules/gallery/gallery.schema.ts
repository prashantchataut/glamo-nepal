import { z } from 'zod'

export const createGalleryItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url(),
  category: z.enum(['instagram', 'store', 'products', 'team']).optional(),
  sortOrder: z.number().int().default(0),
})

export const updateGalleryItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  category: z.enum(['instagram', 'store', 'products', 'team']).optional(),
  sortOrder: z.number().int().optional(),
})

export const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  })),
})

export const galleryFilterSchema = z.object({
  category: z.enum(['instagram', 'store', 'products', 'team']).optional(),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type CreateGalleryItemInput = z.infer<typeof createGalleryItemSchema>
export type UpdateGalleryItemInput = z.infer<typeof updateGalleryItemSchema>
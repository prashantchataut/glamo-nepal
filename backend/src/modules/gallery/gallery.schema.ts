import { z } from 'zod'

export const createGalleryItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  altText: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export const updateGalleryItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  altText: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export const reorderGallerySchema = z.object({
  orders: z.array(z.object({ id: z.string(), order: z.number().int() })),
})

export type CreateGalleryItemInput = z.infer<typeof createGalleryItemSchema>
export type UpdateGalleryItemInput = z.infer<typeof updateGalleryItemSchema>
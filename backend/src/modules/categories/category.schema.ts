import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.number().int().min(0).max(1).optional(),
})

export const slugParamSchema = z.object({
  slug: z.string(),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})
import { z } from 'zod'

export const brandFilterSchema = z.object({
  isActive: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
})

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  description: z.string().optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
  website: z.string().url('Invalid URL').optional(),
})

export const updateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name cannot be empty').optional(),
  description: z.string().nullable().optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
  website: z.string().url('Invalid URL').nullable().optional(),
})

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
})

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})
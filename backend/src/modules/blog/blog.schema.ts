import { z } from 'zod'

export const createBlogPostSchema = z.object({
  title: z.string().min(1).max(500),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  category: z.string().max(100).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  tags: z.union([
    z.array(z.string()),
    z.string().transform(v => v.split(',').map(t => t.trim()).filter(Boolean)),
  ]).optional(),
})

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  category: z.string().max(100).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  tags: z.union([
    z.array(z.string()),
    z.string().transform(v => v.split(',').map(t => t.trim()).filter(Boolean)),
  ]).optional(),
  isPublished: z.boolean().optional(),
})

export const blogFilterSchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const slugParamSchema = z.object({
  slug: z.string(),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>
export type BlogFilterInput = z.infer<typeof blogFilterSchema>
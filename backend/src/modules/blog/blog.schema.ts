import { z } from 'zod'

export const createBlogPostSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(500).optional(),
  excerpt: z.string().max(1000).optional(),
  content: z.string().min(1),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  isPublished: z.boolean().default(false),
})

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(500).optional(),
  excerpt: z.string().max(1000).optional(),
  content: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  isPublished: z.boolean().optional(),
})

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>
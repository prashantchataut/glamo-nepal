import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { createBlogPostSchema, updateBlogPostSchema, blogFilterSchema } from './blog.schema'
import type { ZodSchema } from 'zod'
import {
  getBlogPosts,
  getBlogCategories,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  publishBlogPost,
  unpublishBlogPost,
  deleteBlogPost,
  uploadBlogCover,
} from './blog.controller'

const blogRoutes = new Hono<AppEnv>()

blogRoutes.get('/', validateQuery(blogFilterSchema as ZodSchema<any>), getBlogPosts)
blogRoutes.get('/categories', getBlogCategories)
blogRoutes.get('/:slug', getBlogPostBySlug)
blogRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createBlogPostSchema as ZodSchema<any>), createBlogPost)
blogRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateBlogPostSchema as ZodSchema<any>), updateBlogPost)
blogRoutes.patch('/:id/publish', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), publishBlogPost)
blogRoutes.patch('/:id/unpublish', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), unpublishBlogPost)
blogRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteBlogPost)
blogRoutes.post('/:id/cover', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), uploadBlogCover)

export { blogRoutes }
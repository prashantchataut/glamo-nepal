import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { publicReadRateLimit } from '../../middleware/rateLimit'
import { createBlogPostSchema, updateBlogPostSchema, blogFilterSchema } from './blog.schema'
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

blogRoutes.get('/', publicReadRateLimit, validateQuery(blogFilterSchema), getBlogPosts)
blogRoutes.get('/categories', publicReadRateLimit, getBlogCategories)
blogRoutes.get('/:slug', publicReadRateLimit, getBlogPostBySlug)
blogRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createBlogPostSchema), createBlogPost)
blogRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateBlogPostSchema), updateBlogPost)
blogRoutes.patch('/:id/publish', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), publishBlogPost)
blogRoutes.patch('/:id/unpublish', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), unpublishBlogPost)
blogRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteBlogPost)
blogRoutes.post('/:id/cover', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), uploadBlogCover)

export { blogRoutes }
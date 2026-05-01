import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody } from '../../middleware/validate'
import { createCategorySchema, updateCategorySchema } from './category.schema'
import {
  getCategoryTree,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from './category.controller'

const categoryRoutes = new Hono<AppEnv>()

categoryRoutes.get('/', getCategoryTree)
categoryRoutes.get('/:slug', getCategoryBySlug)

categoryRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createCategorySchema), createCategory)
categoryRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateCategorySchema), updateCategory)
categoryRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteCategory)
categoryRoutes.post('/:id/image', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), uploadCategoryImage)

export { categoryRoutes }
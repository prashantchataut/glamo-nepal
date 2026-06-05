import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody } from '../../middleware/validate'
import { createBrandSchema, updateBrandSchema } from './brand.schema'
import {
  getAllBrands,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand,
} from './brand.controller'

const brandRoutes = new Hono<AppEnv>()

brandRoutes.get('/', getAllBrands)
brandRoutes.get('/:slug', getBrandBySlug)
brandRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createBrandSchema), createBrand)
brandRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateBrandSchema), updateBrand)
brandRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteBrand)

export { brandRoutes }
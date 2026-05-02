import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { createBannerSchema, updateBannerSchema, reorderSchema, bannerFilterSchema } from './banner.schema'
import type { ZodSchema } from 'zod'
import {
  getBanners,
  getBannersByPosition,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from './banner.controller'

const bannerRoutes = new Hono<AppEnv>()

bannerRoutes.get('/', getBanners)
bannerRoutes.get('/position/:pos', getBannersByPosition)
bannerRoutes.get('/admin', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateQuery(bannerFilterSchema as ZodSchema<any>), getAllBanners)
bannerRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createBannerSchema as ZodSchema<any>), createBanner)
bannerRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateBannerSchema as ZodSchema<any>), updateBanner)
bannerRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteBanner)
bannerRoutes.patch('/reorder', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(reorderSchema as ZodSchema<any>), reorderBanners)

export { bannerRoutes }
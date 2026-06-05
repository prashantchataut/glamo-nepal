import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { createBannerSchema, updateBannerSchema, reorderSchema, bannerFilterSchema } from './banner.schema'
import {
  getBanners,
  getBannersByPosition,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  uploadBannerImage,
} from './banner.controller'

const bannerRoutes = new Hono<AppEnv>()

bannerRoutes.get('/', getBanners)
bannerRoutes.get('/position/:pos', getBannersByPosition)
bannerRoutes.get('/admin', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateQuery(bannerFilterSchema), getAllBanners)
bannerRoutes.post('/upload', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), uploadBannerImage)
bannerRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createBannerSchema), createBanner)
bannerRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateBannerSchema), updateBanner)
bannerRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteBanner)
bannerRoutes.patch('/reorder', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(reorderSchema), reorderBanners)

export { bannerRoutes }
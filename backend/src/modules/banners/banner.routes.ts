import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody } from '../../middleware/validate'
import { createBannerSchema, updateBannerSchema, reorderBannersSchema } from './banner.schema'
import type { ZodSchema } from 'zod'
import {
  getBanners,
  getBannersByPosition,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from './banner.controller'

const bannerRoutes = new Hono<AppEnv>()

bannerRoutes.get('/', getBanners)
bannerRoutes.get('/position/:pos', getBannersByPosition)
bannerRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createBannerSchema as ZodSchema<any>), createBanner)
bannerRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateBannerSchema as ZodSchema<any>), updateBanner)
bannerRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteBanner)
bannerRoutes.patch('/reorder', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(reorderBannersSchema as ZodSchema<any>), reorderBanners)

export { bannerRoutes }
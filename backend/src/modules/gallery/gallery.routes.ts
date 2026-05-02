import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody } from '../../middleware/validate'
import { createGalleryItemSchema, updateGalleryItemSchema, reorderGallerySchema } from './gallery.schema'
import type { ZodSchema } from 'zod'
import {
  getGallery,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  reorderGallery,
} from './gallery.controller'

const galleryRoutes = new Hono<AppEnv>()

galleryRoutes.get('/', getGallery)
galleryRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createGalleryItemSchema as ZodSchema<any>), createGalleryItem)
galleryRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateGalleryItemSchema as ZodSchema<any>), updateGalleryItem)
galleryRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteGalleryItem)
galleryRoutes.patch('/reorder', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(reorderGallerySchema as ZodSchema<any>), reorderGallery)

export { galleryRoutes }
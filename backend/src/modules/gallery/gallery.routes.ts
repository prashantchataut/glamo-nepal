import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { createGalleryItemSchema, updateGalleryItemSchema, reorderSchema, galleryFilterSchema } from './gallery.schema'
import {
  getGallery,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  reorderGallery,
} from './gallery.controller'

const galleryRoutes = new Hono<AppEnv>()

galleryRoutes.get('/', validateQuery(galleryFilterSchema), getGallery)
galleryRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createGalleryItemSchema), createGalleryItem)
galleryRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateGalleryItemSchema), updateGalleryItem)
galleryRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteGalleryItem)
galleryRoutes.patch('/reorder', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(reorderSchema), reorderGallery)

export { galleryRoutes }
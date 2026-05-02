import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody } from '../../middleware/validate'
import { createPopupSchema, updatePopupSchema } from './popup.schema'
import type { ZodSchema } from 'zod'
import {
  getActivePopups,
  getPopups,
  createPopup,
  updatePopup,
  deletePopup,
} from './popup.controller'

const popupRoutes = new Hono<AppEnv>()

popupRoutes.get('/active', getActivePopups)
popupRoutes.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getPopups)
popupRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createPopupSchema as ZodSchema<any>), createPopup)
popupRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updatePopupSchema as ZodSchema<any>), updatePopup)
popupRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deletePopup)

export { popupRoutes }
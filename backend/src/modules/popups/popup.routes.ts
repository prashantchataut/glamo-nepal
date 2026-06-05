import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody } from '../../middleware/validate'
import { createPopupSchema, updatePopupSchema } from './popup.schema'
import {
  getActivePopup,
  getAllPopups,
  createPopup,
  updatePopup,
  deletePopup,
} from './popup.controller'

const popupRoutes = new Hono<AppEnv>()

popupRoutes.get('/active', getActivePopup)
popupRoutes.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getAllPopups)
popupRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createPopupSchema), createPopup)
popupRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updatePopupSchema), updatePopup)
popupRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deletePopup)

export { popupRoutes }
import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody } from '../../middleware/validate'
import { updateSettingsSchema } from './settings.schema'
import {
  getPublicSettings,
  getSettings,
  updateSettings,
} from './settings.controller'

const settingsRoutes = new Hono<AppEnv>()

settingsRoutes.get('/public', getPublicSettings)
settingsRoutes.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getSettings)
settingsRoutes.patch('/', authMiddleware, requireRole(['SUPER_ADMIN']), validateBody(updateSettingsSchema), updateSettings)

export { settingsRoutes }
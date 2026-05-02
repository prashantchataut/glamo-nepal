import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody } from '../../middleware/validate'
import { subscribeSchema } from './newsletter.schema'
import type { ZodSchema } from 'zod'
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  exportSubscribers,
  deleteSubscriber,
} from './newsletter.controller'

const newsletterRoutes = new Hono<AppEnv>()

newsletterRoutes.post('/subscribe', validateBody(subscribeSchema as ZodSchema<any>), subscribe)
newsletterRoutes.get('/unsubscribe', unsubscribe)
newsletterRoutes.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getSubscribers)
newsletterRoutes.get('/export', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), exportSubscribers)
newsletterRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteSubscriber)

export { newsletterRoutes }
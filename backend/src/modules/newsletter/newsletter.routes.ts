import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { rateLimit } from '../../middleware/rateLimit'
import { subscribeSchema, subscriberFilterSchema } from './newsletter.schema'
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  exportSubscribers,
  deleteSubscriber,
} from './newsletter.controller'

const newsletterRoutes = new Hono<AppEnv>()

const subscribeRateLimit = rateLimit({
  max: 3,
  window: 3600,
  keyGenerator: (c) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
    return `newsletter:subscribe:${ip}`
  },
})

newsletterRoutes.post('/subscribe', subscribeRateLimit, validateBody(subscribeSchema), subscribe)
newsletterRoutes.get('/unsubscribe', unsubscribe)
newsletterRoutes.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateQuery(subscriberFilterSchema), getSubscribers)
newsletterRoutes.get('/export', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), exportSubscribers)
newsletterRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteSubscriber)

export { newsletterRoutes }
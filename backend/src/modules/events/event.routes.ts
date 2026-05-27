import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { validateBody } from '../../middleware/validate'
import { eventRateLimit } from '../../middleware/rateLimit'
import { trackEventsSchema } from './event.schema'
import { trackEvents } from './event.controller'

const eventRoutes = new Hono<AppEnv>()

eventRoutes.post('/', eventRateLimit, validateBody(trackEventsSchema), trackEvents)

export { eventRoutes }
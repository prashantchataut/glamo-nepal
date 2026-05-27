import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { validateBody } from '../../middleware/validate'
import { trackEventsSchema } from './event.schema'
import { trackEvents } from './event.controller'

const eventRoutes = new Hono<AppEnv>()

eventRoutes.post('/', validateBody(trackEventsSchema), trackEvents)

export { eventRoutes }
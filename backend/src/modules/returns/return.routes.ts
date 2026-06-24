import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { createReturnSchema, returnFilterSchema, updateReturnSchema } from './return.schema'
import { createReturn, getReturns, updateReturn } from './return.controller'

const returnRoutes = new Hono<AppEnv>()

returnRoutes.use('*', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']))
returnRoutes.get('/', validateQuery(returnFilterSchema), getReturns)
returnRoutes.post('/', validateBody(createReturnSchema), createReturn)
returnRoutes.patch('/:id', validateBody(updateReturnSchema), updateReturn)

export { returnRoutes }

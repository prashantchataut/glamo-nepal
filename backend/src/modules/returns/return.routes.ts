import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { createReturnSchema, returnFilterSchema, updateReturnSchema } from './return.schema'
import { createReturn, getReturns, updateReturn } from './return.controller'

const returnRoutes = new Hono<AppEnv>()

// Customers can create return requests for their own orders.
// They must be authenticated so we know who is requesting the return.
returnRoutes.post('/', authMiddleware, validateBody(createReturnSchema), createReturn)

// Admin-only: list all returns, update return status.
returnRoutes.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateQuery(returnFilterSchema), getReturns)
returnRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateReturnSchema), updateReturn)

export { returnRoutes }

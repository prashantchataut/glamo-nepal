import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody } from '../../middleware/validate'
import { paymentRateLimit, orderTrackingRateLimit } from '../../middleware/rateLimit'
import { optionalAuthMiddleware } from '../../middleware/optional-auth'
import { createOrderSchema, updateOrderStatusSchema } from './order.schema'
import { createOrder, verifyCheckoutPayment, listOrders, getOrder, getPublicOrder, updateOrderStatus, cancelOrder, initiateKhaltiPaymentController, initiateEsewaPaymentController } from './order.controller'

const orderRoutes = new Hono<AppEnv>()
const checkoutRoutes = new Hono<AppEnv>()

checkoutRoutes.post('/orders', optionalAuthMiddleware, paymentRateLimit, validateBody(createOrderSchema), createOrder)
checkoutRoutes.post('/orders/:id/payments/:provider/verify', optionalAuthMiddleware, paymentRateLimit, verifyCheckoutPayment)
checkoutRoutes.post('/orders/:id/payments/khalti/initiate', optionalAuthMiddleware, paymentRateLimit, initiateKhaltiPaymentController)
checkoutRoutes.post('/orders/:id/payments/esewa/initiate', optionalAuthMiddleware, paymentRateLimit, initiateEsewaPaymentController)
checkoutRoutes.get('/track/:orderNumber', orderTrackingRateLimit, getPublicOrder)

orderRoutes.use('*', authMiddleware)
orderRoutes.get('/', listOrders)
orderRoutes.get('/:id', getOrder)
orderRoutes.post('/:id/cancel', cancelOrder)
orderRoutes.patch('/:id/status', requireRole(['ADMIN', 'SUPER_ADMIN', 'STAFF']), validateBody(updateOrderStatusSchema), updateOrderStatus)

export { orderRoutes, checkoutRoutes }
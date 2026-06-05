import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { couponRateLimit } from '../../middleware/rateLimit'
import { createCouponSchema, updateCouponSchema, validateCouponSchema, applyCouponSchema, couponFilterSchema } from './coupon.schema'
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCouponCode,
  applyCoupon,
} from './coupon.controller'

const couponRoutes = new Hono<AppEnv>()

couponRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createCouponSchema), createCoupon)
couponRoutes.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateQuery(couponFilterSchema), getCoupons)
couponRoutes.get('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getCouponById)
couponRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateCouponSchema), updateCoupon)
couponRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteCoupon)
couponRoutes.post('/validate', couponRateLimit, validateBody(validateCouponSchema), validateCouponCode)
couponRoutes.post('/apply', authMiddleware, couponRateLimit, validateBody(applyCouponSchema), applyCoupon)

export { couponRoutes }
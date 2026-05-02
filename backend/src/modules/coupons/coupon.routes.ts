import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { createCouponSchema, updateCouponSchema, validateCouponSchema, applyCouponSchema, couponFilterSchema } from './coupon.schema'
import type { ZodSchema } from 'zod'
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

couponRoutes.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(createCouponSchema as ZodSchema<any>), createCoupon)
couponRoutes.get('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateQuery(couponFilterSchema as ZodSchema<any>), getCoupons)
couponRoutes.get('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getCouponById)
couponRoutes.patch('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateBody(updateCouponSchema as ZodSchema<any>), updateCoupon)
couponRoutes.delete('/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteCoupon)
couponRoutes.post('/validate', validateBody(validateCouponSchema as ZodSchema<any>), validateCouponCode)
couponRoutes.post('/apply', authMiddleware, validateBody(applyCouponSchema as ZodSchema<any>), applyCoupon)

export { couponRoutes }
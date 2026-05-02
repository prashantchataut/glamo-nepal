import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody } from '../../middleware/validate'
import { createReviewSchema, updateReviewSchema } from './review.schema'
import type { ZodSchema } from 'zod'
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getAdminReviews,
  approveReview,
  rejectReview,
} from './review.controller'

const reviewRoutes = new Hono<AppEnv>()

reviewRoutes.get('/product/:productId', getProductReviews)
reviewRoutes.post('/', authMiddleware, validateBody(createReviewSchema as ZodSchema<any>), createReview)
reviewRoutes.patch('/:id', authMiddleware, validateBody(updateReviewSchema as ZodSchema<any>), updateReview)
reviewRoutes.delete('/:id', authMiddleware, deleteReview)
reviewRoutes.get('/admin', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), getAdminReviews)
reviewRoutes.patch('/admin/:id/approve', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), approveReview)
reviewRoutes.patch('/admin/:id/reject', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), rejectReview)

export { reviewRoutes }
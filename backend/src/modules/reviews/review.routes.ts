import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/firebase-auth'
import { requireRole } from '../../middleware/requireRole'
import { validateBody, validateQuery } from '../../middleware/validate'
import { reviewRateLimit } from '../../middleware/rateLimit'
import { createReviewSchema, updateReviewSchema, reviewFilterSchema } from './review.schema'
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
reviewRoutes.post('/', authMiddleware, reviewRateLimit, validateBody(createReviewSchema), createReview)
reviewRoutes.patch('/:id', authMiddleware, validateBody(updateReviewSchema), updateReview)
reviewRoutes.delete('/:id', authMiddleware, deleteReview)
reviewRoutes.delete('/admin/:id', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteReview)
reviewRoutes.get('/admin', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateQuery(reviewFilterSchema), getAdminReviews)
reviewRoutes.patch('/admin/:id/approve', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), approveReview)
reviewRoutes.patch('/admin/:id/reject', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), rejectReview)

export { reviewRoutes }
import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { validateBody } from '../../middleware/validate'
import { addToWishlistSchema } from './wishlist.schema'
import type { ZodSchema } from 'zod'
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistItem,
} from './wishlist.controller'

const wishlistRoutes = new Hono<AppEnv>()

wishlistRoutes.get('/', authMiddleware, getWishlist)
wishlistRoutes.post('/', authMiddleware, validateBody(addToWishlistSchema as ZodSchema<any>), addToWishlist)
wishlistRoutes.delete('/:productId', authMiddleware, removeFromWishlist)
wishlistRoutes.get('/check/:productId', authMiddleware, checkWishlistItem)

export { wishlistRoutes }
import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { validateBody } from '../../middleware/validate'
import { addToWishlistSchema } from './wishlist.schema'
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistItem,
} from './wishlist.controller'

const wishlistRoutes = new Hono<AppEnv>()

wishlistRoutes.get('/', authMiddleware, getWishlist)
wishlistRoutes.post('/', authMiddleware, validateBody(addToWishlistSchema), addToWishlist)
wishlistRoutes.delete('/:productId', authMiddleware, removeFromWishlist)
wishlistRoutes.get('/check/:productId', authMiddleware, checkWishlistItem)

export { wishlistRoutes }
import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { validateBody } from '../../middleware/validate'
import { addToCartSchema, updateCartItemSchema } from './cart.schema'
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from './cart.controller'

const cartRoutes = new Hono<AppEnv>()

cartRoutes.get('/', authMiddleware, getCart)
cartRoutes.post('/', authMiddleware, validateBody(addToCartSchema), addToCart)
cartRoutes.patch('/:id', authMiddleware, validateBody(updateCartItemSchema), updateCartItem)
cartRoutes.delete('/:id', authMiddleware, removeCartItem)
cartRoutes.delete('/', authMiddleware, clearCart)

export { cartRoutes }
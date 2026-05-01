import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'

const productRoutes = new Hono<AppEnv>()

export { productRoutes }
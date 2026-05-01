import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'

const inventoryRoutes = new Hono<AppEnv>()

export { inventoryRoutes }
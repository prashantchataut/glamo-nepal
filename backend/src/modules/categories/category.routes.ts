import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'

const categoryRoutes = new Hono<AppEnv>()

export { categoryRoutes }
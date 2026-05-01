import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'

const brandRoutes = new Hono<AppEnv>()

export { brandRoutes }
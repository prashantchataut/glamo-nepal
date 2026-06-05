import { createMiddleware } from 'hono/factory'
import { createTursoClient } from '../config/turso'
import type { AppEnv } from '../types/bindings'

export const tursoMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const client = createTursoClient(c.env.TURSO_DB_URL, c.env.TURSO_AUTH_TOKEN)
  c.set('db', client)
  await next()
})
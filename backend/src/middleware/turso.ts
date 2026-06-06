import { createMiddleware } from 'hono/factory'
import { createTursoClient } from '../config/turso'
import { getEnv } from '../utils/env'
import type { AppEnv } from '../types/bindings'

export const tursoMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const url = getEnv(c, 'TURSO_DB_URL')
  const token = getEnv(c, 'TURSO_AUTH_TOKEN')
  const client = createTursoClient(url, token)
  c.set('db', client)
  await next()
})
import { createMiddleware } from 'hono/factory'
import { createSupabaseAdminClient } from '../config/supabase'
import type { AppEnv } from '../types/bindings'

export const supabaseMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const client = createSupabaseAdminClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
  c.set('supabase', client)
  await next()
})
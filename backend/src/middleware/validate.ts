import { z } from 'zod'
import type { Context } from 'hono'
import type { AppEnv } from '../types/bindings'

function formatErrors(errors: { path: (string | number)[]; message: string }[]): string[] {
  return errors.map(e => `${e.path.join('.')}: ${e.message}`)
}

export function validateBody(schema: z.ZodTypeAny) {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    const body = await c.req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return c.json({
        success: false,
        message: 'Validation failed',
        errors: formatErrors(result.error.errors),
      }, 400)
    }
    c.set('validatedBody', result.data)
    await next()
  }
}

export function validateQuery(schema: z.ZodTypeAny) {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    const query = c.req.query()
    const result = schema.safeParse(query)
    if (!result.success) {
      return c.json({
        success: false,
        message: 'Validation failed',
        errors: formatErrors(result.error.errors),
      }, 400)
    }
    c.set('validatedQuery', result.data)
    await next()
  }
}

export function validateParams(schema: z.ZodTypeAny) {
  return async (c: Context<AppEnv>, next: () => Promise<void>) => {
    const params = c.req.param()
    const result = schema.safeParse(params)
    if (!result.success) {
      return c.json({
        success: false,
        message: 'Validation failed',
        errors: formatErrors(result.error.errors),
      }, 400)
    }
    c.set('validatedParams', result.data)
    await next()
  }
}
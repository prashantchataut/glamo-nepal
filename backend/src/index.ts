import { Hono } from 'hono'
import type { AppEnv } from './types/bindings'

const app = new Hono<AppEnv>()

app.get('/api/v1/health', (c) => {
  return c.json({
    success: true,
    message: 'GLAMO Nepal API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    pagination: null,
  })
})

export default app
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import type { AppEnv } from './types/bindings'
import { generalRateLimit } from './middleware/rateLimit'
import { authRoutes } from './modules/auth/auth.routes'
import { categoryRoutes } from './modules/categories/category.routes'
import { brandRoutes } from './modules/brands/brand.routes'
import { productRoutes } from './modules/products/product.routes'
import { inventoryRoutes } from './modules/inventory/inventory.routes'

const app = new Hono<AppEnv>()

app.use('*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400,
}))

app.use('*', logger())

app.use('*', secureHeaders())

app.use('*', generalRateLimit)

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({
    success: false,
    message: err.message || 'Internal server error',
    errors: [],
  }, 500)
})

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

app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/categories', categoryRoutes)
app.route('/api/v1/brands', brandRoutes)
app.route('/api/v1/products', productRoutes)
app.route('/api/v1/inventory', inventoryRoutes)

app.notFound((c) => {
  return c.json({
    success: false,
    message: `Route not found: ${c.req.method} ${c.req.path}`,
    errors: [],
  }, 404)
})

export default app
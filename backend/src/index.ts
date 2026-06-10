import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import type { AppEnv } from './types/bindings'
import { generalRateLimit } from './middleware/rateLimit'
import { tursoMiddleware } from './middleware/turso'
import { csrfProtection } from './middleware/csrf'
import { idempotencyGuard } from './middleware/idempotency'
import { authRoutes } from './modules/auth/auth.routes'
import { accountRoutes } from './modules/account/account.routes'
import { categoryRoutes } from './modules/categories/category.routes'
import { brandRoutes } from './modules/brands/brand.routes'
import { productRoutes } from './modules/products/product.routes'
import { inventoryRoutes } from './modules/inventory/inventory.routes'
import { cartRoutes } from './modules/cart/cart.routes'
import { wishlistRoutes } from './modules/wishlist/wishlist.routes'
import { couponRoutes } from './modules/coupons/coupon.routes'
import { orderRoutes, checkoutRoutes } from './modules/orders/order.routes'
import { reviewRoutes } from './modules/reviews/review.routes'
import { bannerRoutes } from './modules/banners/banner.routes'
import { popupRoutes } from './modules/popups/popup.routes'
import { blogRoutes } from './modules/blog/blog.routes'
import { galleryRoutes } from './modules/gallery/gallery.routes'
import { teamRoutes } from './modules/team/team.routes'
import { newsletterRoutes } from './modules/newsletter/newsletter.routes'
import { settingsRoutes } from './modules/settings/settings.routes'
import { adminRoutes } from './modules/admin/admin.routes'
import { eventRoutes } from './modules/events/event.routes'
import { recommendationRoutes } from './modules/recommendations/recommendation.routes'
import { contactRoutes } from './modules/contact/contact.routes'
import { openApiSpec } from './docs/openapi'

const app = new Hono<AppEnv>()

const PRODUCTION_ORIGINS = [process.env.FRONTEND_URL || 'https://glamonepal.com', `www.${process.env.FRONTEND_URL?.replace(/^https?:\/\//, '') || 'www.glamonepal.com'}`]
const DEVELOPMENT_ORIGINS = ['http://localhost:3000', 'http://localhost:3001']
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const ALLOWED_ORIGINS = IS_PRODUCTION ? PRODUCTION_ORIGINS : [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS]

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return ''
    return ALLOWED_ORIGINS.includes(origin) ? origin : ''
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key'],
  exposeHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400,
}))

app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', tursoMiddleware)
app.use('*', generalRateLimit)
app.use('*', csrfProtection())
app.use('*', idempotencyGuard())

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (err.message || 'Internal server error')
  return c.json({
    success: false,
    message,
    errors: [],
  }, 500)
})

app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'GLAMO Nepal API is running',
    data: { status: 'healthy', timestamp: new Date().toISOString(), version: '2.0.0' },
    pagination: null,
  })
})

app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/account', accountRoutes)
app.route('/api/v1/categories', categoryRoutes)
app.route('/api/v1/brands', brandRoutes)
app.route('/api/v1/products', productRoutes)
app.route('/api/v1/inventory', inventoryRoutes)
app.route('/api/v1/cart', cartRoutes)
app.route('/api/v1/wishlist', wishlistRoutes)
app.route('/api/v1/coupons', couponRoutes)
app.route('/api/v1/orders', orderRoutes)
app.route('/api/v1/checkout', checkoutRoutes)
app.route('/api/v1/reviews', reviewRoutes)
app.route('/api/v1/banners', bannerRoutes)
app.route('/api/v1/popups', popupRoutes)
app.route('/api/v1/blogs', blogRoutes)
app.route('/api/v1/gallery', galleryRoutes)
app.route('/api/v1/team', teamRoutes)
app.route('/api/v1/newsletter', newsletterRoutes)
app.route('/api/v1/settings', settingsRoutes)
app.route('/api/v1/admin', adminRoutes)
app.route('/api/v1/events', eventRoutes)
app.route('/api/v1/recommendations', recommendationRoutes)
app.route('/api/v1/contact', contactRoutes)

if (!IS_PRODUCTION) {
  app.get('/api/docs.json', (c) => c.json(openApiSpec))
  app.get('/api/docs', (c) => {
    return c.html(`<!DOCTYPE html>
<html>
<head>
  <title>GLAMO Nepal API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: '/api/docs.json', dom_id: '#swagger-ui' })
  </script>
</body>
</html>`)
  })
}

app.notFound((c) => {
  return c.json({
    success: false,
    message: `Route not found: ${c.req.method} ${c.req.path}`,
    errors: [],
  }, 404)
})

export default app
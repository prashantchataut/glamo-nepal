import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import type { AppEnv } from './types/bindings'
import { generalRateLimit } from './middleware/rateLimit'
import { supabaseMiddleware } from './middleware/supabase'
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
import { openApiSpec } from './docs/openapi'

const app = new Hono<AppEnv>()

app.use('*', cors({
  origin: (origin) => {
    const allowed = ['http://localhost:3000', 'https://glamonepal.com', 'https://www.glamonepal.com']
    return allowed.includes(origin) ? origin : 'http://localhost:3000'
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key'],
  exposeHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400,
}))

app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', async (c, next) => {
  await next()
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self' https://api.glamonepal.com https://res.cloudinary.com", { append: false })
  c.header('X-Content-Type-Options', 'nosniff', { append: false })
  c.header('X-Frame-Options', 'DENY', { append: false })
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin', { append: false })
})
app.use('*', supabaseMiddleware)
app.use('*', generalRateLimit)

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  const isDev = !c.env?.SUPABASE_URL || c.env.SUPABASE_URL.includes('localhost')
  return c.json({
    success: false,
    message: isDev ? err.message : 'Internal server error',
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

app.notFound((c) => {
  return c.json({
    success: false,
    message: `Route not found: ${c.req.method} ${c.req.path}`,
    errors: [],
  }, 404)
})

export default app
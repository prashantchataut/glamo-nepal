# GLAMO Nepal API — Production Checklist

## Supabase Setup

- [ ] Create Supabase project at https://supabase.com
- [ ] Copy project URL and service role key
- [ ] Run migration `0001_initial_schema.sql` in Supabase SQL Editor
- [ ] Run seed data `0002_seed_data.sql` in Supabase SQL Editor
- [ ] Verify all tables created: check Table Editor in Supabase dashboard
- [ ] Create admin user via Supabase Auth signup
- [ ] Update admin profile role: `UPDATE profiles SET role = 'SUPER_ADMIN' WHERE email = '<your-admin-email>';`
- [ ] Configure Supabase Auth: set site URL to production frontend URL
- [ ] Configure Supabase Auth: add email templates for verification and password reset

## Cloudflare Resources

- [ ] Create KV namespace: `wrangler kv:namespace create "GLAMO_KV"`
- [ ] Update KV `id` in `wrangler.toml`
- [ ] KV namespace created and ID set in wrangler.toml (run `wrangler kv namespace create RATE_LIMITS`)
- [ ] Create R2 bucket: `wrangler r2 bucket create glamo-nepal-assets`
- [ ] Enable R2.dev subdomain or custom domain for public access
- [ ] Configure custom domain for Worker (e.g., `api.glamonepal.com`)

## Environment Variables (Wrangler Secrets)

- [ ] Set `SUPABASE_URL`: `wrangler secret put SUPABASE_URL`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`: `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set `RESEND_API_KEY` for transactional emails
- [ ] Set `KHALTI_SECRET_KEY` for Khalti payments
- [ ] Set `ESEWA_SECRET_KEY` and `ESEWA_MERCHANT_CODE` for eSewa payments
- [ ] Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] Set `R2_PUBLIC_URL` for image CDN

## Configuration

- [ ] Update `FRONTEND_URL` in `wrangler.toml` to production URL
- [ ] Update `FREE_SHIPPING_THRESHOLD` in `wrangler.toml` (currently 2500 NPR)
- [ ] Update `COD_FEE` in `wrangler.toml` (currently 50 NPR)
- [ ] Set `ADMIN_EMAIL` via `wrangler secret put ADMIN_EMAIL` (remove from wrangler.toml vars)
- [ ] Verify CORS origin matches frontend domain

## Architecture Validation

- [ ] Supabase Edge Function API routes removed (only payment/email functions remain)
- [ ] Convex removed from frontend and backend
- [ ] All API routes verified on Hono backend
- [ ] Rate limiting verified working with KV
- [ ] CORS origins set to production domains

## Security

- [ ] Supabase Auth handles JWT (no custom JWT keys needed)
- [ ] HTTP-only, Secure, SameSite cookies configured
- [ ] CORS restricted to production frontend URL only
- [ ] CSP headers configured (Content-Security-Policy)
- [ ] Admin routes protected by `requireRole(['ADMIN', 'SUPER_ADMIN'])`
- [ ] SuperAdmin-only routes protected by `requireRole(['SUPER_ADMIN'])`
- [ ] Response sanitization: no password_hash or refresh_token in responses
- [ ] Error messages: no stack traces or DB details in production
- [ ] Idempotency keys supported on payment endpoints (X-Idempotency-Key header)
- [ ] Rate limiting active (KV-based, using RATE_LIMITS namespace)

## API Endpoints (All ~120)

### Auth
- [ ] POST /api/v1/auth/register — Supabase Auth signup
- [ ] POST /api/v1/auth/login — Supabase Auth login
- [ ] POST /api/v1/auth/refresh — Token refresh
- [ ] POST /api/v1/auth/logout — Sign out
- [ ] POST /api/v1/auth/forgot-password — Reset password email
- [ ] POST /api/v1/auth/reset-password — Set new password
- [ ] GET /api/v1/auth/me — Get current user profile

### Account
- [ ] GET /api/v1/account/profile — User profile + counts
- [ ] PATCH /api/v1/account/profile — Update name/phone
- [ ] POST /api/v1/account/avatar — Upload avatar
- [ ] GET /api/v1/account/addresses — List addresses
- [ ] POST /api/v1/account/addresses — Create address
- [ ] PATCH /api/v1/account/addresses/:id — Update address
- [ ] DELETE /api/v1/account/addresses/:id — Delete address
- [ ] PATCH /api/v1/account/addresses/:id/default — Set default

### Products & Catalog
- [ ] GET /api/v1/categories — Category tree
- [ ] GET /api/v1/categories/:slug — Category detail
- [ ] POST/PATCH/DELETE /api/v1/categories — Admin CRUD
- [ ] GET /api/v1/brands — Brand list
- [ ] GET /api/v1/brands/:slug — Brand detail
- [ ] POST/PATCH/DELETE /api/v1/brands — Admin CRUD
- [ ] GET /api/v1/products — Product listing with filters
- [ ] GET /api/v1/products/:slug — Product detail
- [ ] POST/PATCH/DELETE /api/v1/products — Admin CRUD
- [ ] GET /api/v1/inventory/report — Stock report
- [ ] GET /api/v1/inventory/logs — Inventory logs

### Shopping
- [ ] GET /api/v1/cart — Get cart
- [ ] POST /api/v1/cart — Add to cart
- [ ] PATCH /api/v1/cart/:id — Update cart item
- [ ] DELETE /api/v1/cart/:id — Remove cart item
- [ ] DELETE /api/v1/cart — Clear cart
- [ ] GET /api/v1/wishlist — Get wishlist
- [ ] POST /api/v1/wishlist — Add to wishlist
- [ ] DELETE /api/v1/wishlist/:productId — Remove from wishlist
- [ ] GET /api/v1/wishlist/check/:productId — Check wishlist
- [ ] POST /api/v1/coupons/validate — Validate coupon
- [ ] POST /api/v1/coupons/apply — Apply coupon
- [ ] Admin coupon CRUD

### Orders & Payments
- [ ] POST /api/v1/checkout/orders — Create order
- [ ] POST /api/v1/checkout/orders/:id/payments/:provider/verify — Verify payment
- [ ] GET /api/v1/orders — List orders
- [ ] GET /api/v1/orders/:id — Order detail
- [ ] POST /api/v1/orders/:id/cancel — Cancel order
- [ ] PATCH /api/v1/orders/:id/status — Update status (admin)

### Reviews
- [ ] GET /api/v1/reviews/product/:productId — Product reviews
- [ ] POST /api/v1/reviews — Create review
- [ ] PATCH /api/v1/reviews/:id — Update own review
- [ ] DELETE /api/v1/reviews/:id — Delete own review
- [ ] Admin review management

### CMS
- [ ] GET /api/v1/banners — Active banners
- [ ] Admin banner CRUD + reorder
- [ ] GET /api/v1/popups/active — Active popup
- [ ] Admin popup CRUD
- [ ] GET /api/v1/blogs — Published blogs
- [ ] GET /api/v1/blogs/:slug — Blog detail
- [ ] Admin blog CRUD + publish/unpublish
- [ ] GET /api/v1/gallery — Gallery items
- [ ] Admin gallery CRUD + reorder
- [ ] GET /api/v1/team — Team members
- [ ] Admin team CRUD

### Newsletter
- [ ] POST /api/v1/newsletter/subscribe — Subscribe
- [ ] GET /api/v1/newsletter/unsubscribe — Unsubscribe via token
- [ ] Admin subscriber list + CSV export

### Settings
- [ ] GET /api/v1/settings/public — Public settings (cached)
- [ ] GET /api/v1/settings — All settings (admin)
- [ ] PATCH /api/v1/settings — Update settings (superAdmin)

### Admin Dashboard
- [ ] GET /api/v1/admin/dashboard — Dashboard stats (cached 5min)
- [ ] GET /api/v1/admin/sales-report — Sales report
- [ ] GET /api/v1/admin/notifications — Notifications
- [ ] PATCH /api/v1/admin/notifications/:id/read — Mark read
- [ ] PATCH /api/v1/admin/notifications/read-all — Mark all read
- [ ] GET /api/v1/admin/audit-logs — Audit logs (superAdmin)
- [ ] GET /api/v1/admin/users — User management
- [ ] PATCH /api/v1/admin/users/:id/role — Change role (superAdmin)
- [ ] PATCH /api/v1/admin/users/:id/status — Activate/deactivate

### Documentation
- [ ] GET /api/docs.json — OpenAPI spec
- [ ] GET /api/docs — Swagger UI

### Health
- [ ] GET /health — Health check

## Testing

- [ ] Auth registration works with Supabase
- [ ] Auth login returns access token and refresh token
- [ ] Protected routes reject unauthenticated requests
- [ ] Admin routes reject non-admin users
- [ ] SuperAdmin-only routes reject admin users
- [ ] Category/brand/product listing with filters works
- [ ] Image upload to Cloudinary works
- [ ] KV caching works (check response times)
- [ ] Rate limiting works (429 after limit exceeded)
- [ ] Cart and wishlist operations work
- [ ] Order creation and payment verification work
- [ ] Newsletter subscribe/unsubscribe work
- [ ] Settings public endpoint returns only allowed keys
- [ ] Dashboard stats aggregate correctly

## Email

- [ ] Resend API key is valid
- [ ] Supabase Auth emails configured (verification, password reset)
- [ ] Order confirmation emails send (via Resend)
- [ ] Newsletter welcome email sends (via Resend)

## Payments

- [ ] Khalti integration configured
- [ ] eSewa integration configured
- [ ] Cash on delivery works
- [ ] Idempotency keys prevent duplicate payments

## Post-Deployment

- [ ] Monitor Worker logs: `wrangler tail`
- [ ] Check Supabase dashboard for query performance
- [ ] Verify KV cache hit rate
- [ ] Test full auth flow end-to-end
- [ ] Test product CRUD as admin
- [ ] Verify image upload and deletion
- [ ] Check inventory reports
- [ ] Verify all ~120 endpoints respond correctly
- [ ] Run `tsc --noEmit` — zero TypeScript errors
- [ ] Run `wrangler deploy` — deployment succeeds
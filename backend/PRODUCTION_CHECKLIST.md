# GLAMO Nepal API — Production Checklist

## Turso Database Setup

- [ ] Create Turso database: `turso db create glamo-nepal`
- [ ] Run schema: `turso db shell glamo-nepal < src/scripts/schema.sql`
- [ ] Run seed: `pnpm db:seed`
- [ ] Verify all tables created: `turso db shell glamo-nepal ".tables"`
- [ ] Get `TURSO_DB_URL` from `turso db show glamo-nepal`
- [ ] Generate `TURSO_AUTH_TOKEN` from Turso Dashboard → Database → Settings → Tokens
- [ ] Create admin user via frontend signup
- [ ] Update admin role: `turso db shell glamo-nepal "UPDATE users SET role = 'SUPER_ADMIN' WHERE email = '<your-admin-email>';"`

## Firebase Auth Setup

- [ ] Create Firebase project at https://console.firebase.google.com
- [ ] Enable Authentication → Sign-in method → Email/Password
- [ ] Add Web App → copy config to frontend `.env.local`
- [ ] Set `FIREBASE_PROJECT_ID` in backend env vars
- [ ] Verify frontend sign-up creates user in Firebase Console → Authentication
- [ ] Configure Firebase Auth authorized domains to include production URL

## Cloudflare Worker Deployment

- [ ] Deploy via `pnpm deploy` or `wrangler deploy`
- [ ] Verify health endpoint: `curl https://glamo-nepal-api.prashant1327.workers.dev/health`

## Environment Variables (Cloudflare Worker)

- [ ] `TURSO_DB_URL` — Turso database connection URL
- [ ] `TURSO_AUTH_TOKEN` — Turso authentication token
- [ ] `FIREBASE_PROJECT_ID` — Firebase project ID for JWT verification
- [ ] `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` — Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` — Cloudinary API secret
- [ ] `RESEND_API_KEY` — Resend API key for transactional emails
- [ ] `KHALTI_SECRET_KEY` — Khalti secret key for payments
- [ ] `ESEWA_SECRET_KEY` — eSewa secret key for payments
- [ ] `ESEWA_MERCHANT_CODE` — eSewa merchant code for payments
- [ ] `FRONTEND_URL` — Production frontend URL (for CORS)
- [ ] `FREE_SHIPPING_THRESHOLD` — Free shipping threshold in paisa (default: 250000)
- [ ] `COD_FEE` — Cash on delivery fee in paisa (default: 5000)

## Configuration

- [ ] Verify `FRONTEND_URL` matches production frontend domain
- [ ] Verify `FREE_SHIPPING_THRESHOLD` is correct (in paisa — 250000 = 2500 NPR)
- [ ] Verify `COD_FEE` is correct (in paisa — 5000 = 50 NPR)
- [ ] Verify CORS origin matches frontend domain
- [ ] Verify Turso database region is close to your users (ap-south for Nepal)

## Architecture Validation

- [ ] All Supabase references removed from codebase
- [ ] All Convex references removed from codebase
- [ ] All API routes served via Hono on Cloudflare Worker
- [ ] Rate limiting working (in-memory Map)
- [ ] CORS origins set to production domains
- [ ] Firebase Auth JWT verification working on backend

## Security

- [ ] Firebase Auth handles JWT verification (no custom JWT keys needed)
- [ ] HTTP-only, Secure, SameSite cookies configured for admin session
- [ ] CORS restricted to production frontend URL only
- [ ] Admin routes protected by `requireRole(['ADMIN', 'SUPER_ADMIN'])`
- [ ] SuperAdmin-only routes protected by `requireRole(['SUPER_ADMIN'])`
- [ ] Response sanitization: no password_hash or sensitive fields in responses
- [ ] Error messages: no stack traces or DB details in production
- [ ] Rate limiting active (in-memory Map-based)
- [ ] Input validation via Zod schemas on all endpoints

## API Endpoints

### Auth
- [ ] POST /api/v1/auth/register — Firebase Auth signup
- [ ] POST /api/v1/auth/login — Firebase Auth login
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

### Health
- [ ] GET /health — Health check

## Testing

- [ ] Auth registration works with Firebase
- [ ] Auth login returns access token and refresh token
- [ ] Protected routes reject unauthenticated requests
- [ ] Admin routes reject non-admin users
- [ ] SuperAdmin-only routes reject admin users
- [ ] Category/brand/product listing with filters works
- [ ] Image upload to Cloudinary works
- [ ] In-memory caching works (check response times on repeated requests)
- [ ] Rate limiting works (429 after limit exceeded)
- [ ] Cart and wishlist operations work
- [ ] Order creation and payment verification work
- [ ] Newsletter subscribe/unsubscribe work
- [ ] Settings public endpoint returns only allowed keys
- [ ] Dashboard stats aggregate correctly

## Email

- [ ] Resend API key is valid
- [ ] Firebase Auth emails configured (verification, password reset)
- [ ] Order confirmation emails send (via Resend)
- [ ] Newsletter welcome email sends (via Resend)

## Payments

- [ ] Khalti integration configured
- [ ] eSewa integration configured
- [ ] Cash on delivery works
- [ ] Idempotency keys prevent duplicate payments

## Post-Deployment

- [ ] Monitor Cloudflare Worker logs for errors
- [ ] Check Turso dashboard for query performance
- [ ] Verify cache hit rate (in-memory, resets on redeploy)
- [ ] Test full auth flow end-to-end
- [ ] Test product CRUD as admin
- [ ] Verify image upload and deletion
- [ ] Check inventory reports
- [ ] Verify all endpoints respond correctly
- [ ] Run `pnpm typecheck` — zero TypeScript errors
- [ ] Run `pnpm test` — all tests pass
- [ ] Run `pnpm build` — build succeeds
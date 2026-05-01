# GLAMO Nepal API — Production Checklist

## Pre-Deployment

- [ ] Generate RSA key pair for JWT (2048-bit)
- [ ] Set `JWT_PRIVATE_KEY` Wrangler secret (full PEM)
- [ ] Set `JWT_PUBLIC_KEY` Wrangler secret (full PEM)
- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Set `RESEND_API_KEY` for transactional emails
- [ ] Set `KHALTI_SECRET_KEY` for Khalti payments
- [ ] Set `ESEWA_SECRET_KEY` and `ESEWA_MERCHANT_CODE` for eSewa payments
- [ ] Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] Set `R2_PUBLIC_URL` for image CDN

## Cloudflare Resources

- [ ] Create D1 database: `wrangler d1 create glamo-nepal-db`
- [ ] Update `database_id` in `wrangler.toml`
- [ ] Create KV namespace: `wrangler kv:namespace create "GLAMO_KV"`
- [ ] Update KV `id` in `wrangler.toml`
- [ ] Create R2 bucket: `wrangler r2 bucket create glamo-nepal-assets`
- [ ] Enable R2.dev subdomain or custom domain for public access
- [ ] Configure custom domain for Worker (e.g., `api.glamonepal.com`)

## Database

- [ ] Run initial schema migration: `wrangler d1 migrations apply glamo-nepal-db --remote`
- [ ] Run seed data: `wrangler d1 execute glamo-nepal-db --remote --file=migrations/0002_seed_data.sql`
- [ ] Verify tables created: `wrangler d1 execute glamo-nepal-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"`
- [ ] Verify admin user seeded: `wrangler d1 execute glamo-nepal-db --remote --command="SELECT email, role FROM users LIMIT 1"`

## Configuration

- [ ] Update `FRONTEND_URL` in `wrangler.toml` to production URL
- [ ] Update `FREE_SHIPPING_THRESHOLD` in `wrangler.toml` (currently 2500 NPR)
- [ ] Update `COD_FEE` in `wrangler.toml` (currently 50 NPR)
- [ ] Update `ADMIN_EMAIL` in `wrangler.toml`
- [ ] Verify CORS origin matches frontend domain

## Security

- [ ] RSA keys are at least 2048-bit
- [ ] JWT access token expiry is 15 minutes
- [ ] JWT refresh token expiry is 7 days
- [ ] Rate limiting is active (KV-based)
- [ ] HTTP-only, Secure, SameSite cookies configured
- [ ] CORS restricted to production frontend URL only
- [ ] Admin routes protected by `requireRole(['ADMIN', 'SUPER_ADMIN'])`

## Testing

- [ ] Health check responds: `GET /api/v1/health`
- [ ] Auth registration works: `POST /api/v1/auth/register`
- [ ] Auth login works: `POST /api/v1/auth/login`
- [ ] Auth returns JWT cookies
- [ ] Protected routes reject unauthenticated requests
- [ ] Admin routes reject non-admin users
- [ ] Category tree returns data
- [ ] Brand list returns data
- [ ] Product listing with filters works
- [ ] Image upload to Cloudinary works
- [ ] KV caching works (check response times)
- [ ] Rate limiting works (429 after limit exceeded)

## Email

- [ ] Resend API key is valid
- [ ] Verification email sends on registration
- [ ] Password reset email sends
- [ ] Welcome email sends (if configured)

## Payments (Phase 3)

- [ ] Khalti integration configured
- [ ] eSewa integration configured
- [ ] Test payment flows work

## Post-Deployment

- [ ] Monitor Worker logs: `wrangler tail`
- [ ] Check D1 query performance in dashboard
- [ ] Verify KV cache hit rate
- [ ] Test full auth flow end-to-end
- [ ] Test product CRUD as admin
- [ ] Verify image upload and deletion
- [ ] Check inventory reports
# GLAMO Nepal Backend — Final Module Design

**Date:** 2026-05-02  
**Status:** Draft  
**Approach:** Full Supabase (Auth + Postgres) on Cloudflare Workers + Hono.js

---

## 1. Architecture & Infrastructure

### Runtime & Framework
- **Stays:** Cloudflare Workers + Hono.js
- **Database:** Supabase Postgres replaces D1
- **Auth:** Supabase Auth replaces custom bcrypt + JWT
- **Caching:** KV stays for public endpoint caching
- **File uploads:** Cloudinary stays
- **Email:** Resend stays for custom emails; Supabase handles auth emails

### Supabase Client Setup

`src/config/supabase.ts`:
- `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` — admin client, bypasses RLS
- Used by all service files for database operations
- Auth verification uses `supabase.auth.getUser(token)` for incoming tokens

### Database Schema Migration (SQLite → Postgres)

Type changes:
| SQLite | Postgres |
|--------|----------|
| `TEXT` (timestamps) | `TIMESTAMPTZ` |
| `INTEGER` (booleans) | `BOOLEAN` |
| `INTEGER` (paisa prices) | `INTEGER` (stays) |
| `TEXT` (JSON fields) | `JSONB` |
| `TEXT` (UUIDs) | `UUID` with `gen_random_uuid()` |

Supabase Auth manages `auth.users`. Our `public.profiles` table links via `id UUID REFERENCES auth.users(id)` and stores: `role`, `phone`, `avatar_url`, `is_active`, `first_name`, `last_name`.

A trigger auto-creates a `profiles` row on signup.

### Updated Bindings

Remove from `CloudflareBindings`: `DB`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

Add: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

Keep: `KV`, `R2`, Cloudinary vars, payment vars, `FRONTEND_URL`

### File Structure

```
src/
  config/
    supabase.ts          ← NEW
    env.ts               ← UPDATED
  middleware/
    auth.ts              ← REWRITTEN (Supabase token verification)
    requireRole.ts       ← MINOR UPDATE
    rateLimit.ts         ← STAYS
    validate.ts          ← STAYS
  modules/
    auth/                ← REWRITTEN (Supabase Auth)
    account/             ← NEW
    admin/               ← NEW
    banners/             ← NEW
    blog/                ← NEW
    brands/              ← REWRITTEN (Supabase queries)
    cart/                ← NEW
    categories/          ← REWRITTEN
    coupons/             ← NEW
    gallery/             ← NEW
    inventory/            ← REWRITTEN
    newsletter/          ← NEW
    orders/              ← REWRITTEN
    popups/              ← NEW
    products/            ← REWRITTEN
    reviews/             ← NEW
    settings/            ← NEW
    team/                ← NEW
    wishlist/            ← NEW
  types/
    bindings.ts          ← UPDATED
  utils/
    cache.ts             ← STAYS (KV)
    audit.ts             ← STAYS
    response.ts          ← STAYS
    pagination.ts        ← STAYS
    upload.ts            ← STAYS
    slug.ts              ← STAYS
    price.ts             ← STAYS
    orderNumber.ts       ← STAYS
    email.ts             ← STAYS
    storage.ts           ← STAYS
    sanitize.ts          ← NEW (response sanitization)
    password.ts          ← REMOVED
    jwt.ts               ← REMOVED
  docs/
    openapi.ts           ← NEW
  index.ts              ← UPDATED
```

### Response Format (unchanged)

```json
{ "success": true, "message": "...", "data": T, "pagination": { "page", "limit", "total", "totalPages" } | null }
{ "success": false, "message": "...", "errors": [...] }
```

---

## 2. Auth Rewrite (Supabase Auth)

### Database: `auth.users` + `public.profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'CUSTOMER'
    CHECK (role IN ('CUSTOMER','STAFF','ADMIN','SUPER_ADMIN')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Service role full access" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Auth Middleware (Rewritten)

`src/middleware/auth.ts`:
1. Extract token from `Authorization: Bearer <token>` or `__Host-access_token` cookie
2. Call `supabase.auth.getUser(token)` — Supabase validates the JWT
3. Fetch `profiles` row for role/active status
4. Set `c.set('user', { id, email, role, isActive })` — same shape, `requireRole` works unchanged

### Auth Routes (Rewritten)

| Route | Supabase Auth Method |
|-------|---------------------|
| `POST /auth/register` | `supabase.auth.signUp({ email, password }, { data: { first_name, last_name } })` |
| `POST /auth/login` | `supabase.auth.signInWithPassword({ email, password })` |
| `POST /auth/refresh` | `supabase.auth.refreshSession({ refresh_token })` |
| `POST /auth/logout` | `supabase.auth.signOut()` + clear cookies |
| `POST /auth/forgot-password` | `supabase.auth.resetPasswordForEmail(email, { redirectTo })` |
| `POST /auth/reset-password` | `supabase.auth.updateUser({ password })` (after email link click) |
| `GET /auth/verify-email` | Supabase handles via email link redirect |
| `POST /auth/google` | `supabase.auth.signInWithOAuth({ provider: 'google' })` — returns URL for redirect |
| `GET /auth/me` | `supabase.auth.getUser(token)` + profile fetch |

### Removed
- `src/utils/password.ts` — Supabase handles password hashing
- `src/utils/jwt.ts` — Supabase handles JWT signing/verification
- `email_verifications` table — Supabase Auth handles email verification
- `password_resets` table — Supabase Auth handles password reset tokens
- `refresh_tokens` table — Supabase Auth manages sessions

### Kept
- `src/utils/email.ts` — order confirmations, low stock alerts, newsletter welcome
- `src/utils/audit.ts` — audit logging
- Cookie handling — still set `__Host-access_token` and `__Host-refresh_token` cookies, just with Supabase tokens

### Admin Seeding

SQL seed creates admin user via `auth.users` and sets profile role to `SUPER_ADMIN`.

---

## 3. Existing Module Rewrites

All existing services (categories, brands, products, inventory, orders) get rewritten from D1 raw SQL to Supabase Postgres queries using the Supabase JS client.

### Query Pattern Change

**Before (D1 raw SQL):**
```typescript
const result = await db.prepare(
  'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL'
).bind(id).first()
```

**After (Supabase):**
```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('id', id)
  .is('deleted_at', null)
  .single()
```

### Key Changes Per Module

**Categories, Brands, Products, Inventory, Orders:**
- Replace all `db.prepare(SQL).bind(params)` calls with Supabase query builder
- Replace `db.batch([stmt1, stmt2])` transactions with Supabase RPC calls or sequential queries with Postgres transactions where needed
- Replace `crypto.randomUUID()` with `gen_random_uuid()` in Postgres defaults (or keep client-side UUID generation)
- Snake_case DB columns map to camelCase in format functions (same as current pattern)
- Soft delete pattern (`deleted_at IS NULL`) becomes `.is('deleted_at', null)` filter
- Price handling stays the same (paisa integers)

**Orders module specifically:**
- Checkout flow uses Supabase RPC for atomic order creation
- Coupon validation uses Supabase queries
- Payment integration (Khalti, eSewa) stays the same, just DB calls change

### Migration Strategy

Each module rewrite:
1. Replace D1 imports with Supabase client import
2. Rewrite queries using Supabase query builder
3. Keep controller/route/schema files mostly unchanged (only service changes)
4. Update format functions if column names changed in Postgres migration
5. Test each module individually

---

## 4. New Modules

### 4.1 Account Module (Customer-Facing)

All routes require `authMiddleware`. Ownership enforced.

**Routes:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/account/profile` | User profile + counts (orderCount, wishlistCount, addressCount) |
| PATCH | `/api/v1/account/profile` | Update name, phone. Phone uniqueness check. Audit log. |
| POST | `/api/v1/account/avatar` | Upload avatar to Cloudinary `avatars/{userId}`. Delete old first. |
| GET | `/api/v1/account/addresses` | List addresses sorted by default first |
| POST | `/api/v1/account/addresses` | Create address. Max 5. First = default. Nepal districts validation. |
| PATCH | `/api/v1/account/addresses/:id` | Update address. Verify ownership. |
| DELETE | `/api/v1/account/addresses/:id` | Delete address. If default, promote next. |
| PATCH | `/api/v1/account/addresses/:id/default` | Set default. Transaction: unset all, set this one. |

**Schema:**
- `updateProfileSchema`: `{ name: z.string().min(1).optional(), phone: z.string().optional() }`
- `createAddressSchema`: `{ label?, fullName, phone, address1, address2?, city, district (enum), province?, postalCode?, country default "Nepal" }`
- Nepal districts as Zod enum.

**Service:**
- `getProfile`: fetch profile + counts from orders/wishlist_items/addresses tables
- `updateProfile`: check phone uniqueness if changing, update, audit log
- `uploadAvatar`: Cloudinary upload to `avatars/{userId}`, delete old avatar, update `avatar_url`
- Address CRUD with ownership checks and default management

### 4.2 Admin Dashboard Module

All routes require `requireRole(['ADMIN', 'SUPER_ADMIN'])`.

**Dashboard Stats (KV cached 5 min, key `admin:dashboard`):**

1. **Today's metrics**: orders count, revenue (PAID), new users
2. **This month's metrics**: orders, revenue, new users
3. **All-time totals**: total orders, total revenue (PAID), total customers (role=CUSTOMER, is_active), total products (active, not hidden)
4. **Order status breakdown**: `SELECT status, COUNT(*) FROM orders GROUP BY status`
5. **Revenue last 30 days**: `SELECT DATE(created_at), SUM(total_amount), COUNT(*) FROM orders WHERE payment_status='PAID' AND created_at >= 30 days ago GROUP BY DATE(created_at) ORDER BY date`
6. **Inventory alerts**: low stock (stock_quantity <= threshold), out of stock (stock_quantity = 0)
7. **Recent activity**: last 10 orders with customer info, last 5 registered users
8. **Top performers**: top 10 products by total_sold, top 5 categories by order item count

**Sales Report (not cached, on-demand):**
- Date range + groupBy (day/week/month)
- Revenue and order count grouped by period
- Payment method breakdown
- Category breakdown
- Structured for charting

**Routes:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/dashboard` | Dashboard stats (cached) |
| GET | `/api/v1/admin/sales-report` | Sales report (query: startDate, endDate, groupBy) |
| GET | `/api/v1/admin/notifications` | Admin notifications with unread count |
| PATCH | `/api/v1/admin/notifications/:id/read` | Mark notification read |
| PATCH | `/api/v1/admin/notifications/read-all` | Mark all read |
| GET | `/api/v1/admin/audit-logs` | Audit log viewer (superAdmin only) |
| GET | `/api/v1/admin/users` | List users with pagination, filters |
| GET | `/api/v1/admin/users/:id` | Get user detail |
| PATCH | `/api/v1/admin/users/:id/role` | Change user role (superAdmin only) |
| PATCH | `/api/v1/admin/users/:id/status` | Activate/deactivate user |

**Cache invalidation:** Bust `admin:dashboard` KV cache on any new order or new user signup.

### 4.3 CMS — Banners

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/banners` | Public (cached 10 min) | Active banners |
| GET | `/api/v1/banners/position/:pos` | Public (cached 10 min) | Banners by position (HERO, MID_PAGE, SIDEBAR, POPUP) |
| POST | `/api/v1/banners` | Admin | Create banner with image upload |
| PATCH | `/api/v1/banners/:id` | Admin | Update banner |
| DELETE | `/api/v1/banners/:id` | Admin | Delete banner (soft) |
| PATCH | `/api/v1/banners/reorder` | Admin | Reorder banners |

**Schema:** `{ title, subtitle?, imageUrl, linkUrl?, position enum, sortOrder?, startsAt?, expiresAt? }`

**Service:** Date-range scheduling (only show banners where current time is between startsAt and expiresAt, or both null). Cache bust on mutation.

### 4.4 CMS — Popups

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/popups/active` | Public (cached 10 min) | Active popup with cookieDays |
| GET | `/api/v1/popups` | Admin | List all popups |
| POST | `/api/v1/popups` | Admin | Create popup |
| PATCH | `/api/v1/popups/:id` | Admin | Update popup |
| DELETE | `/api/v1/popups/:id` | Admin | Delete popup |

**Schema:** `{ title, content, imageUrl?, linkUrl?, trigger enum (ON_LOAD, EXIT_INTENT, SCROLL_50, TIME_DELAY), delayMs?, cookieDays?, startsAt?, expiresAt? }`

Only one popup active at a time. When activating a popup, deactivate all others.

### 4.5 CMS — Blog

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/blogs` | Public | Published blogs (paginated) |
| GET | `/api/v1/blogs/categories` | Public | Blog category list |
| GET | `/api/v1/blogs/:slug` | Public | Single blog by slug |
| POST | `/api/v1/blogs` | Admin | Create blog (draft) |
| PATCH | `/api/v1/blogs/:id` | Admin | Update blog |
| PATCH | `/api/v1/blogs/:id/publish` | Admin | Publish blog (set is_published=true, published_at) |
| PATCH | `/api/v1/blogs/:id/unpublish` | Admin | Unpublish blog |
| DELETE | `/api/v1/blogs/:id` | Admin | Soft delete blog |
| POST | `/api/v1/blogs/:id/cover` | Admin | Upload cover image |

**Service:** Slug auto-generated from title. Read time calculated from word count / 200. View count increment via `waitUntil` (non-blocking).

### 4.6 CMS — Gallery

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/gallery` | Public (cached 10 min) | Gallery items, optionally filtered by category |
| POST | `/api/v1/gallery` | Admin | Upload gallery image |
| PATCH | `/api/v1/gallery/:id` | Admin | Update gallery item |
| DELETE | `/api/v1/gallery/:id` | Admin | Delete gallery item |
| PATCH | `/api/v1/gallery/reorder` | Admin | Reorder gallery items |

**Schema:** `{ title, description?, imageUrl, category enum (instagram, store, products, team), sortOrder? }`

### 4.7 CMS — Team

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/team` | Public | Team members, sorted by sortOrder |
| POST | `/api/v1/team` | Admin | Create team member with photo upload |
| PATCH | `/api/v1/team/:id` | Admin | Update team member |
| DELETE | `/api/v1/team/:id` | Admin | Delete team member |

**Schema:** `{ name, role, bio?, imageUrl?, sortOrder? }`

### 4.8 Newsletter Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/newsletter/subscribe` | Public (rate limited 3/hr/IP) | Subscribe email |
| GET | `/api/v1/newsletter/unsubscribe` | Public (token in query) | Unsubscribe via token |
| GET | `/api/v1/newsletter` | Admin | List subscribers (paginated, filter active/inactive) |
| GET | `/api/v1/newsletter/export` | Admin | Export as CSV |
| DELETE | `/api/v1/newsletter/:id` | Admin | Delete subscriber |

**Subscribe logic:**
- If email exists and `is_active=true`: return success silently (don't reveal status)
- If email exists and `is_active=false`: reactivate, clear `unsubscribed_at`
- If new: create with UUID `unsubscribe_token`, send welcome email via `waitUntil`

**Unsubscribe logic:**
- Find by `unsubscribe_token`. If not found: return 200 (don't reveal existence)
- Set `is_active=false`, `unsubscribed_at=now()`. Don't delete (legal compliance).

**Table:**
```sql
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  unsubscribe_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);
```

### 4.9 Site Settings Module

Key-value store in `site_settings` table. Values stored as JSONB. Public subset cached in KV 30 min.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/settings/public` | Public (cached 30 min) | Announcement texts, free_shipping_threshold, contact_info, delivery_fees |
| GET | `/api/v1/settings` | Admin | All settings |
| PATCH | `/api/v1/settings` | SuperAdmin | Update setting(s). Validate type. Bust KV cache. Audit log. |

**Default settings to seed:**
```json
{
  "announcement_texts": [
    "🌿 Vegan | 100% Cruelty-Free | Dermat Tested",
    "Free shipping on orders above NPR 2,500 | Call: +977 9818212188",
    "Authentic beauty products | Naya Baneshwor, Kathmandu"
  ],
  "free_shipping_threshold": 2500,
  "cod_fee": 50,
  "delivery_fees": {
    "Kathmandu": 0, "Lalitpur": 0,
    "Bhaktapur": 50, "Chitwan": 100, "default": 150
  },
  "contact_info": {
    "phone": "+977 9818212188",
    "whatsapp": "9779818212188",
    "email": "info@glamonepal.com",
    "address": "Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal",
    "instagram": "https://www.instagram.com/glamo_nepal/",
    "instagram_handle": "@glamo_nepal",
    "hours": "Sun-Fri: 10AM-7PM, Sat: 10AM-5PM"
  },
  "maintenance_mode": false,
  "max_cart_item_quantity": 10,
  "review_auto_approve": false,
  "low_stock_threshold_default": 5
}
```

### 4.10 Cart Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/cart` | Auth | Get user's cart items |
| POST | `/api/v1/cart` | Auth | Add item to cart |
| PATCH | `/api/v1/cart/:id` | Auth | Update quantity |
| DELETE | `/api/v1/cart/:id` | Auth | Remove item |
| DELETE | `/api/v1/cart` | Auth | Clear entire cart |

**Schema:** `{ productId, variantId?, quantity }`. Max quantity enforced from settings.

### 4.11 Wishlist Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/wishlist` | Auth | Get user's wishlist |
| POST | `/api/v1/wishlist` | Auth | Add product to wishlist |
| DELETE | `/api/v1/wishlist/:productId` | Auth | Remove from wishlist |
| GET | `/api/v1/wishlist/check/:productId` | Auth | Check if product is in wishlist |

### 4.12 Reviews Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/reviews/product/:productId` | Public | Product reviews (paginated) |
| POST | `/api/v1/reviews` | Auth | Create review (one per user per product) |
| PATCH | `/api/v1/reviews/:id` | Auth | Update own review |
| DELETE | `/api/v1/reviews/:id` | Auth | Delete own review |
| GET | `/api/v1/admin/reviews` | Admin | All reviews (filter by approval status) |
| PATCH | `/api/v1/admin/reviews/:id/approve` | Admin | Approve review |
| PATCH | `/api/v1/admin/reviews/:id/reject` | Admin | Reject review |

**Schema:** `{ productId, rating (1-5), title?, comment? }`. Auto-approve based on `review_auto_approve` setting.

### 4.13 Coupons Module

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/coupons` | Admin | Create coupon |
| GET | `/api/v1/coupons` | Admin | List coupons |
| GET | `/api/v1/coupons/:id` | Admin | Get coupon |
| PATCH | `/api/v1/coupons/:id` | Admin | Update coupon |
| DELETE | `/api/v1/coupons/:id` | Admin | Soft delete coupon |
| POST | `/api/v1/coupons/validate` | Public | Validate coupon code |
| POST | `/api/v1/coupons/apply` | Auth | Apply coupon to order |

---

## 5. OpenAPI Documentation

### `/api/docs.json` — OpenAPI 3.0 spec

Complete JSON spec covering all ~120 endpoints. Generated from code in `src/docs/openapi.ts`.

Includes:
- All route paths, methods, request bodies, response schemas
- Authentication documentation (cookie-based Supabase tokens, HTTP-only cookies)
- Nepal-specific examples (NPR prices, Nepali names, districts)
- Tags grouping: Auth, Account, Products, Categories, Brands, Cart, Wishlist, Orders, Payments, Reviews, Coupons, Banners, Popups, Blog, Gallery, Team, Newsletter, Settings, Admin

### `/api/docs` — Swagger UI

Serve a static HTML page with Swagger UI that loads `/api/docs.json`.

### Implementation

`src/docs/openapi.ts` exports a function that builds the complete OpenAPI 3.0 spec object. Added to `src/index.ts` as:
```typescript
app.get('/api/docs.json', (c) => c.json(openApiSpec))
app.get('/api/docs', (c) => c.html(swaggerUiHtml))
```

---

## 6. Security Hardening

### 6.1 Response Sanitization

`src/utils/sanitize.ts`:
```typescript
export function sanitizeUser(user: any) {
  const { password_hash, refresh_token, ...safe } = user
  return safe
}
```
Applied in every endpoint that returns user data. Never return `password_hash` or `refresh_token`.

### 6.2 Sensitive Data in Logs

Custom logger middleware that redacts:
- Request bodies containing "password" fields
- Authorization headers
- Cookie values

### 6.3 CORS Configuration

```typescript
app.use('*', cors({
  origin: (origin) => {
    const allowed = [c.env.FRONTEND_URL, 'http://localhost:3000']
    return allowed.includes(origin) ? origin : allowed[0]
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400,
}))
```

### 6.4 Content Security Policy

Hono `secureHeaders()` already adds security headers. Add CSP via custom middleware:
```typescript
app.use('*', async (c, next) => {
  await next()
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com")
})
```

### 6.5 SQL Injection Prevention

All Supabase queries use the query builder (parameterized). Zero string concatenation in queries. No raw SQL in service files.

### 6.6 Error Messages

- Production: never expose stack traces or database error details
- Generic 500 message to client: `"Internal server error"`
- Full error details to logger only
- Environment variable `ENVIRONMENT` controls this (dev shows details, prod doesn't)

### 6.7 Idempotency Keys on Payment Endpoints

```typescript
// On POST /api/v1/payments/*
const idempotencyKey = c.req.header('X-Idempotency-Key')
if (idempotencyKey) {
  const cached = await getFromCache(kv, `idempotency:${idempotencyKey}`)
  if (cached) return c.json(cached, 200)
}
// ... process payment ...
// Store result in KV with 24h TTL
if (idempotencyKey) {
  await setCache(kv, `idempotency:${idempotencyKey}`, result, 86400)
}
```

---

## 7. Database Schema (Complete Postgres)

Full Supabase migration SQL creating all tables:

### Core Tables

```sql
-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'CUSTOMER'
    CHECK (role IN ('CUSTOMER','STAFF','ADMIN','SUPER_ADMIN')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User addresses
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_1 TEXT NOT NULL,
  address_2 TEXT,
  city TEXT NOT NULL,
  district TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'Nepal',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Brands
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  sku TEXT UNIQUE,
  category_id UUID NOT NULL REFERENCES categories(id),
  brand_id UUID REFERENCES brands(id),
  base_price INTEGER NOT NULL,
  sale_price INTEGER,
  cost_price INTEGER,
  currency TEXT NOT NULL DEFAULT 'NPR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_digital BOOLEAN NOT NULL DEFAULT false,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  weight INTEGER,
  dimensions TEXT,
  meta_title TEXT,
  meta_description TEXT,
  tags JSONB,
  search_vector TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Product variants
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price INTEGER NOT NULL,
  sale_price INTEGER,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  attributes JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Product images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  public_id TEXT,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory logs
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  change_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED')),
  value INTEGER NOT NULL,
  min_order_amount INTEGER,
  max_discount INTEGER,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (payment_status IN ('PENDING','PAID','FAILED','REFUNDED')),
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('CASH_ON_DELIVERY','KHALTI','ESEWA','BANK_TRANSFER')),
  payment_id TEXT,
  subtotal INTEGER NOT NULL,
  shipping_charge INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  coupon_id UUID REFERENCES coupons(id),
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_name TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order status history
CREATE TABLE order_status_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  comment TEXT,
  changed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  product_id UUID NOT NULL REFERENCES products(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (user_id, product_id)
);

-- Wishlist items
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- Cart items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id, variant_id)
);

-- Banners
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'HERO'
    CHECK (position IN ('HERO','MID_PAGE','SIDEBAR','POPUP')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Popups
CREATE TABLE popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'ON_LOAD'
    CHECK (trigger_type IN ('ON_LOAD','EXIT_INTENT','SCROLL_50','TIME_DELAY')),
  delay_ms INTEGER NOT NULL DEFAULT 0,
  cookie_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blogs
CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  category TEXT,
  meta_title TEXT,
  meta_description TEXT,
  tags JSONB,
  view_count INTEGER NOT NULL DEFAULT 0,
  read_time_minutes INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Gallery items
CREATE TABLE gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT
    CHECK (category IN ('instagram','store','products','team')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  unsubscribe_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Site settings
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  group_name TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Indexes

```sql
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_banners_position ON banners(position);
CREATE INDEX idx_banners_is_active ON banners(is_active);
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_is_published ON blogs(is_published);
CREATE INDEX idx_blogs_published_at ON blogs(published_at);
CREATE INDEX idx_gallery_items_category ON gallery_items(category);
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_site_settings_key ON site_settings(key);
CREATE INDEX idx_site_settings_group ON site_settings(group_name);
```

### RLS Policies

Supabase Row Level Security enabled on all tables:

- **Public read**: categories, brands, products, product_images, product_variants, banners, popups, blogs (published), gallery_items, team_members, site_settings (public keys only)
- **Authenticated read**: orders (own), order_items (via own orders), reviews, wishlist_items, cart_items, user_addresses (own), notifications (own), newsletter_subscribers (own)
- **Admin full access**: all tables via service role key
- **Customer write**: own orders, own reviews, own wishlist, own cart, own addresses, own profile

---

## 8. Route Registration (src/index.ts)

```typescript
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
app.get('/api/docs', (c) => c.html(swaggerUiHtml))
app.get('/health', healthCheck)
```

---

## 9. Complete Deliverables Checklist

- [ ] Supabase project setup + migration SQL
- [ ] `src/config/supabase.ts` client wrapper
- [ ] Updated `src/types/bindings.ts` + `src/config/env.ts`
- [ ] Auth module rewrite (Supabase Auth)
- [ ] Auth middleware rewrite (Supabase token verification)
- [ ] Account module (profile + addresses)
- [ ] Admin dashboard (8 metric categories)
- [ ] Admin sales report (date range + groupBy)
- [ ] Admin notifications + read/unread
- [ ] Admin user management + role control
- [ ] Audit log viewer (superAdmin only)
- [ ] Banner CRUD + scheduling + reorder
- [ ] Popup CRUD + trigger config
- [ ] Blog CRUD + publish flow + view count
- [ ] Gallery CRUD + reorder
- [ ] Team CRUD + photo upload
- [ ] Cart module
- [ ] Wishlist module
- [ ] Reviews module
- [ ] Coupons module
- [ ] Newsletter subscribe/unsubscribe + CSV export
- [ ] Site settings (public/admin split)
- [ ] Default settings seeded in Supabase
- [ ] OpenAPI spec at `/api/docs.json`
- [ ] Swagger UI at `/api/docs`
- [ ] All routes in `src/index.ts`
- [ ] Response sanitization (sanitizeUser utility)
- [ ] Error messages safe for production
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] Audit logs on all admin mutations
- [ ] KV caching on all public GETs
- [ ] Cache invalidation on all mutations
- [ ] `wrangler deploy` succeeds
- [ ] `PRODUCTION_CHECKLIST.md` updated and complete
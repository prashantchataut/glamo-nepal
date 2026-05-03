# GLAMO Nepal — Production-Ready Backend Design

**Date:** 2026-05-03  
**Status:** Approved  
**Sub-project:** 1 of 5 (Foundation)

---

## Decisions

| Decision | Choice |
|----------|--------|
| Architecture | Full migration from Cloudflare Workers (Hono) to Supabase Edge Functions (Deno) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| API framework | Hono (runs in Deno, preserves existing route patterns) |
| Image storage | Supabase Storage (replaces Cloudinary for product images) |
| Caching | In-memory (Edge Function global scope) + Postgres queries with RLS |
| Payments | Edge Functions with 30s timeout (Khalti, eSewa, COD) |
| Emails | Resend API from Edge Functions |
| Data model | Fix gaps only — add missing tables/columns/indexes, don't restructure |
| Security | RLS on every table, role-based access (CUSTOMER/STAFF/ADMIN/SUPER_ADMIN) |
| Priority | All 6 areas equally critical |

---

## 1. Architecture Overview

### Migration Strategy

Migrate from **Hono on Cloudflare Workers** to **Supabase Edge Functions (Deno)**. The approach:

1. Keep the existing Hono backend running during migration — no breaking changes. The frontend continues pointing to the Cloudflare Workers URL until all modules are migrated and tested.
2. Create a new `supabase/functions/` directory with the same module structure
3. Each Edge Function is self-contained — its own `index.ts` with Hono routing, using `@supabase/supabase-js` directly
4. Shared utilities extracted into `supabase/functions/_shared/`
5. Frontend swaps the API base URL from Cloudflare Workers to Supabase Edge Functions once all modules are migrated

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Runtime | Supabase Edge Functions (Deno) | Single platform, direct Postgres access, RLS enforcement |
| Auth | Supabase Auth (email/password + Google OAuth) | Built-in JWTs, password reset, email verification |
| API framework | Hono (runs in Deno) | Preserves existing route patterns, familiar to team |
| Image storage | Supabase Storage | Replaces Cloudinary; keeps Cloudinary as CDN option |
| Caching | Postgres queries + RLS | KV cache replaced by direct DB reads with proper indexes |
| Payments | Edge Functions with 30s timeout | Sufficient for Khalti/eSewa verification |
| Emails | Resend API from Edge Functions | Transactional emails triggered by DB events or API calls |

### Edge Function Structure

```
supabase/
  functions/
    _shared/
      auth.ts              — Supabase Auth helpers, role checking
      response.ts          — API response helpers (success, error, paginated)
      validation.ts        — Zod schemas and validation middleware
      cors.ts              — CORS configuration
      types.ts             — Shared TypeScript types
      email.ts             — Resend API helper, template renderer
      email-templates/
        order-confirmation.ts
        order-status-update.ts
        order-cancelled.ts
        low-stock-alert.ts
        welcome.ts
    api/
      auth/index.ts             — /auth/* routes
      account/index.ts          — /account/* routes
      products/index.ts         — /products/* routes
      categories/index.ts      — /categories/* routes
      brands/index.ts           — /brands/* routes
      cart/index.ts             — /cart/* routes
      wishlist/index.ts         — /wishlist/* routes
      orders/index.ts           — /orders/* + /checkout/* routes
      coupons/index.ts         — /coupons/* routes
      reviews/index.ts          — /reviews/* routes
      inventory/index.ts        — /inventory/* routes
      banners/index.ts          — /banners/* routes
      popups/index.ts           — /popups/* routes
      blogs/index.ts            — /blogs/* routes
      gallery/index.ts          — /gallery/* routes
      team/index.ts             — /team/* routes
      newsletter/index.ts      — /newsletter/* routes
      settings/index.ts         — /settings/* routes
      admin/index.ts            — /admin/* routes
      events/index.ts           — /events/* routes
      recommendations/index.ts — /recommendations/* routes
    payments/
      khalti-initiate/index.ts  — Khalti payment initiation
      khalti-verify/index.ts     — Khalti payment verification webhook
      esewa-initiate/index.ts   — eSewa payment initiation
      esewa-verify/index.ts      — eSewa payment verification webhook
      cod-initiate/index.ts      — COD payment initiation
      payment-status/index.ts    — Payment status check
    emails/
      order-confirmation/index.ts  — Order confirmation email trigger
      order-status-update/index.ts  — Order status change notification
      low-stock-alert/index.ts     — Low stock alert to admin
```

---

## 2. Data Model Fixes

### New Tables

**`payment_transactions`** — Payment audit trail with idempotency:

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL CHECK (provider IN ('KHALTI', 'ESEWA', 'COD')),
  provider_transaction_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NPR',
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'VERIFIED', 'FAILED', 'REFUNDED')),
  provider_payload JSONB,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_idempotency_key ON payment_transactions(idempotency_key);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
```

**`product_reviews_media`** — Review images/media:

```sql
CREATE TABLE product_reviews_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  public_id TEXT,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_reviews_media_review_id ON product_reviews_media(review_id);
```

**`product_tags`** — Normalized product tags (coexists with JSONB `tags` column during migration):

```sql
CREATE TABLE product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, tag)
);

CREATE INDEX idx_product_tags_tag ON product_tags(tag);
CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);
```

**Note:** The existing `products.tags` JSONB column will remain during migration for backward compatibility. The new `product_tags` table becomes the source of truth. A migration script will extract tags from JSONB into the normalized table. Once all consumers are updated, the JSONB column can be deprecated.

### New Columns on Existing Tables

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_phone TEXT;
```

### New Indexes

```sql
-- Full-text search on products
CREATE INDEX idx_products_search_vector ON products USING gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(short_description,'') || ' ' || coalesce(description,'')));

-- Orders: admin dashboard queries
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status) WHERE payment_status != 'PAID';
CREATE INDEX idx_orders_coupon_id ON orders(coupon_id) WHERE coupon_id IS NOT NULL;

-- Products: filtered listings
CREATE INDEX idx_products_category_active ON products(category_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_brand_active ON products(brand_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_featured_active ON products(is_featured, is_active) WHERE deleted_at IS NULL;

-- Events: time-series queries
CREATE INDEX idx_events_created_type ON events(created_at DESC, event_type);

-- Affinity: recommendation queries
CREATE INDEX idx_affinity_user_score ON user_product_affinity(user_id, score DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_affinity_session_score ON user_product_affinity(session_id, score DESC);

-- Audit logs: admin queries
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
```

---

## 3. Security (RLS + Policies)

### Policy Categories

**1. Public read, no public write** (catalog data):
- `categories`, `brands`, `products`, `product_variants`, `product_images`, `product_tags`, `banners`, `popups`, `blogs`, `gallery_items`, `team_members`, `site_settings`, `product_metrics_daily`

**2. Authenticated user owns** (user-scoped data):
- `user_addresses` — users can CRUD their own
- `cart_items` — users can CRUD their own
- `wishlist_items` — users can CRUD their own
- `reviews` — users can insert their own, view approved reviews
- `low_stock_alerts` — users can manage their own subscriptions
- `notifications` — users can read/update their own
- `profiles` — users can read/update their own

**3. Authenticated user, order-scoped** (order data):
- `orders` — users can view their own orders
- `order_items` — users can view items for their own orders
- `order_status_histories` — users can view history for their own orders

**4. Admin/Staff full access** (admin operations):
- All tables — ADMIN and SUPER_ADMIN roles have full access via service role
- `products`, `categories`, `brands`, `product_variants`, `product_images`, `inventory_logs`, `coupons`, `banners`, `popups`, `blogs`, `gallery_items`, `team_members`, `newsletter_subscribers`, `site_settings`, `audit_logs`, `payment_transactions` — STAFF role has read/write access

**5. No public access** (internal data):
- `audit_logs` — only admin/staff
- `payment_transactions` — only admin/staff
- `events` — only service role (system writes, admin reads)
- `user_product_affinity` — only service role

### Auth Flow

1. Frontend calls Supabase Auth (`signInWithPassword` or `signInWithOAuth`) → gets JWT
2. Edge Function receives JWT in `Authorization: Bearer <token>` header
3. Edge Function creates Supabase client with the user's JWT → RLS policies enforced automatically
4. Admin operations use service role client (full bypass) but gated by role checks in Edge Function

### Role-Based Access Matrix

| Role | Access |
|------|--------|
| `CUSTOMER` | Own profile, addresses, orders, cart, wishlist, reviews, alerts, notifications |
| `STAFF` | All customer access + product CRUD, inventory, order management, review moderation |
| `ADMIN` | All staff access + user management, coupons, settings, audit logs |
| `SUPER_ADMIN` | Everything including role changes, system settings |

### Key Security Rules

- No direct client writes to orders/payments — all mutations go through Edge Functions with validation
- Payment verification always server-side — never trust client-sent "paid" status
- Admin mutations always audited — every admin write creates an `audit_logs` entry
- Rate limiting enforced in Edge Function middleware

---

## 4. Payment System (Khalti, eSewa, COD)

### Khalti Flow

1. Frontend calls `POST /api/v1/payments/khalti/initiate` with `order_id`
2. Edge Function validates order (exists, PENDING, amount matches), creates `payment_transactions` row with idempotency_key, calls Khalti's `/epayment/initiate` API, returns payment URL
3. Frontend redirects user to Khalti payment page
4. Khalti calls webhook `POST /api/v1/payments/khalti/verify`
5. Edge Function verifies Khalti signature, checks idempotency, verifies amount matches order total from DB, updates `payment_transactions` to VERIFIED, updates `orders` payment_status to PAID and status to CONFIRMED, creates `order_status_histories` entry, triggers confirmation email

### eSewa Flow

Same as Khalti but with eSewa's `/epay/initiate` API and signature verification using `ESEWA_SECRET_KEY` + `ESEWA_MERCHANT_CODE`.

### COD Flow

1. Frontend calls `POST /api/v1/payments/cod/initiate` with `order_id`
2. Edge Function validates order, creates `payment_transactions` with status=PENDING, provider=COD, updates order status to CONFIRMED

### Fraud Prevention

| Check | Description |
|-------|-------------|
| Amount verification | Payment amount must match `orders.total_amount` from DB |
| Idempotency | Each payment attempt gets unique `idempotency_key` |
| Order state check | Only PENDING orders can initiate payment |
| Signature verification | Khalti/eSewa webhooks verified with HMAC |
| Rate limiting | Payment initiation: 5 req/min per user |

### Payment Endpoints

| Method | Path | Purpose |
|-------|------|---------|
| POST | `/api/v1/payments/khalti/initiate` | Create Khalti payment |
| POST | `/api/v1/payments/khalti/verify` | Khalti webhook |
| POST | `/api/v1/payments/esewa/initiate` | Create eSewa payment |
| POST | `/api/v1/payments/esewa/verify` | eSewa webhook |
| POST | `/api/v1/payments/cod/initiate` | Mark order as COD |
| GET | `/api/v1/payments/status/:order_id` | Check payment status |

---

## 5. Transactional Emails (Resend)

### Email Templates

| Template | Trigger | Recipient |
|----------|---------|-----------|
| `order-confirmation` | Payment verified | Customer |
| `order-status-update` | Order status changes | Customer |
| `order-cancelled` | Order cancelled | Customer |
| `low-stock-alert` | Stock drops below threshold | Admin |
| `password-reset` | Supabase Auth built-in | Customer |
| `welcome` | New signup | Customer |

### Implementation

Each email trigger is an Edge Function that:
1. Receives event data (order_id, status, etc.)
2. Fetches relevant data from Supabase
3. Renders HTML email using template functions
4. Calls Resend API (`POST https://api.resend.com/emails`)
5. Logs the send result

### Configuration

- From: `GLAMO Nepal <noreply@glamonepal.com>`
- Reply-to: `support@glamonepal.com`
- API key: `RESEND_API_KEY` environment variable
- Unsubscribe links included where applicable

### Trigger Mechanisms

| Trigger | How |
|---------|-----|
| Order confirmation | Called after payment verification succeeds |
| Order status update | DB trigger on `orders` status change, or explicit admin API call |
| Low stock alert | DB trigger on `products.stock_quantity` update when below threshold |
| Password reset | Supabase Auth built-in |
| Welcome | Supabase Auth `on_auth_user_created` trigger |

---

## 6. Performance & Reliability

### Pagination Strategy

| Endpoint | Pagination | Default Limit |
|----------|------------|---------------|
| `GET /products` | Offset (page/perPage) | 24 |
| `GET /orders` (admin) | Offset (page/perPage) | 20 |
| `GET /orders` (customer) | Cursor (after/limit) | 10 |
| `GET /reviews` | Offset (page/perPage) | 20 |
| `GET /audit-logs` | Cursor (after/limit) | 50 |
| `GET /events` | Cursor (after/limit) | 100 |
| `GET /recommendations` | No pagination (fixed limit) | 8 |
| `GET /trending` | No pagination (fixed limit) | 10 |

### Caching Strategy

| Data | Cache Layer | TTL | Invalidation |
|------|------------|-----|-------------|
| Site settings | In-memory (Edge Function global) | 5 min | Manual clear on update |
| Banners | In-memory | 10 min | Manual clear on update |
| Categories | In-memory | 30 min | Manual clear on update |
| Product detail | In-memory | 5 min | Clear on product update |
| Product list | In-memory | 2 min | Clear on any product change |
| Trending/recommendations | In-memory | 5 min | Auto-expire |

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth (login/register) | 5 requests | 15 minutes |
| Password reset | 3 requests | 60 minutes |
| Payment initiate | 5 requests | 60 seconds |
| Payment verify webhook | 100 requests | 60 seconds |
| General API | 100 requests | 60 seconds |
| Events batch | 100 events | 60 seconds |

### Admin Dashboard Stats

| Stat | Query |
|------|-------|
| Total revenue (period) | `SUM(total_amount) FROM orders WHERE created_at >= $period AND status != 'CANCELLED'` |
| Order count (period) | `COUNT(*) FROM orders WHERE created_at >= $period` |
| Average order value | `AVG(total_amount) FROM orders WHERE status != 'CANCELLED'` |
| Low stock products | `SELECT name, stock_quantity FROM products WHERE stock_quantity < low_stock_threshold AND is_active = true` |
| Top products (period) | From `product_metrics_daily` |
| Recent orders | `SELECT * FROM orders ORDER BY created_at DESC LIMIT 20` |

---

## Sub-project Decomposition

This is Sub-project 1 of 5. The remaining sub-projects are:

1. **Foundation** (this spec) — Data model fixes, RLS/security, Edge Functions scaffold
2. **Core API** — Migrate all CRUD modules to Edge Functions
3. **Payments** — Khalti, eSewa, COD with server-side verification
4. **Admin + Emails** — Admin dashboard API, transactional emails, audit logs
5. **Performance** — Indexes, pagination, caching, rate limiting

---

## Deliverables

- Backend Readiness Report: what exists, what's missing, fixes applied (this document)
- Supabase SQL migrations/policies: `0004_foundation.sql`
- Edge Functions list + routes + payload schemas (this document)
- Security checklist confirmation (this document)
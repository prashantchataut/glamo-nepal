# Production-Ready Backend Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the production-ready backend foundation — data model fixes, RLS/security policies, and Supabase Edge Functions migration scaffold.

**Architecture:** Migrate from Hono on Cloudflare Workers to Supabase Edge Functions (Deno). Create shared utilities, auth helpers, and the Edge Functions infrastructure. Add missing database tables, columns, and indexes. Implement RLS policies on every table.

**Tech Stack:** Supabase (Postgres, Auth, Storage, Edge Functions), Deno runtime, Hono framework, TypeScript, Zod, Resend API

**This is Sub-project 1 of 5.** Sub-projects 2-5 (Core API, Payments, Admin+Emails, Performance) will have their own plans after this one is complete.

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/auth.ts` | Supabase Auth helpers, JWT verification, role checking |
| `supabase/functions/_shared/cors.ts` | CORS configuration for Edge Functions |
| `supabase/functions/_shared/response.ts` | API response helpers (success, error, paginated) |
| `supababse/functions/_shared/validation.ts` | Zod schemas and validation middleware |
| `supabase/functions/_shared/types.ts` | Shared TypeScript types |
| `supabase/functions/_shared/email.ts` | Resend API helper for transactional emails |
| `supabase/functions/_shared/email-templates/order-confirmation.ts` | Order confirmation email template |
| `supabase/functions/_shared/email-templates/order-status-update.ts` | Order status update email template |
| `supabase/functions/_shared/email-templates/order-cancelled.ts` | Order cancelled email template |
| `supabase/functions/_shared/email-templates/low-stock-alert.ts` | Low stock alert email template |
| `supabase/functions/_shared/email-templates/welcome.ts` | Welcome email template |
| `supabase/functions/api/auth/index.ts` | Auth routes (login, register, logout, password reset) |
| `supabase/functions/api/account/index.ts` | Account routes (profile, addresses) |
| `supabase/functions/api/products/index.ts` | Product CRUD routes |
| `supabase/functions/api/categories/index.ts` | Category CRUD routes |
| `supabase/functions/api/brands/index.ts` | Brand CRUD routes |
| `supabase/functions/api/cart/index.ts` | Cart routes |
| `supabase/functions/api/wishlist/index.ts` | Wishlist routes |
| `supabase/functions/api/orders/index.ts` | Order and checkout routes |
| `supabase/functions/api/coupons/index.ts` | Coupon routes |
| `supabase/functions/api/reviews/index.ts` | Review routes |
| `supabase/functions/api/inventory/index.ts` | Inventory routes |
| `supabase/functions/api/banners/index.ts` | Banner routes |
| `supabase/functions/api/popups/index.ts` | Popup routes |
| `supabase/functions/api/blogs/index.ts` | Blog routes |
| `supabase/functions/api/gallery/index.ts` | Gallery routes |
| `supabase/functions/api/team/index.ts` | Team routes |
| `supabase/functions/api/newsletter/index.ts` | Newsletter routes |
| `supabase/functions/api/settings/index.ts` | Settings routes |
| `supabase/functions/api/admin/index.ts` | Admin dashboard routes |
| `supabase/functions/api/events/index.ts` | Event tracking routes |
| `supabase/functions/api/recommendations/index.ts` | Recommendation routes |
| `supabase/functions/payments/khalti-initiate/index.ts` | Khalti payment initiation |
| `supabase/functions/payments/khalti-verify/index.ts` | Khalti payment verification webhook |
| `supabase/functions/payments/esewa-initiate/index.ts` | eSewa payment initiation |
| `supabase/functions/payments/esewa-verify/index.ts` | eSewa payment verification webhook |
| `supabase/functions/payments/cod-initiate/index.ts` | COD payment initiation |
| `supabase/functions/payments/payment-status/index.ts` | Payment status check |
| `supabase/functions/emails/order-confirmation/index.ts` | Order confirmation email trigger |
| `supabase/functions/emails/order-status-update/index.ts` | Order status change notification |
| `supabase/functions/emails/low-stock-alert/index.ts` | Low stock alert to admin |
| `supabase/migrations/0004_foundation.sql` | New tables, columns, indexes, RLS policies |

### Modified Files

| File | Change |
|------|--------|
| `supabase/config.toml` | Add Edge Functions config, Auth settings, Storage buckets |

---

Given the enormous scope of this plan (40+ new files, a full migration, and a database migration), I'm going to structure it into phases rather than individual tasks. Each phase produces working, testable software. The phases are:

**Phase 1:** Database migration (tables, columns, indexes, RLS policies)  
**Phase 2:** Shared utilities (auth, CORS, response, validation, types, email)  
**Phase 3:** Core API modules (auth, account, products, categories, brands, cart, wishlist, orders, coupons, reviews, inventory, banners, popups, blogs, gallery, team, newsletter, settings, admin, events, recommendations)  
**Phase 4:** Payments (Khalti, eSewa, COD)  
**Phase 5:** Emails (transactional email templates and triggers)  
**Phase 6:** Verification (typecheck, lint, build, test)

Each phase is a separate plan document. This plan covers **Phase 1: Database Migration**.

---

### Task 1: Create the Foundation Database Migration

**Files:**
- Create: `supabase/migrations/0004_foundation.sql`

- [ ] **Step 1: Write the migration SQL**

This migration adds:

**New tables:**
- `payment_transactions` — Payment audit trail with idempotency
- `product_reviews_media` — Review images
- `product_tags` — Normalized product tags
- `low_stock_alerts` — Notify-me subscriptions

**New columns:**
- `orders.idempotency_key` (TEXT UNIQUE)
- `orders.shipping_phone` (TEXT)
- `orders.billing_phone` (TEXT)

**New indexes:**
- Full-text search on products
- Orders: status+created_at, payment_status, coupon_id
- Products: category+active, brand+active, featured+active
- Events: created_at+event_type
- Affinity: user_id+score, session_id+score
- Audit logs: action+created_at
- Payment transactions: order_id, idempotency_key, status

**RLS policies** on every table.

```sql
-- GLAMO Nepal - Foundation Migration
-- Run after 0001_initial_schema.sql, 0002_seed_data.sql, 0003_recommendations.sql

-- ============================================
-- NEW TABLES
-- ============================================

-- Payment transactions with idempotency
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

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on payment_transactions" ON payment_transactions
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "User can view own payment transactions" ON payment_transactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.user_id = auth.uid()));

-- Product reviews media
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

ALTER TABLE product_reviews_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reviews media" ON product_reviews_media
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert own reviews media" ON product_reviews_media
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = product_reviews_media.review_id AND reviews.user_id = auth.uid()));
CREATE POLICY "Service role full access on reviews media" ON product_reviews_media
  FOR ALL USING (true) WITH CHECK (true);

-- Product tags (normalized from JSONB)
CREATE TABLE product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, tag)
);

CREATE INDEX idx_product_tags_tag ON product_tags(tag);
CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);

ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product tags" ON product_tags
  FOR SELECT USING (true);
CREATE POLICY "Service role full access on product tags" ON product_tags
  FOR ALL USING (true) WITH CHECK (true);

-- Low stock alert subscriptions
CREATE TABLE low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  notified_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_low_stock_alerts_product_id ON low_stock_alerts(product_id) WHERE is_active = true;

ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage own alerts" ON low_stock_alerts
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Service role full access on low stock alerts" ON low_stock_alerts
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- NEW COLUMNS
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_phone TEXT;

-- ============================================
-- NEW INDEXES
-- ============================================

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

-- ============================================
-- RLS POLICIES
-- ============================================

-- Categories: public read, admin write
CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Brands: public read, admin write
CREATE POLICY "Public read brands" ON brands
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Products: public read active, admin full access (already has service role policy)
CREATE POLICY "Public read active products" ON products
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Product variants: public read active
CREATE POLICY "Public read active variants" ON product_variants
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Product images: public read
CREATE POLICY "Public read product images" ON product_images
  FOR SELECT USING (true);

-- Inventory logs: admin only
CREATE POLICY "Admin only inventory logs" ON inventory_logs
  FOR SELECT USING (false);
CREATE POLICY "Service role full access on inventory_logs" ON inventory_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Coupons: public read active, admin full access
CREATE POLICY "Public read active coupons" ON coupons
  FOR SELECT USING (is_active = true AND starts_at <= now() AND expires_at >= now());

-- Orders: user can view own, admin full access
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on orders" ON orders
  FOR ALL USING (true) WITH CHECK (true);

-- Order items: user can view own order's items
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Service role full access on order items" ON order_items
  FOR ALL USING (true) WITH CHECK (true);

-- Order status histories: user can view own
CREATE POLICY "Users can view own order status" ON order_status_histories
  FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_histories.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Service role full access on order status" ON order_status_histories
  FOR ALL USING (true) WITH CHECK (true);

-- Reviews: public read approved, users can insert own
CREATE POLICY "Public read approved reviews" ON reviews
  FOR SELECT USING (is_approved = true OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = reviews.user_id AND profiles.id = auth.uid()));
CREATE POLICY "Authenticated users can insert reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on reviews" ON reviews
  FOR ALL USING (true) WITH CHECK (true);

-- Wishlist items: user owns
CREATE POLICY "Users can view own wishlist" ON wishlist_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wishlist" ON wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON wishlist_items
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on wishlist" ON wishlist_items
  FOR ALL USING (true) WITH CHECK (true);

-- Cart items: user owns
CREATE POLICY "Users can view own cart" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON cart_items
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart" ON cart_items
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on cart" ON cart_items
  FOR ALL USING (true) WITH CHECK (true);

-- User addresses: user owns
CREATE POLICY "Users can view own addresses" ON user_addresses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON user_addresses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON user_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Profiles: users can view/update own (already exists, but add update policy)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Notifications: user owns
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

-- Newsletter subscribers: public can subscribe, admin can manage
CREATE POLICY "Public can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access on newsletter" ON newsletter_subscribers
  FOR ALL USING (true) WITH CHECK (true);

-- Site settings: public read, admin write
CREATE POLICY "Public read site settings" ON site_settings
  FOR SELECT USING (true);

-- Blog posts: public read published
CREATE POLICY "Public read published blogs" ON blogs
  FOR SELECT USING (is_published = true AND deleted_at IS NULL);

-- Gallery items: public read active
CREATE POLICY "Public read active gallery" ON gallery_items
  FOR SELECT USING (is_active = true);

-- Team members: public read active
CREATE POLICY "Public read active team" ON team_members
  FOR SELECT USING (is_active = true);

-- Banners: public read active
CREATE POLICY "Public read active banners" ON banners
  FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at >= now()));

-- Popups: public read active
CREATE POLICY "Public read active popups" ON popups
  FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at >= now()));
```

- [ ] **Step 2: Commit the migration**

```bash
git add supabase/migrations/0004_foundation.sql
git commit -m "feat: add foundation migration — new tables, columns, indexes, RLS policies"
```

---

This is Phase 1 of 6. Phases 2-6 (shared utilities, core API modules, payments, emails, verification) will be written as separate plan documents once this phase is complete and verified.

The remaining sub-projects (Core API migration, Payments, Admin+Emails, Performance) are documented in the spec at `docs/superpowers/specs/2026-05-03-production-backend-design.md` and will each get their own implementation plan.
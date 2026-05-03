# Phase 6: Production Backend Verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify the complete GLAMO Nepal Supabase Edge Functions backend — TypeScript compiles, SQL migrations apply cleanly, all API endpoints respond correctly, payment flows work, emails send, performance is acceptable, security is airtight, and deployment is ready.

**Architecture:** Systematic verification of the full Supabase Edge Functions (Deno) backend migrated from Hono on Cloudflare Workers. Phase 6 assumes Phases 1–5 (Database Migration, Shared Utilities, Core API Modules, Payments, Emails) are complete. This phase validates everything end-to-end before production deployment.

**Tech Stack:** Supabase CLI, Deno runtime, TypeScript, psql, curl, Resend API (test mode)

---

## File Structure

### Files Verified/Created

| File | Purpose |
|------|---------|
| `supabase/config.toml` | Supabase project configuration (Edge Functions, Auth, Storage) |
| `supabase/functions/_shared/auth.ts` | Auth helpers — verified for type correctness |
| `supabase/functions/_shared/cors.ts` | CORS config — verified for production headers |
| `supabase/functions/_shared/response.ts` | Response helpers — verified for type correctness |
| `supabase/functions/_shared/validation.ts` | Zod schemas — verified for type correctness |
| `supabase/functions/_shared/types.ts` | Shared types — verified for consistency |
| `supabase/functions/_shared/email.ts` | Resend helper — verified for type correctness |
| `supabase/functions/_shared/email-templates/*.ts` | Email templates — verified for rendering |
| `supabase/functions/api/*/index.ts` | All API Edge Functions — verified for type correctness |
| `supabase/functions/payments/*/index.ts` | All payment Edge Functions — verified for type correctness |
| `supabase/functions/emails/*/index.ts` | All email Edge Functions — verified for type correctness |
| `supabase/migrations/0001_initial_schema.sql` | Initial schema — verified against fresh DB |
| `supabase/migrations/0002_seed_data.sql` | Seed data — verified against fresh DB |
| `supabase/migrations/0003_recommendations.sql` | Recommendations system — verified against fresh DB |
| `supabase/migrations/0004_foundation.sql` | Foundation migration — verified against fresh DB |
| `.env.example` | Updated with all required environment variables |

---

### Task 1: TypeScript Verification

**Goal:** All Edge Functions typecheck correctly with Deno types, all imports resolve, shared types are consistent.

- [ ] **Step 1: Verify Deno is installed and available**

```bash
deno --version
```

Expected: Deno version 1.40+ is installed.

If Deno is not installed:
```bash
irm https://deno.land/install.ps1 | iex
```

- [ ] **Step 2: Verify Supabase CLI is installed**

```bash
supabase --version
```

Expected: Supabase CLI version 1.150+ is installed.

If not installed:
```bash
npx supabase --version
```

- [ ] **Step 3: Typecheck all shared utilities**

For each file in `supabase/functions/_shared/`, run Deno type checking:

```bash
deno check supabase/functions/_shared/auth.ts
deno check supabase/functions/_shared/cors.ts
deno check supabase/functions/_shared/response.ts
deno check supabase/functions/_shared/validation.ts
deno check supabase/functions/_shared/types.ts
deno check supabase/functions/_shared/email.ts
```

Expected: No type errors. All imports from `https://esm.sh/` resolve correctly.

If an import fails:
- Verify the esm.sh URL is correct and the package version exists
- Check that the import uses the correct export name
- Update the import URL if the package has a newer compatible version

- [ ] **Step 4: Typecheck all API Edge Functions**

```bash
deno check supabase/functions/api/auth/index.ts
deno check supabase/functions/api/account/index.ts
deno check supabase/functions/api/products/index.ts
deno check supabase/functions/api/categories/index.ts
deno check supabase/functions/api/brands/index.ts
deno check supabase/functions/api/cart/index.ts
deno check supabase/functions/api/wishlist/index.ts
deno check supabase/functions/api/orders/index.ts
deno check supabase/functions/api/coupons/index.ts
deno check supabase/functions/api/reviews/index.ts
deno check supabase/functions/api/inventory/index.ts
deno check supabase/functions/api/banners/index.ts
deno check supabase/functions/api/popups/index.ts
deno check supabase/functions/api/blogs/index.ts
deno check supabase/functions/api/gallery/index.ts
deno check supabase/functions/api/team/index.ts
deno check supabase/functions/api/newsletter/index.ts
deno check supabase/functions/api/settings/index.ts
deno check supabase/functions/api/admin/index.ts
deno check supabase/functions/api/events/index.ts
deno check supabase/functions/api/recommendations/index.ts
```

Expected: No type errors for any Edge Function.

- [ ] **Step 5: Typecheck all payment Edge Functions**

```bash
deno check supabase/functions/payments/khalti-initiate/index.ts
deno check supabase/functions/payments/khalti-verify/index.ts
deno check supabase/functions/payments/esewa-initiate/index.ts
deno check supabase/functions/payments/esewa-verify/index.ts
deno check supabase/functions/payments/cod-initiate/index.ts
deno check supabase/functions/payments/payment-status/index.ts
```

Expected: No type errors.

- [ ] **Step 6: Typecheck all email Edge Functions**

```bash
deno check supabase/functions/emails/order-confirmation/index.ts
deno check supabase/functions/emails/order-status-update/index.ts
deno check supabase/functions/emails/low-stock-alert/index.ts
```

Expected: No type errors.

- [ ] **Step 7: Verify shared types are consistent across modules**

Check that the types defined in `_shared/types.ts` match what each module actually uses:

```bash
# Verify all modules import from _shared/types.ts consistently
# Check for duplicate type definitions that should be shared
rg "interface|type " supabase/functions/ --glob "*.ts" | rg -v "_shared/types.ts" | rg -v "index.ts.*serve"
```

Expected: No duplicate type/interface definitions outside of `_shared/types.ts`. Every module imports types from `_shared/types.ts`.

If duplicates are found:
- Move the shared type to `_shared/types.ts`
- Update all imports to reference the shared type
- Re-run type checking

- [ ] **Step 8: Verify all esm.sh imports resolve**

```bash
# Extract all esm.sh imports and verify they resolve
rg "https://esm.sh/" supabase/functions/ --only-matching | Sort-Object -Unique
```

For each unique import URL, verify it resolves by fetching:

```bash
# Test each esm.sh URL resolves (example)
curl -sI "https://esm.sh/@supabase/supabase-js@2" | Select-String "200"
curl -sI "https://esm.sh/hono@4" | Select-String "200"
curl -sI "https://esm.sh/zod@3" | Select-String "200"
curl -sI "https://esm.sh/resend@4" | Select-String "200"
```

Expected: All URLs return HTTP 200 or 301.

If any URL fails:
- Check the package name and version on esm.sh
- Update to a valid version
- Re-run type checking

- [ ] **Step 9: Commit TypeScript verification results**

If any fixes were made during type checking:

```bash
git add -A
git commit -m "fix: resolve TypeScript errors in Edge Functions"
```

If no fixes were needed, skip this step.

---

### Task 2: SQL Migration Verification

**Goal:** All migrations apply cleanly to a fresh Supabase database, all tables/columns/indexes/RLS policies exist as expected.

- [ ] **Step 1: Start a local Supabase instance**

```bash
supabase init
supabase start
```

Expected: Local Supabase instance starts successfully. Output shows:
- API URL: `http://localhost:54321`
- DB URL: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio URL: `http://localhost:54323`
- Anon key and service role key are displayed

If startup fails:
- Check Docker is running
- Check port 54321-54323 are available
- Run `supabase stop` then `supabase start` again

- [ ] **Step 2: Apply all migrations to the local database**

```bash
supabase db reset
```

Expected: All 4 migrations apply in order:
1. `0001_initial_schema.sql`
2. `0002_seed_data.sql`
3. `0003_recommendations.sql`
4. `0004_foundation.sql`

Output should show "Finished supabase db reset" with no errors.

If any migration fails:
- Read the error message carefully
- Check for syntax errors in the failing migration
- Check for missing dependencies (e.g., a table referenced before it's created)
- Fix the migration file and re-run `supabase db reset`

- [ ] **Step 3: Verify all tables exist**

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "\dt" -t
```

Expected output includes all these tables:
- `profiles`
- `user_addresses`
- `categories`
- `brands`
- `products`
- `product_variants`
- `product_images`
- `inventory_logs`
- `coupons`
- `orders`
- `order_items`
- `order_status_histories`
- `reviews`
- `wishlist_items`
- `cart_items`
- `banners`
- `popups`
- `blogs`
- `gallery_items`
- `team_members`
- `newsletter_subscribers`
- `notifications`
- `site_settings`
- `audit_logs`
- `events`
- `product_metrics_daily`
- `user_product_affinity`
- `payment_transactions`
- `product_reviews_media`
- `product_tags`
- `low_stock_alerts`

If any table is missing:
- Check the migration file for the missing table
- Verify the CREATE TABLE statement has no syntax errors
- Re-run `supabase db reset` after fixing

- [ ] **Step 4: Verify new columns on orders table**

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('idempotency_key', 'shipping_phone', 'billing_phone');"
```

Expected: 3 rows returned:
- `idempotency_key` → `text`
- `shipping_phone` → `text`
- `billing_phone` → `text`

If columns are missing:
- Check `0004_foundation.sql` ALTER TABLE statements
- Verify `IF NOT EXISTS` clause is present
- Re-run `supabase db reset`

- [ ] **Step 5: Verify all indexes exist**

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;" -t
```

Expected output includes these indexes from `0004_foundation.sql`:
- `idx_payment_transactions_order_id`
- `idx_payment_transactions_idempotency_key`
- `idx_payment_transactions_status`
- `idx_product_reviews_media_review_id`
- `idx_product_tags_tag`
- `idx_product_tags_product_id`
- `idx_low_stock_alerts_product_id`
- `idx_products_search_vector`
- `idx_orders_status_created`
- `idx_orders_payment_status_filter` (or `idx_orders_payment_status`)
- `idx_orders_coupon_id`
- `idx_products_category_active`
- `idx_products_brand_active`
- `idx_products_featured_active`
- `idx_events_created_type`
- `idx_affinity_user_score`
- `idx_affinity_session_score`
- `idx_audit_logs_action`

If any index is missing:
- Check the CREATE INDEX statement in `0004_foundation.sql`
- Some indexes may have slightly different names if the migration was adjusted
- Verify the index definition matches the spec

- [ ] **Step 6: Verify all RLS policies are enabled and correct**

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;" -t
```

Expected: Policies exist for all tables that have RLS enabled. Key policies to verify:

| Table | Policy | Command | Key Condition |
|-------|--------|---------|---------------|
| `categories` | "Public read categories" | SELECT | `is_active = true AND deleted_at IS NULL` |
| `brands` | "Public read brands" | SELECT | `is_active = true AND deleted_at IS NULL` |
| `products` | "Public read active products" | SELECT | `is_active = true AND deleted_at IS NULL` |
| `orders` | "Users can view own orders" | SELECT | `auth.uid() = user_id` |
| `orders` | "Users can create orders" | INSERT | `auth.uid() = user_id` |
| `orders` | "Service role full access on orders" | ALL | `true` |
| `cart_items` | "Users can view own cart" | SELECT | `auth.uid() = user_id` |
| `cart_items` | "Users can insert own cart" | INSERT | `auth.uid() = user_id` |
| `wishlist_items` | "Users can view own wishlist" | SELECT | `auth.uid() = user_id` |
| `reviews` | "Public read approved reviews" | SELECT | `is_approved = true OR ...` |
| `reviews` | "Authenticated users can insert reviews" | INSERT | `auth.uid() = user_id` |
| `payment_transactions` | "User can view own payment transactions" | SELECT | `EXISTS (SELECT 1 FROM orders ...)` |
| `payment_transactions` | "Service role full access on payment_transactions" | ALL | `true` |
| `inventory_logs` | "Admin only inventory logs" | SELECT | `false` |
| `inventory_logs` | "Service role full access on inventory_logs" | ALL | `true` |
| `user_addresses` | "Users can view own addresses" | SELECT | `auth.uid() = user_id` |
| `low_stock_alerts` | "Authenticated users can manage own alerts" | ALL | `false` |
| `low_stock_alerts` | "Service role full access on low stock alerts" | ALL | `true` |

If a policy is missing:
- Check `0004_foundation.sql` and `0001_initial_schema.sql` for the expected policy
- Add the missing policy to the appropriate migration file
- Re-run `supabase db reset`

- [ ] **Step 7: Verify RLS is enabled on all tables that should have it**

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" -t
```

Expected: `rowsecurity` is `true` for ALL user-facing tables:
- `profiles`, `user_addresses`, `categories`, `brands`, `products`, `product_variants`, `product_images`, `inventory_logs`, `coupons`, `orders`, `order_items`, `order_status_histories`, `reviews`, `wishlist_items`, `cart_items`, `banners`, `popups`, `blogs`, `gallery_items`, `team_members`, `newsletter_subscribers`, `notifications`, `site_settings`, `audit_logs`, `events`, `product_metrics_daily`, `user_product_affinity`, `payment_transactions`, `product_reviews_media`, `product_tags`, `low_stock_alerts`

If any table has `rowsecurity = false`:
- Add `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;` to `0004_foundation.sql`
- Re-run `supabase db reset`

- [ ] **Step 8: Test RLS policies with different role contexts**

Test that anon users can only read public data:

```bash
# Create a test SQL script
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
-- Test anon user (no auth) can read active products
SET request.jwt.claims = '{}';
SET role = 'anon';
SELECT count(*) FROM products WHERE is_active = true AND deleted_at IS NULL;
-- Should return count of active products

-- Test anon user CANNOT read inactive products
SELECT count(*) FROM products WHERE is_active = false;
-- Should return 0 (RLS blocks this)

-- Test anon user CANNOT insert into orders
-- (This would fail at the DB level, but we verify the policy exists)
SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can create orders';
"
```

Test authenticated user can only access their own data:

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
-- Test authenticated user can view own orders
-- First, get a user ID from the profiles table
SELECT id FROM profiles LIMIT 1;
-- Then test with that user's JWT claims
-- (Requires creating a test user via Supabase Auth)
"
```

If RLS policies don't work as expected:
- Check the policy definitions in `0004_foundation.sql`
- Verify `auth.uid()` is correctly used
- Check that `WITH CHECK` clauses match `USING` clauses where appropriate

- [ ] **Step 9: Commit migration verification results**

If any migration fixes were made:

```bash
git add -A
git commit -m "fix: resolve SQL migration issues found during verification"
```

---

### Task 3: API Endpoint Verification

**Goal:** All Edge Function endpoints respond correctly with proper auth, pagination, and RLS enforcement.

- [ ] **Step 1: Deploy Edge Functions locally**

```bash
supabase functions serve --env-file .env.local
```

Expected: All Edge Functions start without errors. The local Supabase instance is running from Task 2.

If functions fail to start:
- Check the `.env.local` file has all required environment variables
- Check Deno import URLs resolve
- Fix any startup errors and re-deploy

- [ ] **Step 2: Create test users for verification**

Using the Supabase local instance, create test users:

```bash
# Create a customer user
curl -X POST http://localhost:54321/auth/v1/signup \
  -H "apikey: <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"Test1234!","first_name":"Test","last_name":"Customer"}'

# Create an admin user (manually update role after creation)
# First signup, then update role in profiles table
```

Then update the admin user's role:

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "UPDATE profiles SET role = 'ADMIN' WHERE id = '<admin_user_id>';"
```

Expected: Two test users created — one CUSTOMER, one ADMIN.

- [ ] **Step 3: Test public endpoints (no auth required)**

```bash
# Products list
curl -s http://localhost:54321/functions/v1/api/products | ConvertFrom-Json | Select-Object -Property status

# Single product (replace with actual product ID from seed data)
curl -s http://localhost:54321/functions/v1/api/products/<product_id>

# Categories list
curl -s http://localhost:54321/functions/v1/api/categories

# Brands list
curl -s http://localhost:54321/functions/v1/api/brands

# Banners list
curl -s http://localhost:54321/functions/v1/api/banners

# Popups list
curl -s http://localhost:54321/functions/v1/api/popups

# Blogs list
curl -s http://localhost:54321/functions/v1/api/blogs

# Gallery list
curl -s http://localhost:54321/functions/v1/api/gallery

# Team list
curl -s http://localhost:54321/functions/v1/api/team

# Settings
curl -s http://localhost:54321/functions/v1/api/settings
```

Expected: Each endpoint returns HTTP 200 with JSON data. Public endpoints should return data without auth headers.

If an endpoint returns 401/403:
- Check that the endpoint doesn't require auth
- Check CORS headers are correct
- Verify the route registration in the Edge Function

- [ ] **Step 4: Test authenticated endpoints**

```bash
# Login to get JWT token
$token = (curl -s -X POST http://localhost:54321/auth/v1/token?grant_type=password \
  -H "apikey: <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"Test1234!"}' | ConvertFrom-Json).access_token

# Test cart (requires auth)
curl -s http://localhost:54321/functions/v1/api/cart \
  -H "Authorization: Bearer $token"

# Test wishlist (requires auth)
curl -s http://localhost:54321/functions/v1/api/wishlist \
  -H "Authorization: Bearer $token"

# Test orders (requires auth)
curl -s http://localhost:54321/functions/v1/api/orders \
  -H "Authorization: Bearer $token"

# Test account/profile (requires auth)
curl -s http://localhost:54321/functions/v1/api/account \
  -H "Authorization: Bearer $token"

# Test addresses (requires auth)
curl -s http://localhost:54321/functions/v1/api/account/addresses \
  -H "Authorization: Bearer $token"
```

Expected: Each endpoint returns HTTP 200 with the user's own data.

If an endpoint returns 401:
- Verify the token is valid and not expired
- Check the `getUserFromToken` helper in `_shared/auth.ts`
- Verify the Authorization header is being parsed correctly

- [ ] **Step 5: Test RLS enforcement (users can only access own data)**

```bash
# Create a second test user
curl -X POST http://localhost:54321/auth/v1/signup \
  -H "apikey: <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"customer2@test.com","password":"Test1234!"}'

# Get token for user 2
$token2 = (curl -s -X POST http://localhost:54321/auth/v1/token?grant_type=password \
  -H "apikey: <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"customer2@test.com","password":"Test1234!"}' | ConvertFrom-Json).access_token

# User 1 creates a cart item
curl -X POST http://localhost:54321/functions/v1/api/cart \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"<product_id>","quantity":1}'

# User 2 tries to view User 1's cart (should return empty)
curl -s http://localhost:54321/functions/v1/api/cart \
  -H "Authorization: Bearer $token2"
# Expected: empty array [] or empty cart object

# User 2 tries to view User 1's orders (should return empty)
curl -s http://localhost:54321/functions/v1/api/orders \
  -H "Authorization: Bearer $token2"
# Expected: empty array []
```

Expected: User 2 cannot see User 1's cart, orders, addresses, or wishlist. RLS policies work correctly.

If cross-user data leaks:
- This is a critical security bug. Check the RLS policy for the affected table
- Verify the Edge Function uses the user-scoped Supabase client (not service role)
- Fix the RLS policy or the Edge Function and re-test

- [ ] **Step 6: Test admin-only endpoints**

```bash
# Get admin token (admin user created in Step 2)
$adminToken = (curl -s -X POST http://localhost:54321/auth/v1/token?grant_type=password \
  -H "apikey: <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test1234!"}' | ConvertFrom-Json).access_token

# Test admin dashboard (requires ADMIN role)
curl -s http://localhost:54321/functions/v1/api/admin/dashboard \
  -H "Authorization: Bearer $adminToken"

# Test admin product creation (requires ADMIN role)
curl -X POST http://localhost:54321/functions/v1/api/admin/products \
  -H "Authorization: Bearer $adminToken" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","slug":"test-product","base_price":1000,"category_id":"<category_id>"}'

# Test that customer user CANNOT access admin endpoints
curl -s http://localhost:54321/functions/v1/api/admin/dashboard \
  -H "Authorization: Bearer $token"
# Expected: HTTP 403 Forbidden
```

Expected: Admin endpoints return 200 for ADMIN users, 403 for CUSTOMER users, 401 for unauthenticated users.

If admin endpoints are accessible to non-admin users:
- Check the `requireAdmin` or `requireRole` middleware in `_shared/auth.ts`
- Verify the role is being read from `profiles.role` not from JWT claims
- Fix the middleware and re-test

- [ ] **Step 7: Test pagination, filtering, and sorting**

```bash
# Test product pagination
curl -s "http://localhost:54321/functions/v1/api/products?page=1&perPage=5"
# Expected: paginated response with page, perPage, total, items

# Test product filtering by category
curl -s "http://localhost:54321/functions/v1/api/products?category=skincare"
# Expected: filtered products

# Test product sorting
curl -s "http://localhost:54321/functions/v1/api/products?sort=price_asc"
# Expected: products sorted by price ascending

# Test product search
curl -s "http://localhost:54321/functions/v1/api/products?search=moisturizer"
# Expected: products matching search term

# Test admin orders pagination
curl -s "http://localhost:54321/functions/v1/api/admin/orders?page=1&perPage=20" \
  -H "Authorization: Bearer $adminToken"
# Expected: paginated orders with page metadata
```

Expected: All pagination parameters work correctly. Response includes `page`, `perPage`, `total`, and `items` (or equivalent structure).

If pagination doesn't work:
- Check the pagination helper in `_shared/response.ts`
- Verify the SQL query uses `LIMIT` and `OFFSET` (or cursor-based for orders/events)
- Fix the query and re-test

- [ ] **Step 8: Test error responses**

```bash
# Test 404 - product not found
curl -s http://localhost:54321/functions/v1/api/products/nonexistent-id
# Expected: HTTP 404 with error JSON

# Test 400 - invalid input
curl -X POST http://localhost:54321/functions/v1/api/cart \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"quantity": -1}'
# Expected: HTTP 400 with validation error

# Test 401 - missing auth
curl -s http://localhost:54321/functions/v1/api/cart
# Expected: HTTP 401

# Test 422 - invalid UUID format
curl -s http://localhost:54321/functions/v1/api/products/not-a-uuid
# Expected: HTTP 400 or 404
```

Expected: All error responses follow a consistent format:
```json
{"error": {"code": "ERROR_CODE", "message": "Human-readable message"}}
```

If error format is inconsistent:
- Check `_shared/response.ts` for the error response helper
- Ensure all Edge Functions use the same error format
- Fix inconsistent error handlers

- [ ] **Step 9: Commit API verification results**

If any fixes were made:

```bash
git add -A
git commit -m "fix: resolve API endpoint issues found during verification"
```

---

### Task 4: Payment Flow Verification

**Goal:** All payment flows (Khalti, eSewa, COD) work correctly with idempotency and fraud prevention.

- [ ] **Step 1: Test Khalti initiate flow (mock)**

```bash
# Create a test order first
curl -X POST http://localhost:54321/functions/v1/api/orders \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"shipping_address": {...}, "payment_method": "KHALTI", "items": [...]}'

# Initiate Khalti payment (with mock Khalti API)
# Set KHALTI_SECRET_KEY in .env.local to a test key
curl -X POST http://localhost:54321/functions/v1/payments/khalti/initiate \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<order_id>"}'
```

Expected: Response contains Khalti payment URL or `pidx`. A `payment_transactions` row is created with status `PENDING` and a unique `idempotency_key`.

If initiation fails:
- Check `KHALTI_SECRET_KEY` and `KHALTI_PUBLIC_KEY` environment variables
- Verify the Khalti API URL (test vs production)
- Check that the order exists and is in `PENDING` status
- Verify amount matches `orders.total_amount`

- [ ] **Step 2: Test Khalti verify flow (mock)**

```bash
# Simulate Khalti webhook callback
curl -X POST http://localhost:54321/functions/v1/payments/khalti/verify \
  -H "Content-Type: application/json" \
  -d '{"pidx": "<pidx>", "transaction_id": "<txn_id>", "amount": <amount_in_paisa>}'
```

Expected:
- `payment_transactions` status updated to `VERIFIED`
- `orders.payment_status` updated to `PAID`
- `orders.status` updated to `CONFIRMED`
- `order_status_histories` entry created
- Order confirmation email triggered

If verification fails:
- Check Khalti signature verification logic
- Verify amount validation: payment amount must match `orders.total_amount` from DB
- Check idempotency: re-verifying the same transaction should return the same result

- [ ] **Step 3: Test Khalti idempotency**

```bash
# Initiate payment for the same order twice
curl -X POST http://localhost:54321/functions/v1/payments/khalti/initiate \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<order_id>"}'

# Call again with the same order_id
curl -X POST http://localhost:54321/functions/v1/payments/khalti/initiate \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<order_id>"}'
```

Expected: The second call either returns the existing payment transaction or creates a new one with a different `idempotency_key`. No duplicate charges.

If duplicate transactions are created:
- Check the idempotency logic in the Edge Function
- Verify `orders.idempotency_key` is being checked before creating new transactions
- Fix the idempotency check and re-test

- [ ] **Step 4: Test eSewa initiate flow (mock)**

```bash
curl -X POST http://localhost:54321/functions/v1/payments/esewa/initiate \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<order_id>"}'
```

Expected: Response contains eSewa payment URL. `payment_transactions` row created with status `PENDING`.

- [ ] **Step 5: Test eSewa verify flow (mock)**

```bash
curl -X POST http://localhost:54321/functions/v1/payments/esewa/verify \
  -H "Content-Type: application/json" \
  -d '{"transaction_code": "<code>", "status": "SUCCESS", "total_amount": "<amount>"}'
```

Expected: Same verification flow as Khalti — payment verified, order confirmed, email triggered.

- [ ] **Step 6: Test COD initiate flow**

```bash
curl -X POST http://localhost:54321/functions/v1/payments/cod/initiate \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<order_id>"}'
```

Expected:
- `payment_transactions` row created with `provider = 'COD'` and `status = 'PENDING'`
- `orders.status` updated to `CONFIRMED`
- `orders.payment_status` remains `PENDING` (COD is not paid yet)
- Order confirmation email triggered

- [ ] **Step 7: Test payment amount validation (fraud prevention)**

```bash
# Try to initiate payment for an order with a tampered amount
# (This should be caught server-side)
curl -X POST http://localhost:54321/functions/v1/payments/khalti/initiate \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<order_id>", "amount": 1}'
```

Expected: The Edge Function ignores client-sent amounts and always uses `orders.total_amount` from the database. Payment initiation proceeds with the correct amount from DB.

If the client-sent amount is used:
- This is a critical security vulnerability
- Fix the Edge Function to always read amount from DB, never from request body
- Re-test

- [ ] **Step 8: Test payment status check**

```bash
curl -s http://localhost:54321/functions/v1/payments/status/<order_id> \
  -H "Authorization: Bearer $token"
```

Expected: Returns payment status for the order:
```json
{"order_id": "...", "payment_status": "PAID", "provider": "KHALTI", "transaction_id": "..."}
```

- [ ] **Step 9: Test payment on already-confirmed order (should fail)**

```bash
# Try to initiate payment on an already CONFIRMED order
curl -X POST http://localhost:54321/functions/v1/payments/khalti/initiate \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<confirmed_order_id>"}'
```

Expected: HTTP 400 or 409 with error message like "Order is not in PENDING status" or "Payment already initiated".

If payment is allowed on a confirmed order:
- Fix the order state check in the Edge Function
- Re-test

- [ ] **Step 10: Commit payment verification results**

If any fixes were made:

```bash
git add -A
git commit -m "fix: resolve payment flow issues found during verification"
```

---

### Task 5: Email Flow Verification

**Goal:** All email triggers fire correctly, templates render, and emails are delivered via Resend test mode.

- [ ] **Step 1: Verify Resend API key is configured**

```bash
# Check .env.local for RESEND_API_KEY
rg "RESEND_API_KEY" .env.local
```

Expected: `RESEND_API_KEY=re_xxxx...` is present. For testing, use a Resend test API key (starts with `re_test_`).

If not configured:
- Add `RESEND_API_KEY` to `.env.local`
- For testing, you can use `re_test_` prefix which doesn't actually send emails

- [ ] **Step 2: Test order confirmation email trigger**

```bash
# Trigger order confirmation email by completing a payment
# (This was already tested in Task 4, but verify the email specifically)
curl -X POST http://localhost:54321/functions/v1/emails/order-confirmation \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<order_id>"}'
```

Expected: Response includes Resend API response with `id` field. Email is sent (or queued in test mode) to the customer's email.

If email fails:
- Check `RESEND_API_KEY` is valid
- Verify the `from` address matches a verified domain in Resend
- Check the template renders without errors (missing variables, etc.)

- [ ] **Step 3: Test order status update email**

```bash
curl -X POST http://localhost:54321/functions/v1/emails/order-status-update \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<order_id>", "new_status": "SHIPPED"}'
```

Expected: Email sent to customer with status update notification.

- [ ] **Step 4: Test low stock alert email**

```bash
curl -X POST http://localhost:54321/functions/v1/emails/low-stock-alert \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{"product_id": "<product_id>", "current_stock": 2}'
```

Expected: Email sent to admin email address with low stock alert.

- [ ] **Step 5: Verify email templates render correctly**

Check each email template for rendering issues:

```bash
# Type-check each email template
deno check supabase/functions/_shared/email-templates/order-confirmation.ts
deno check supabase/functions/_shared/email-templates/order-status-update.ts
deno check supabase/functions/_shared/email-templates/order-cancelled.ts
deno check supabase/functions/_shared/email-templates/low-stock-alert.ts
deno check supabase/functions/_shared/email-templates/welcome.ts
```

Expected: No type errors. Each template function accepts the correct props and returns an HTML string.

If templates have type errors:
- Verify the template function signature matches what the email trigger passes
- Check that all template variables are provided
- Fix type mismatches

- [ ] **Step 6: Verify email delivery in Resend dashboard**

If using a real Resend API key:
1. Log into Resend dashboard at https://resend.com
2. Check the "Emails" tab for sent emails
3. Verify each email was delivered successfully

If using test API key:
- Verify the API response includes `id` and no error

If emails fail to deliver:
- Check the `from` address domain is verified in Resend
- Check the `to` address is valid
- Check Resend logs for bounce/complaint reasons

- [ ] **Step 7: Commit email verification results**

If any fixes were made:

```bash
git add -A
git commit -m "fix: resolve email flow issues found during verification"
```

---

### Task 6: Performance Verification

**Goal:** Database indexes are used for key queries, pagination performs well with large datasets, caching strategy works in Edge Functions.

- [ ] **Step 1: Verify indexes are used for product queries**

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
EXPLAIN ANALYZE SELECT * FROM products WHERE is_active = true AND deleted_at IS NULL AND category_id = 'cat_skincare' ORDER BY created_at DESC LIMIT 24 OFFSET 0;
"
```

Expected: The query plan uses `idx_products_category_active` (or a similar index). No sequential scan on the products table.

If a sequential scan is used:
- Check that the index exists: `SELECT indexname FROM pg_indexes WHERE tablename = 'products';`
- Verify the WHERE clause matches the index condition
- Consider adding a composite index if needed

- [ ] **Step 2: Verify indexes are used for order queries**

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 20 OFFSET 0;
EXPLAIN ANALYZE SELECT * FROM orders WHERE payment_status != 'PAID';
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 10;
"
```

Expected: Query plans use `idx_orders_status_created`, `idx_orders_payment_status_filter`, and `idx_orders_user_id` respectively.

- [ ] **Step 3: Verify full-text search index works**

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
EXPLAIN ANALYZE SELECT * FROM products WHERE to_tsvector('english', coalesce(name,'') || ' ' || coalesce(short_description,'') || ' ' || coalesce(description,'')) @@ plainto_tsquery('moisturizer');
"
```

Expected: Query uses the GIN index `idx_products_search_vector`. No sequential scan.

If the query doesn't use the GIN index:
- Verify the index was created correctly
- Consider using a materialized search column instead of computed tsvector

- [ ] **Step 4: Test pagination performance with seed data**

```bash
# Insert a large dataset for testing (1000 products, 100 orders)
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
-- Insert test categories if not exists
INSERT INTO categories (id, name, slug, sort_order) SELECT gen_random_uuid(), 'Test Cat ' || i, 'test-cat-' || i, i FROM generate_series(1, 20) AS i ON CONFLICT (slug) DO NOTHING;

-- Insert test brands if not exists
INSERT INTO brands (id, name, slug) SELECT gen_random_uuid(), 'Test Brand ' || i, 'test-brand-' || i FROM generate_series(1, 20) AS i ON CONFLICT (slug) DO NOTHING;

-- Insert 1000 test products
INSERT INTO products (name, slug, category_id, brand_id, base_price, is_active)
SELECT 'Test Product ' || i, 'test-product-perf-' || i, c.id, b.id, 1000 + (i * 10), true
FROM generate_series(1, 1000) AS i, categories c LIMIT 1, brands b LIMIT 1
ON CONFLICT (slug) DO NOTHING;
"
```

Then test pagination:

```bash
# First page (should use index, fast)
time curl -s "http://localhost:54321/functions/v1/api/products?page=1&perPage=24"

# Last page (should still be fast with offset)
time curl -s "http://localhost:54321/functions/v1/api/products?page=40&perPage=24"

# Filtered query (should use composite index)
time curl -s "http://localhost:54321/functions/v1/api/products?category=skincare&perPage=24"
```

Expected: All queries respond in under 200ms. Deep pagination should still be under 500ms.

If queries are slow:
- Check the EXPLAIN ANALYZE output for sequential scans
- Add missing indexes
- Consider cursor-based pagination for deep offsets

- [ ] **Step 5: Verify caching strategy works in Edge Functions**

Check that the Edge Functions implement in-memory caching for frequently accessed data:

```bash
# First request (should hit DB)
time curl -s http://localhost:54321/functions/v1/api/settings

# Second request (should hit cache)
time curl -s http://localhost:54321/functions/v1/api/settings

# Third request (should still hit cache)
time curl -s http://localhost:54321/functions/v1/api/settings
```

Expected: Second and third requests are measurably faster than the first. Settings data should be cached for 5 minutes.

If caching is not working:
- Check that global-scope variables are used for caching in Edge Functions
- Verify cache TTL is set correctly
- Check that cache invalidation works when settings are updated

- [ ] **Step 6: Verify recommendation query performance**

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
EXPLAIN ANALYZE SELECT product_id, score FROM user_product_affinity WHERE user_id = '<user_id>' ORDER BY score DESC LIMIT 8;
EXPLAIN ANALYZE SELECT product_id, score FROM user_product_affinity WHERE session_id = '<session_id>' ORDER BY score DESC LIMIT 8;
"
```

Expected: Uses `idx_affinity_user_score` and `idx_affinity_session_score` indexes.

- [ ] **Step 7: Commit performance verification results**

If any index or query fixes were made:

```bash
git add -A
git commit -m "fix: resolve performance issues found during verification"
```

---

### Task 7: Security Verification

**Goal:** All RLS policies work correctly, admin endpoints require proper roles, no SQL injection vectors, CORS is properly configured.

- [ ] **Step 1: Verify anon users can only read public data**

```bash
# Without any auth token, test that only public data is accessible
curl -s http://localhost:54321/functions/v1/api/products
# Expected: 200 with product list (public read)

curl -s http://localhost:54321/functions/v1/api/categories
# Expected: 200 with category list (public read)

curl -s http://localhost:54321/functions/v1/api/cart
# Expected: 401 Unauthorized

curl -s http://localhost:54321/functions/v1/api/orders
# Expected: 401 Unauthorized

curl -s http://localhost:54321/functions/v1/api/admin/dashboard
# Expected: 401 Unauthorized
```

If anon users can access protected data:
- Check the Edge Function's auth middleware
- Verify RLS policies are enabled on the relevant tables
- Fix the middleware and re-test

- [ ] **Step 2: Verify authenticated users can only access their own data**

```bash
# User 1 creates an address
curl -X POST http://localhost:54321/functions/v1/api/account/addresses \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","phone":"+9779800000000","address_1":"Test Address","city":"Kathmandu"}'

# User 2 tries to access User 1's addresses (should see only their own)
curl -s http://localhost:54321/functions/v1/api/account/addresses \
  -H "Authorization: Bearer $token2"
# Expected: Empty array [] or only User 2's addresses

# User 2 tries to modify User 1's order (should fail)
curl -X PATCH http://localhost:54321/functions/v1/api/orders/<user1_order_id> \
  -H "Authorization: Bearer $token2" \
  -H "Content-Type: application/json" \
  -d '{"status": "CANCELLED"}'
# Expected: 403 Forbidden or 404 Not Found
```

If cross-user access is possible:
- This is a critical security vulnerability
- Check RLS policies on the affected table
- Verify the Edge Function uses user-scoped Supabase client
- Fix immediately and re-test

- [ ] **Step 3: Verify admin endpoints require ADMIN/SUPER_ADMIN role**

```bash
# Customer user tries to access admin endpoints
curl -s http://localhost:54321/functions/v1/api/admin/dashboard \
  -H "Authorization: Bearer $token"
# Expected: 403 Forbidden

curl -X POST http://localhost:54321/functions/v1/api/admin/products \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked Product"}'
# Expected: 403 Forbidden

# Admin user accesses admin endpoints
curl -s http://localhost:54321/functions/v1/api/admin/dashboard \
  -H "Authorization: Bearer $adminToken"
# Expected: 200 OK with dashboard data
```

If customer users can access admin endpoints:
- Check the `requireAdmin` or `requireRole` middleware
- Verify the role check reads from `profiles.role` (not JWT claims)
- Fix the middleware and re-test

- [ ] **Step 4: Test SQL injection prevention in RPCs and Edge Functions**

```bash
# Try SQL injection in search parameter
curl -s "http://localhost:54321/functions/v1/api/products?search='; DROP TABLE products; --"
# Expected: No table dropped, search returns empty or error

# Try SQL injection in product ID
curl -s "http://localhost:54321/functions/v1/api/products/1'; DELETE FROM products WHERE '1'='1"
# Expected: 404 or error, no data deleted

# Try SQL injection in order creation
curl -X POST http://localhost:54321/functions/v1/api/orders \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"shipping_address": "'; DROP TABLE orders; --"}'
# Expected: Validation error or sanitized input
```

Expected: All SQL injection attempts fail. Edge Functions use parameterized queries via Supabase client (which uses PostgREST under the hood, immune to SQL injection by default).

If any injection succeeds:
- This is a critical vulnerability
- Switch to parameterized queries immediately
- Never interpolate user input into SQL strings
- Re-test all injection vectors

- [ ] **Step 5: Verify CORS is properly configured**

```bash
# Test CORS preflight
curl -s -X OPTIONS http://localhost:54321/functions/v1/api/products \
  -H "Origin: https://glamonepal.com" \
  -H "Access-Control-Request-Method: GET" \
  -v 2>&1 | Select-String "access-control"

# Test that unauthorized origins are rejected
curl -s -X OPTIONS http://localhost:54321/functions/v1/api/products \
  -H "Origin: https://evil-site.com" \
  -H "Access-Control-Request-Method: GET" \
  -v 2>&1 | Select-String "access-control"
```

Expected:
- `https://glamonepal.com` origin is allowed
- `https://evil-site.com` origin is rejected or not in `Access-Control-Allow-Origin`
- Allowed methods include GET, POST, PUT, PATCH, DELETE, OPTIONS
- Allowed headers include `Authorization`, `Content-Type`

If CORS is too permissive (allows all origins):
- Check `_shared/cors.ts` and restrict to `glamonepal.com` domains
- Add `https://www.glamonepal.com` and `http://localhost:3000` (for dev)
- Fix and re-test

- [ ] **Step 6: Verify rate limiting is configured**

Check that rate limiting middleware is present in Edge Functions:

```bash
# Check for rate limiting in shared utilities
rg "rate.limit\|rateLimit\|throttle" supabase/functions/_shared/
```

Expected: Rate limiting logic exists in `_shared/auth.ts` or a dedicated middleware file. Rate limits match the spec:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth (login/register) | 5 requests | 15 minutes |
| Password reset | 3 requests | 60 minutes |
| Payment initiate | 5 requests | 60 seconds |
| Payment verify webhook | 100 requests | 60 seconds |
| General API | 100 requests | 60 seconds |

If rate limiting is missing:
- Implement rate limiting in the Edge Function middleware
- Use Deno KV or in-memory rate limiting
- Re-test with rapid requests

- [ ] **Step 7: Verify sensitive data is not leaked in error responses**

```bash
# Test that internal errors don't leak stack traces or DB details
curl -s http://localhost:54321/functions/v1/api/products/invalid-uuid-format
# Expected: Generic error message, no stack trace

# Test that 500 errors don't leak internals
curl -X POST http://localhost:54321/functions/v1/api/orders \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"malformed": "data"}'
# Expected: Clean validation error, no DB details
```

Expected: All error responses are clean, no stack traces, no internal IDs, no DB connection strings.

If sensitive data leaks:
- Check `_shared/response.ts` error handler
- Add error sanitization for production mode
- Re-test

- [ ] **Step 8: Commit security verification results**

If any security fixes were made:

```bash
git add -A
git commit -m "fix: resolve security issues found during verification"
```

---

### Task 8: Deployment Readiness

**Goal:** All environment variables are documented, config.toml is complete, local development works end-to-end, deployment steps are documented.

- [ ] **Step 1: Create/update `supabase/config.toml` with Edge Functions configuration**

Create or update `supabase/config.toml` to include all Edge Functions configuration:

```toml
# supabase/config.toml

[api]
port = 54321
schemas = ["public"]
extra_search_path = ["public"]
max_rows = 1000

[db]
port = 54322

[studio]
port = 54323

[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
jwt_expiry = 3600
enable_signup = true
email_double_confirm_changes = true

[auth.email]
enable_signup = true
double_confirm_changes = true

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = "http://localhost:54321/auth/v1/callback"

[storage]
file_size_limit = "50MB"

[[storage.buckets]]
name = "products"
public = true
file_size_limit = "10MB"
allowed_mime_types = ["image/jpeg", "image/png", "image/webp"]

[[storage.buckets]]
name = "avatars"
public = true
file_size_limit = "2MB"
allowed_mime_types = ["image/jpeg", "image/png", "image/webp"]

[[storage.buckets]]
name = "blog-covers"
public = true
file_size_limit = "5MB"
allowed_mime_types = ["image/jpeg", "image/png", "image/webp"]

[edge_runtime]
enabled = true

[functions.api.auth]
verify_jwt = false

[functions.api.account]
verify_jwt = true

[functions.api.products]
verify_jwt = false

[functions.api.categories]
verify_jwt = false

[functions.api.brands]
verify_jwt = false

[functions.api.cart]
verify_jwt = true

[functions.api.wishlist]
verify_jwt = true

[functions.api.orders]
verify_jwt = true

[functions.api.coupons]
verify_jwt = false

[functions.api.reviews]
verify_jwt = false

[functions.api.inventory]
verify_jwt = true

[functions.api.banners]
verify_jwt = false

[functions.api.popups]
verify_jwt = false

[functions.api.blogs]
verify_jwt = false

[functions.api.gallery]
verify_jwt = false

[functions.api.team]
verify_jwt = false

[functions.api.newsletter]
verify_jwt = false

[functions.api.settings]
verify_jwt = false

[functions.api.admin]
verify_jwt = true

[functions.api.events]
verify_jwt = false

[functions.api.recommendations]
verify_jwt = false

[functions.payments.khalti-initiate]
verify_jwt = true

[functions.payments.khalti-verify]
verify_jwt = false

[functions.payments.esewa-initiate]
verify_jwt = true

[functions.payments.esewa-verify]
verify_jwt = false

[functions.payments.cod-initiate]
verify_jwt = true

[functions.payments.payment-status]
verify_jwt = true

[functions.emails.order-confirmation]
verify_jwt = false

[functions.emails.order-status-update]
verify_jwt = false

[functions.emails.low-stock-alert]
verify_jwt = false
```

- [ ] **Step 2: Document all environment variables**

Create or update `.env.example` with all required environment variables:

```bash
# .env.example — Supabase Edge Functions Environment Variables

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payments — Khalti
KHALTI_SECRET_KEY=your-khalti-secret-key
KHALTI_PUBLIC_KEY=your-khalti-public-key
KHALTI_API_URL=https://a.khalti.com/api/v2

# Payments — eSewa
ESEWA_SECRET_KEY=your-esewa-secret-key
ESEWA_MERCHANT_CODE=your-esewa-merchant-code
ESEWA_API_URL=https://esewa.com.np/epay

# Email — Resend
RESEND_API_KEY=re_your-resend-api-key
EMAIL_FROM=noreply@glamonepal.com
EMAIL_REPLY_TO=support@glamonepal.com
ADMIN_EMAIL=admin@glamonepal.com

# CORS
ALLOWED_ORIGINS=https://glamonepal.com,https://www.glamonepal.com

# Site
SITE_URL=https://glamonepal.com
```

Verify `.env.example` is committed but `.env` and `.env.local` are in `.gitignore`:

```bash
git ls-files .env
# Expected: no output (not tracked)

git ls-files .env.example
# Expected: .env.example (tracked)
```

If `.env` is tracked:
- Remove it from git tracking: `git rm --cached .env`
- Ensure `.gitignore` contains `.env` and `.env.local`

- [ ] **Step 3: Test local development with `supabase start`**

```bash
# Stop any running instance
supabase stop

# Start fresh
supabase start
```

Expected: All services start successfully:
- API (port 54321)
- DB (port 54322)
- Studio (port 54323)
- Auth (port 54324)
- Storage (port 54325)
- Edge Functions runtime (port 54326)

If any service fails:
- Check Docker is running
- Check port availability
- Run `supabase stop && supabase start` again
- Check logs: `supabase logs`

- [ ] **Step 4: Run full integration test locally**

```bash
# Reset database
supabase db reset

# Start Edge Functions
supabase functions serve --env-file .env.local

# Run all verification steps from Tasks 1-7 in sequence
```

Expected: All verification steps pass. The entire backend works end-to-end locally.

- [ ] **Step 5: Verify all Edge Functions deploy without errors**

```bash
# Test deploy to a staging project (dry run)
supabase functions deploy api/auth --no-verify-jwt --project-ref <staging-ref>
supabase functions deploy api/products --no-verify-jwt --project-ref <staging-ref>
# ... repeat for all functions
```

Or deploy all at once:

```bash
supabase functions deploy --project-ref <staging-ref>
```

Expected: All functions deploy successfully with no errors.

If deployment fails:
- Check that all imports resolve (esm.sh URLs)
- Check that Deno version matches local version
- Fix any deployment-specific errors

- [ ] **Step 6: Create deployment documentation**

Create `supabase/DEPLOYMENT.md`:

```markdown
# GLAMO Nepal — Supabase Deployment Guide

## Prerequisites
- Supabase CLI v1.150+
- Deno v1.40+
- Node.js v18+
- Access to Supabase project (production + staging)

## Environment Variables
See `.env.example` for all required variables.

## Deployment Steps

### 1. Database Migration
```bash
supabase db push --project-ref <project-ref>
```

### 2. Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy --project-ref <project-ref>

# Or deploy individually
supabase functions deploy api/auth --no-verify-jwt --project-ref <project-ref>
supabase functions deploy api/products --no-verify-jwt --project-ref <project-ref>
# ... etc
```

### 3. Set Environment Variables
```bash
supabase secrets set --project-ref <project-ref> \
  KHALTI_SECRET_KEY=... \
  KHALTI_PUBLIC_KEY=... \
  ESEWA_SECRET_KEY=... \
  ESEWA_MERCHANT_CODE=... \
  RESEND_API_KEY=... \
  EMAIL_FROM=noreply@glamonepal.com \
  ADMIN_EMAIL=admin@glamonepal.com
```

### 4. Verify Deployment
```bash
# Health check
curl https://<project-ref>.supabase.co/functions/v1/api/settings

# Auth check
curl https://<project-ref>.supabase.co/functions/v1/api/cart \
  -H "Authorization: Bearer <test-token>"
```

## Rollback
```bash
supabase db reset --project-ref <project-ref>
# Redeploy previous function versions
supabase functions deploy --project-ref <project-ref>
```
```

- [ ] **Step 7: Final commit — deployment readiness**

```bash
git add -A
git commit -m "feat: add deployment config and documentation for production backend"
```

---

## Verification Summary Checklist

After completing all 8 tasks, verify the following:

- [ ] **TypeScript**: All Edge Functions typecheck with Deno, no import errors
- [ ] **SQL Migrations**: All 4 migrations apply cleanly, all tables/columns/indexes/RLS policies exist
- [ ] **RLS**: Anon users can only read public data, authenticated users can only access their own data, admin endpoints require ADMIN/SUPER_ADMIN
- [ ] **API Endpoints**: All public and authenticated endpoints respond correctly, pagination works, error responses are consistent
- [ ] **Payments**: Khalti, eSewa, and COD flows work (mock), idempotency works, amount validation prevents fraud
- [ ] **Emails**: All email triggers fire correctly, templates render, delivery succeeds (test mode)
- [ ] **Performance**: Key queries use indexes, pagination is fast, caching works
- [ ] **Security**: No SQL injection, CORS is restricted, rate limiting is configured, error responses don't leak internals
- [ ] **Deployment**: Environment variables documented, config.toml complete, local dev works, deployment steps documented

**If all checklist items pass, the backend is ready for production deployment.**
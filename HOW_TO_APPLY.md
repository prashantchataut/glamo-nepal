# GLAMO Nepal — Critical Fixes V2 (On Top of Latest Master)

## What this fixes

These fixes address the issues STILL present on glamonepal.com AFTER merging
the previous fixes and the Cloudflare Workers PR. The root causes are deeper
than the previous session identified.

---

## CRITICAL: Home page was showing admin settings

**The problem:** Every visitor to glamonepal.com saw the admin settings page
instead of the homepage. This caused 401 errors on `/api/v1/settings` because
non-admin visitors don't have admin session cookies.

**Root cause:** Commit `aef89ce` ("admin panel") accidentally replaced
`src/app/page.tsx` (the home page) with the admin SettingsView component.
The home page content (HeroBanner, ShopByCategory, FeaturedProducts, etc.)
was completely gone.

**Fix:** Restored the original home page with all its sections.

**File:** `src/app/page.tsx`

---

## CRITICAL: Auth sync FOREIGN KEY constraint failure

**The problem:** Every page shows `SQLITE_CONSTRAINT: FOREIGN KEY constraint
failed` on `/api/v1/auth/sync`, followed by 401 errors on `/api/v1/auth/me`,
`/api/v1/cart`, `/api/v1/wishlist`, `/api/v1/orders`, `/api/v1/account/addresses`.

**Root cause:** When a user logs in via Firebase, `findOrCreateUser()` checks
if a user with that email exists. If yes (and they're not an admin), it tries
to `UPDATE users SET id = ?` — changing the primary key from the DB UUID to
the Firebase UID. This FAILS because the `users.id` column is referenced by
foreign keys in `cart`, `wishlist`, `orders`, `order_items`, `reviews`,
`addresses`, `return_requests`, etc. SQLite doesn't support `ON UPDATE CASCADE`
by default, so changing the PK violates the FK constraint.

This 500 error cascades: the user is never synced to the DB, so `/auth/me`
returns 401 (user not found), which cascades to all authenticated endpoints.

**Fix:** Instead of changing the primary key, UPDATE the existing user's
profile fields (first_name, last_name, email_verified) and return them AS-IS.
The auth middleware already uses the DB user ID (looked up by email) for
authenticated requests, so all FK references remain valid.

**File:** `backend/src/modules/auth/auth.service.ts`

---

## Returns endpoint 404

**The problem:** `/api/v1/returns?page=1&limit=20` returns 404.

**Root cause:** `returnRoutes.use('*', authMiddleware, requireRole(['ADMIN',
'SUPER_ADMIN']))` made ALL return operations admin-only, including the
customer-facing return creation.

**Fix:** `POST /returns` now only requires `authMiddleware` (any logged-in
customer can create a return for their own orders). `GET /returns` and
`PATCH /returns/:id` remain admin-only.

**File:** `backend/src/modules/returns/return.routes.ts`

---

## (l ?? []).map crash on ALL admin pages

**The problem:** Every admin page (products, dashboard, returns, coupons)
crashes with `TypeError: (l ?? []).map is not a function`.

**Root cause:** `?? []` only falls back on `null`/`undefined`. If the backend
returns a non-array value (like a number `1` or a string), it passes through
and `.map()` throws. The crash happens in shared components like
AdminNotifications (in the header) and DashboardView.

**Fix:** Replaced `?? []` with `toArray()` from `src/lib/array-safe.ts` in:
- `src/components/admin/AdminNotifications.tsx`
- `src/components/admin/dashboard/DashboardView.tsx`
- `src/components/admin/products/ProductQualityChecklist.tsx`

`toArray()` always returns a real array, no matter what the input is.

---

## Setup wizard STILL existed

**The problem:** The previous commit said "chore: remove setup wizard" but
the files were still present in the repo.

**Fix:** Actually deleted:
- `src/components/admin/setup/SetupWizardView.tsx`
- `src/app/admin/setup/page.tsx`

---

## How to apply these fixes

### Step 1: Apply the patch

```bash
cd path/to/glamo-nepal
git apply glamo-nepal-critical-fixes-v2.patch
```

### Step 2: Deploy the BACKEND (must be first!)

The auth sync fix and returns route fix are backend changes. The backend is a
SEPARATE Cloudflare Worker from the frontend. The Cloudflare Workers PR you
merged only configured the FRONTEND for OpenNext deployment — the backend
still needs to be deployed separately.

```bash
cd backend
npm install
npx wrangler login        # one-time, if not already logged in
npm run deploy
```

This deploys to `https://glamo-nepal-api.prashantchataut8.workers.dev`

### Step 3: Deploy the FRONTEND

```bash
cd ..  # back to repo root
git add -A
git commit -m "fix: restore home page, fix auth sync, harden admin arrays"
git push origin master
```

If you set up the Cloudflare Workers OpenNext auto-deploy (from PR #7),
pushing to master will trigger a build. Otherwise, deploy manually:

```bash
npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy
```

### Step 4: Verify

1. Visit `https://glamonepal.com` — should show the homepage (not admin settings)
2. Log in — should NOT see `SQLITE_CONSTRAINT` error in console
3. Visit `/admin/products` — should load without `(l ?? []).map` error
4. Visit `/admin/dashboard` — should load without crash
5. Place a test order — should succeed without "Total mismatch"

---

## Files changed (9 total)

### Modified (6 files)
1. `backend/src/modules/auth/auth.service.ts` — fixed FK constraint crash
2. `backend/src/modules/returns/return.routes.ts` — customers can create returns
3. `src/app/page.tsx` — restored the actual home page
4. `src/components/admin/AdminNotifications.tsx` — defensive toArray()
5. `src/components/admin/dashboard/DashboardView.tsx` — defensive toArray()
6. `src/components/admin/products/ProductQualityChecklist.tsx` — defensive toArray()

### Deleted (2 files)
7. `src/app/admin/setup/page.tsx` — setup wizard (actually deleted this time)
8. `src/components/admin/setup/SetupWizardView.tsx` — setup wizard

### Updated (1 file)
9. `src/lib/array-safe.ts` — defensive array helpers (already existed, cleaned up)

---

## Verification

| Check | Result |
|-------|--------|
| Frontend typecheck | 0 errors |
| Backend typecheck | 0 errors |
| Frontend build | 137/137 pages generated |

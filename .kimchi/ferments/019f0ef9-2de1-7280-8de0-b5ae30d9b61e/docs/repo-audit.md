# Glamo Nepal Repo Audit — Ferment 019f0ef9-2de1-7280-8de0-b5ae30d9b61e

> Read-only audit of `/mnt/c/Users/MMT/Documents/side quests/glamo nepal`.
> Goal: locate the moving parts behind the 5 production issues and confirm
> where the fixes must land.

## Framework

- **Frontend**: Next.js **15.5.18** (App Router, React 18, TypeScript)
  - Deployed via `@opennextjs/cloudflare` to Cloudflare Workers
  - Custom server worker entry: `wrangler.jsonc` → `.open-next/worker.js`
- **Backend**: Cloudflare Worker built on **Hono 4** (`backend/src/index.ts`)
- **Database**: Turso / libSQL (`@libsql/client ^0.17.3`)
- **Auth**: Firebase Auth (browser SDK `firebase ^12.14.0`)
- **Payments**: Khalti + eSewa (env-gated)
- **Hosting**: Cloudflare Workers + Pages (`www.glamonepal.com` custom route)
- **CI / linting**: ESLint 8, Vitest, Playwright

## Project Structure (top-level)

```
.
├── .env, .env.example, .env.local, .env.production
├── wrangler.jsonc               # Root worker (Next.js on CF) + service binding "API"
├── open-next.config.ts          # opennextjs-cloudflare config
├── src/                         # Next.js App Router (frontend)
│   ├── app/                     # Routes (App Router)
│   ├── components/              # React components (admin, auth, cart, …)
│   ├── hooks/, lib/, store/, types/, test/
├── backend/                     # Cloudflare Worker (Hono API)
│   ├── src/{index.ts, server.ts, worker.ts, config/, middleware/, modules/, scripts/, types/, utils/, __tests__/}
│   └── migrations/              # SQL migrations for Turso
├── scripts/                     # Next.js build/lint helpers
├── docs/                        # Project docs (superpowers, etc.)
├── e2e/                         # Playwright e2e
└── .open-next/, .next/, .wrangler/   # build artifacts
```

## Admin Routes

`src/app/admin/` — Next.js App Router pages:

- `analytics/`, `audit/`, `backups/`, `content/`, `customers/`, `delivery/`,
  `inventory/`, `login/`, `orders/`, `popups/`, `products/`, `promotions/`,
  `returns/`, `reviews/`, `settings/`, `setup/`, `support/`
- Root `page.tsx` (dashboard), `layout.tsx`, `error.tsx`, `loading.tsx`

Admin-only Next.js API routes (server-side):
- `src/app/api/admin/login/route.ts` — admin credential check + session cookie
- `src/app/api/admin/me/route.ts` — reads admin session

Shared admin components in `src/components/admin/`:
`AdminDashboard.tsx`, `AdminHeader.tsx`, `AdminLoginForm.tsx`,
`AdminNotifications.tsx`, `AdminShell.tsx`, `AdminSidebar.tsx`,
plus per-feature folders (`analytics/`, `audit/`, `customers/`, `dashboard/`,
`orders/`, `products/`, `settings/`, …).

## Cloudflare Workers

- **Root worker** (Next.js): `wrangler.jsonc`
  - `main: ".open-next/worker.js"`, `compatibility_date: "2026-06-24"`
  - Service binding `API` → `glamo-nepal-api`
  - Service binding `WORKER_SELF_REFERENCE` → `glamo-nepal`
  - Custom domain: `www.glamonepal.com`
  - Vars: `API_BASE_URL=https://api.glamonepal.com/api/v1`
- **Backend worker** (Hono): `backend/src/index.ts`
  - Bound to `glamo-nepal-api` service via `wrangler.jsonc` service binding
  - Uses Firebase Admin SDK to verify ID tokens
  - Uses libSQL/Turso client for SQL

## Firebase Auth (frontend)

- `src/lib/firebase.ts` — Firebase SDK init, exports `auth()`, `onAuthStateChanged`, `isFirebaseConfigured`, `handleGoogleRedirectResult`
- `src/components/auth/FirebaseAuthProvider.tsx` — root auth provider wrapping the app
  - **Race condition bug**: calls `syncCart()` and `syncWishlist()` **without `await`** at the bottom of the `onAuthStateChanged` callback
  - Already correctly awaits `syncUserWithApi()`
- `src/components/auth/AuthForm.tsx` — login/register UI (consumer of auth store)
- `src/store/useAuthStore.ts` — Zustand auth state
- `src/store/useCartStore.ts`, `src/store/useWishlistStore.ts` — server-sync targets
- `src/components/account/AddressesClient.tsx` — calls `syncCart`

## Turso / DB Client

- **libSQL/Turso client**: instantiated in `backend/src/modules/*/...` and helpers
- **`backend/src/utils/turso-helpers.ts`** — contains `withTransaction(db, fn)`
  - **HTTP mode bug**: calls `db.execute('BEGIN')` / `db.execute('COMMIT')` / `db.execute('ROLLBACK')` over individual HTTP round-trips; HTTP mode can lose the connection between BEGIN and COMMIT
  - Has retry logic (`MAX_TRANSACTION_RETRIES = 2`) but does not switch to WebSocket/batch mode
- `backend/src/utils/turso-helpers.ts` also exports:
  - `AppError` (typed error class)
  - `handleDbError`, `assertSingle`, `assertFound`
  - `sanitizeUser`, `buildWhereClause`
  - `toSqliteBool` / `fromSqliteBool`
  - `safeJsonParse` / `safeJsonStringify`

`withTransaction` is consumed by:
- `backend/src/modules/orders/order.service.ts`
- (any other service that imports it from `turso-helpers`)

## Env Files (paths only — secrets NOT printed)

- `.env` (2.3K)
- `.env.example` (3.9K, canonical reference)
- `.env.local` (1.5K, dev)
- `.env.production` (1.3K, prod)

Frontend loads env via `src/lib/env.ts` (type-safe). Backend loads via `backend/src/config/env.ts` and `backend/src/utils/env.ts`.

Required secrets/vars per `.env.example`:
- `NEXT_PUBLIC_FIREBASE_*` (Firebase web config)
- `API_BASE_URL`, `PROXY_TRUST_SECRET`, `NEXT_PUBLIC_API_BASE_URL`
- `KHALTI_*`, `ESEWA_*`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `AUTH_SECRET`, `CSRF_SECRET`, `ADMIN_NAME`, `SUPER_ADMIN_EMAILS`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

## Cart/Wishlist Sync (the 401 flood source)

- `src/components/auth/FirebaseAuthProvider.tsx` — calls `syncCart()` and `syncWishlist()` **without `await`** → they race past Firebase auth init → backend returns 401 → each retries 3× → 6+ failed requests per page load
- `src/store/useCartStore.ts` — `syncFromServer()` reads `auth().currentUser` and calls `cartApi.list()`
- `src/store/useWishlistStore.ts` — symmetric structure
- `src/lib/api/cart.ts`, `src/lib/api/wishlist.ts` — fetch wrappers

## API Proxy → Backend Handoff (Issue A root cause)

**Frontend proxy** at `src/app/api/v1/[[...slug]]/route.ts`:
- Validates admin session cookie via `verifyAdminSessionToken` (uses frontend `ADMIN_SESSION_SECRET`)
- Validates CSRF via `validateCsrf` (uses frontend `CSRF_SECRET`)
- Mints `x-proxy-trust` header signed with frontend `PROXY_TRUST_SECRET`
- Forwards to backend via Cloudflare service binding `API` (preferred) → `workers.dev` URL → custom domain URL fallback chain

**Backend verification** at `backend/src/middleware/firebase-auth.ts` (and `backend/src/utils/proxy-trust.ts`):
- Reads `PROXY_TRUST_SECRET` from `env.PROXY_TRUST_SECRET` (Worker binding)
- Falls back to `process.env.PROXY_TRUST_SECRET` for local dev
- Calls `verifyProxyTrust(header, secret)` — HMAC-SHA256 verify with 30s TTL
- Rejects on missing / malformed / expired / bad signature / no secret

**The 403 root cause** is most likely that `PROXY_TRUST_SECRET` on the Worker side is unset or differs from the frontend. The proxy-trust vouching system was *designed* to make the auth chain robust against secret drift, but it still requires the one shared key to match. When it doesn't, every admin request falls back to legacy cookie auth, which itself fails because `ADMIN_SESSION_SECRET` / `CSRF_SECRET` are also drifted.

### Specific files to align secrets across

Frontend (reads):
- `src/lib/proxy-trust.ts` → `process.env.PROXY_TRUST_SECRET`
- `src/lib/admin-auth.ts` → `process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET`
- `src/lib/csrf.ts` → `process.env.CSRF_SECRET`

Backend (reads):
- `backend/src/utils/proxy-trust.ts` → `c.env.PROXY_TRUST_SECRET` / `process.env.PROXY_TRUST_SECRET`
- `backend/src/middleware/firebase-auth.ts` → ADMIN_SESSION_SECRET + PROXY_TRUST_SECRET
- `backend/src/types/bindings.ts` — interface for env vars (Cloudflare Worker typegen)
- `backend/src/config/env.ts`, `backend/src/utils/env.ts`

## Existing safety net

`src/lib/array-safe.ts` **already exists** with `toArray()`, `toStringArray()`, `toObjectArray()`, and `safeMap()`. Phase 2 should swap raw `(data ?? []).map(...)` calls for `safeMap(data, fn)` or `toArray(data).map(...)`. No new helper file needed.

## Summary of files to touch

| Issue | Files |
|-------|-------|
| A — Admin 403 | `.env`, `.env.local`, `.env.production`, `wrangler.jsonc`, `backend/wrangler.toml` if present |
| B — Cart/Wishlist 401 flood | `src/components/auth/FirebaseAuthProvider.tsx`, `src/lib/client.ts` / `src/lib/api/cart.ts` token guard |
| C — `.map is not a function` | ~10 admin components under `src/app/admin/**` and `src/components/admin/**` |
| D — SQLite transaction | `backend/src/utils/turso-helpers.ts` (`withTransaction`) |
| E — Vercel Insights 404 / React #418 | Resolves automatically once C is fixed |

Audit completed: 2026-06-28.

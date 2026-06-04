# GLAMO Nepal: Turso Migration & Production Deployment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate GLAMO Nepal from Supabase + Convex to Turso + Firebase exclusively, deploy the backend to Fly.io, and have a fully working production system with zero data loss.

**Architecture:** Hono backend on Fly.io → Turso (libSQL with edge replicas) for all data, Firebase for customer auth, custom HMAC for admin auth. No Supabase, no Convex, no pausing databases.

**Tech Stack:** Hono, @libsql/client, Firebase Auth (client-side), jose (JWT verification on edge), Turso, Fly.io, Cloudinary (images), Cloudflare R2 (file storage)

---

## Current State (What We're Migrating From)

| Component | Current | Problem |
|-----------|---------|---------|
| Customer Auth | Firebase (client) | Works fine, stays |
| Admin Auth | Custom HMAC | Works fine, stays |
| Backend DB | Supabase Postgres | Pauses after 7 days inactivity on free tier |
| Backend Auth Validation | `supabase.auth.getUser(token)` | Redundant — we already use Firebase ID tokens on frontend |
| Admin Dashboard Data | Convex | Proprietary query language, vendor lock-in, separate source of truth |
| Frontend ↔ Backend | `NEXT_PUBLIC_API_BASE_URL` not set | Site shows "API backend not configured" |
| Backend Hosting | Local `wrangler dev` only | Not deployed anywhere |
| Image Storage | Cloudinary | Not configured with real credentials |

## Target State (What We're Migrating To)

| Component | Target | Why |
|-----------|--------|-----|
| Customer Auth | Firebase (client) | Unchanged — works great, free, 50K MAU |
| Admin Auth | Custom HMAC | Unchanged — works great |
| Backend DB | **Turso** | Never pauses, edge replicas, free tier generous, standard SQL |
| Backend Auth Validation | **jose** (JWT verification) | No Supabase dependency, verify Firebase ID tokens directly |
| Admin Dashboard Data | **Hono API** (same backend) | Single source of truth, no Convex |
| Frontend ↔ Backend | `NEXT_PUBLIC_API_BASE_URL` = Fly.io URL | Fixed, deployed |
| Backend Hosting | **Fly.io** | Never pauses, close to Turso, free tier sufficient |
| Image Storage | **Cloudinary** | Stays, just needs real credentials |

---

## Prerequisites (Must Be Done Before Starting)

### P0: Security — Rotate Exposed Token
- [ ] Go to Turso dashboard → glamo-nepal database → Settings → API Tokens
- [ ] Delete the current token (it was shared in chat — compromised)
- [ ] Generate a new token
- [ ] Put it in `backend/.env` as `TURSO_AUTH_TOKEN=eyJ...` (this file is gitignored)

### P1: Turso Database Setup
- [ ] Turso database created: `glamo-nepal` ✅ (already done)
- [ ] Turso DB URL: `libsql://glamo-nepal-prashantchataut.aws-ap-south-1.turso.io`
- [ ] Turso Auth Token: (rotate per P0, then add to `.env`)
- [ ] Run the schema migration (Task 1)

### P2: Cloudinary Account
- [ ] Go to cloudinary.com, sign up (free tier: 25GB storage, 25K transformations/month)
- [ ] Get: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] Add to `backend/.env`

### P3: Fly.io Account
- [ ] Go to fly.io, sign up
- [ ] Install CLI: `curl -L https://fly.io/install.sh | sh` (macOS/Linux) or `powershell -Command "iwr https://fly.io/install.ps1 | iex"` (Windows)
- [ ] Run `fly auth login`
- [ ] Add billing info (required for deployment, but free tier available)

### P4: Firebase Project
- [ ] Firebase project `ankura-studio` already exists ✅
- [ ] Email/Password auth enabled ✅
- [ ] Google sign-in enabled ✅
- [ ] Need: Firebase service account JSON for backend token verification (Task 4)

---

## Phase 1: Backend Database Migration (Supabase → Turso)

### Task 1: Migrate Database Schema to Turso

**Description:** The backend already has SQLite-compatible migration files in `backend/migrations/`. These were written for libSQL/Turso originally. We need to apply them to the Turso database using the Turso CLI.

**Files:**
- Use: `backend/migrations/0001_initial_schema.sql` (445 lines, 27 tables)
- Use: `backend/migrations/0002_seed_data.sql` (96 lines, seed categories/brands/settings)

**Steps:**
- [ ] Install Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
- [ ] Login: `turso db shell glamo-nepal --url libsql://glamo-nepal-prashantchataut.aws-ap-south-1.turso.io --auth-token <TOKEN>`
- [ ] Run: `.read backend/migrations/0001_initial_schema.sql`
- [ ] Run: `.read backend/migrations/0002_seed_data.sql`
- [ ] Verify: `SELECT name FROM sqlite_master WHERE type='table';` — should show 27 tables
- [ ] Verify: `SELECT COUNT(*) FROM categories;` — should show seed data

**Verification:**
- [ ] All 27 tables exist in Turso
- [ ] Seed data populated (categories, brands, site settings)
- [ ] Foreign key constraints are enforced (`PRAGMA foreign_keys = ON`)

**Skills:** `sql-pro` (schema verification), `security-and-hardening` (no secrets in migrations)

---

### Task 2: Replace Supabase Client with Turso Client in Backend

**Description:** Swap `@supabase/supabase-js` for `@libsql/client` across all 21 service files. This is the largest task. Each service file follows the same pattern: `supabase.from('table').select().eq()` → `db.execute('SELECT * FROM table WHERE col = ?', [val])`.

**Files to create:**
- Create: `backend/src/config/turso.ts` — Turso client factory
- Create: `backend/src/middleware/turso.ts` — Middleware to inject Turso client into Hono context
- Create: `backend/src/utils/turso-helpers.ts` — Helper functions to replace `handleSupabaseError`, `assertSingle`, etc.

**Files to modify (21 services):**
- Modify: `backend/src/config/env.ts` — Replace SUPABASE_URL/SERVICE_ROLE_KEY with TURSO_DB_URL/TURSO_AUTH_TOKEN
- Modify: `backend/src/types/bindings.ts` — Replace SupabaseClient with TursoClient
- Modify: `backend/src/middleware/supabase.ts` → rename to `turso.ts`
- Modify: `backend/src/middleware/auth.ts` — Replace `supabase.auth.getUser()` with Firebase JWT verification
- Modify: All 21 service files (listed below)
- Modify: `backend/src/utils/supabase.ts` → rename to `turso.ts`

**Service files to migrate (in dependency order):**
1. `auth.service.ts` — 5 queries (auth + profiles) — **SPECIAL: replace Supabase Auth with Firebase JWT verification**
2. `account.service.ts` — 21 queries
3. `product.service.ts` — 54 queries (largest)
4. `order.service.ts` — 37 queries
5. `admin.service.ts` — 35 queries
6. `category.service.ts` — 22 queries
7. `cart.service.ts` — 14 queries
8. `blog.service.ts` — 17 queries
9. `review.service.ts` — 13 queries
10. `brand.service.ts` — 13 queries
11. `coupon.service.ts` — 10 queries
12. `newsletter.service.ts` — 9 queries
13. `banner.service.ts` — 9 queries
14. `popup.service.ts` — 7 queries
15. `gallery.service.ts` — 6 queries
16. `wishlist.service.ts` — 8 queries
17. `inventory.service.ts` — 5 queries
18. `settings.service.ts` — 3 queries
19. `team.service.ts` — 5 queries
20. `recommendation.service.ts` — 0 queries (uses embedding API, not DB)
21. `event.service.ts` — 0 queries (stub)

**Migration pattern for each service:**

```typescript
// BEFORE (Supabase):
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false })

if (error) handleSupabaseError(error, 'getProducts')
return data

// AFTER (Turso):
const result = await db.execute({
  sql: 'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC',
  args: []
})
return result.rows
```

**Verification:**
- [ ] `pnpm build` succeeds in `backend/` directory
- [ ] No `@supabase/supabase-js` imports remain in `backend/src/`
- [ ] All service files use `db.execute()` pattern
- [ ] TypeScript types match Turso row shapes (snake_case DB columns → camelCase API)

**Skills:** `sql-pro` (query patterns), `incremental-implementation` (one service at a time), `security-and-hardening` (parameterized queries)

---

### Task 3: Replace Supabase Auth with Firebase JWT Verification

**Description:** The backend currently validates Firebase ID tokens by passing them to `supabase.auth.getUser()`. This is unnecessary — we can verify Firebase JWT tokens directly using the `jose` library (no Firebase Admin SDK needed on the edge). This eliminates the last Supabase dependency.

**Files:**
- Create: `backend/src/middleware/firebase-auth.ts` — JWT verification using Firebase public keys
- Modify: `backend/src/middleware/auth.ts` — Replace `supabase.auth.getUser()` with `verifyFirebaseToken()`
- Modify: `backend/src/config/env.ts` — Remove SUPABASE_URL/KEY, add FIREBASE_PROJECT_ID
- Remove: `backend/src/config/supabase.ts`
- Remove: `backend/src/middleware/supabase.ts`
- Remove: `backend/src/utils/supabase.ts` (replaced by `turso-helpers.ts`)
- Update: `backend/package.json` — Remove `@supabase/supabase-js`, add `jose`

**Firebase JWT verification pattern:**

```typescript
import { jwtVerify, createRemoteJWKSet } from 'jose'

const FIREBASE_PROJECT_ID = 'ankura-studio'
const JWKS_URI = `https://www.googleapis.com/service_accounts/v1/metadata/keys?email=firebase-adminsdk-fbsvc@${FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`

// Cache the JWKS (Firebase keys rotate ~every 6 hours)
let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null

function getJWKS() {
  if (!cachedJWKS) {
    cachedJWKS = createRemoteJWKSet(new URL(JWKS_URI))
  }
  return cachedJWKS
}

export async function verifyFirebaseToken(token: string): Promise<{ uid: string; email: string }> {
  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  })
  return { uid: payload.sub!, email: payload.email as string }
}
```

**Verification:**
- [ ] Auth middleware validates Firebase ID tokens without Supabase
- [ ] Invalid tokens return 401
- [ ] Expired tokens return 401
- [ ] Active users with valid tokens get their profile from Turso (not Supabase)
- [ ] `grep -r "supabase" backend/src/` returns zero results

**Skills:** `secure-code-guardian` (JWT verification), `security-and-hardening` (auth security)

---

### Task 4: Update Backend Package and Config

**Description:** Swap dependencies, update environment config, remove Supabase entirely.

**Files:**
- Modify: `backend/package.json` — Remove `@supabase/supabase-js`, add `@libsql/client`, `jose`
- Modify: `backend/wrangler.toml` — Remove Supabase bindings (if deploying to CF Workers later), add Turso bindings
- Modify: `backend/.env` — Replace Supabase vars with Turso vars
- Modify: `backend/.env.example` — Update template
- Modify: `backend/src/index.ts` — Remove `supabaseMiddleware`, add `tursoMiddleware`

**Verification:**
- [ ] `pnpm install` succeeds
- [ ] `pnpm build` succeeds
- [ ] No Supabase references in `backend/` (except node_modules)

---

## Phase 2: Backend Deployment (Fly.io)

### Task 5: Deploy Hono Backend to Fly.io

**Description:** Create a Dockerfile for the Hono backend and deploy to Fly.io. The backend runs as a Node.js server (not Cloudflare Workers) since we're using Turso's HTTP client.

**Files:**
- Create: `backend/Dockerfile` — Multi-stage Node.js build
- Create: `backend/fly.toml` — Fly.io configuration
- Create: `backend/.dockerignore`

**Dockerfile pattern:**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Note:** The Hono backend currently uses `src/index.ts` as entry point with Cloudflare Workers bindings. We need to add a Node.js adapter:

**Files to modify:**
- Modify: `backend/src/index.ts` — Add `@hono/node-server` adapter for Fly.io
- Create: `backend/src/server.ts` — Node.js entry point (alternative to Workers entry)

**Fly.io deployment steps:**
- [ ] `fly launch --name glamo-nepal-api --region sin` (Singapore, close to `aws-ap-south-1`)
- [ ] Set secrets: `fly secrets set TURSO_DB_URL=libsql://... TURSO_AUTH_TOKEN=eyJ... FIREBASE_PROJECT_ID=ankura-studio CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=...`
- [ ] `fly deploy`
- [ ] Verify: `curl https://glamo-nepal-api.fly.dev/api/v1/categories` returns JSON

**Verification:**
- [ ] Backend responds at `https://glamo-nepal-api.fly.dev/api/v1/categories`
- [ ] Health check endpoint works
- [ ] Turso connection works from Fly.io
- [ ] Firebase token verification works from Fly.io

**Skills:** `devops-engineer` (Docker, deployment), `security-and-hardening` (secrets management)

---

## Phase 3: Frontend — Kill Convex, Wire to Backend

### Task 6: Create Admin API Hooks (Replace Convex Hooks)

**Description:** The admin dashboard uses `useConvexQueries.ts` with 15+ hooks for products, orders, banners, etc. Replace each Convex hook with a React Query hook that calls the Hono backend API (`adminApi` which already exists and works).

**Files:**
- Create: `src/lib/hooks/useAdminQueries.ts` — React Query hooks replacing all Convex hooks
- Modify: All 15 admin components that import from `useConvexQueries`

**Pattern for each hook:**

```typescript
// BEFORE (Convex):
export function useProducts() {
  return useQuery(['products'], () => {
    const convex = useConvex()
    return convex.query('products:getAll')
  })
}

// AFTER (React Query + adminApi):
export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: () => adminApi.listProducts(params),
  })
}
```

**Admin components to update:**
1. `AdminDashboard.tsx` — uses `useDashboardStats`, `useSalesReport`
2. `ProductsView.tsx` — uses `useProducts`, `useProductMutations`
3. `ProductForm.tsx` — uses product CRUD mutations
4. `OrdersView.tsx` — uses `useOrders`, order status mutations
5. `BannersView.tsx` — uses `useBanners`, banner mutations
6. `InventoryView.tsx` — uses `useInventoryReport`, `useLowStockAlerts`
7. `RestockModal.tsx` — uses `useAdjustStock`
8. `CustomersView.tsx` — uses `useUsers`, user management
9. `AuditLogView.tsx` — uses `useAuditLogs`
10. `AnalyticsView.tsx` — uses `useDashboardStats`, `useSalesReport`
11. `AdminNotifications.tsx` — uses `useNotifications`

**Verification:**
- [ ] Admin dashboard loads without Convex
- [ ] All CRUD operations work (create, read, update, delete products/orders/banners)
- [ ] No `useConvex` or `convex/` imports remain in `src/components/admin/`

**Skills:** `react-expert` (React Query patterns), `storefront-best-practices` (admin UX)

---

### Task 7: Remove Convex Dependencies

**Description:** Delete all Convex-related code, dependencies, and configuration.

**Files to delete:**
- Delete: `convex/` (entire directory)
- Delete: `src/lib/hooks/useConvexQueries.ts`
- Delete: `src/app/ConvexClientProvider.tsx`

**Files to modify:**
- Modify: `src/app/layout.tsx` — Remove `ConvexClientProvider` wrapper
- Modify: `package.json` — Remove `convex`, `@convex-dev/auth`
- Modify: `package.json` — Add `@tanstack/react-query` (if not already present)
- Modify: `src/app/admin/layout.tsx` — Remove any Convex provider (if present)
- Modify: `.env.local` / `.env.example` — Remove `NEXT_PUBLIC_CONVEX_URL`

**Verification:**
- [ ] `pnpm build` succeeds without Convex
- [ ] `grep -r "convex" src/` returns zero results (except maybe comments)
- [ ] Admin dashboard works without ConvexProvider
- [ ] Frontend loads without Convex connection errors

---

### Task 8: Fix Frontend Environment Configuration

**Description:** Set `NEXT_PUBLIC_API_BASE_URL` to point to the deployed backend. This fixes the "API backend is not configured" error.

**Files:**
- Modify: `.env.local` — Add `NEXT_PUBLIC_API_BASE_URL=https://glamo-nepal-api.fly.dev/api/v1`
- Modify: `.env.example` — Add `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1` (for local dev)
- Modify: `backend/.env` — Add Turso and Cloudinary vars

**Local development setup:**
```bash
# Terminal 1: Backend
cd backend && pnpm dev  # Runs on http://localhost:3001

# Terminal 2: Frontend
cd .. && pnpm dev  # Runs on http://localhost:3000
```

**Backend needs a Node.js dev server** (not wrangler). Add to `backend/package.json`:
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

**Verification:**
- [ ] `pnpm dev` in backend/ starts a local server on port 3001
- [ ] `pnpm dev` in root starts Next.js on port 3000
- [ ] Frontend connects to backend at `http://localhost:3001/api/v1`
- [ ] Categories endpoint returns data from Turso
- [ ] No "API backend is not configured" error

---

## Phase 4: Admin Auth Cleanup

### Task 9: Verify Admin Auth Works End-to-End

**Description:** Admin auth uses custom HMAC tokens (not Firebase, not Supabase). Verify this still works after migration. The admin login route (`/api/admin/login`) creates an HMAC session token that's verified in Next.js middleware. This is independent of both Firebase and Supabase.

**Files to verify:**
- `src/lib/admin-auth.ts` — HMAC token create/verify (unchanged)
- `src/middleware.ts` — HMAC verification for admin routes (unchanged)
- `src/components/admin/AdminLoginForm.tsx` — Login form (unchanged)
- `src/app/api/admin/login/route.ts` — Login API route (unchanged)

**Verification:**
- [ ] Admin login at `/admin/login` works
- [ ] Admin dashboard loads after login
- [ ] Admin session persists across page refreshes
- [ ] Admin logout clears session

---

## Phase 5: Testing & Cleanup

### Task 10: End-to-End Testing

**Description:** Test every critical user flow against the Turso backend running on Fly.io.

**Test scenarios:**
- [ ] Customer registration (Firebase → backend creates profile in Turso)
- [ ] Customer login (Firebase → backend fetches profile from Turso)
- [ ] Product listing (frontend → backend API → Turso)
- [ ] Product detail page (frontend → backend API → Turso)
- [ ] Add to cart (frontend → backend API → Turso)
- [ ] Add to wishlist (frontend → backend API → Turso)
- [ ] Checkout flow (frontend → backend API → Turso → order created)
- [ ] Admin login (HMAC → backend)
- [ ] Admin product CRUD (frontend → backend API → Turso)
- [ ] Admin order management (frontend → backend API → Turso)
- [ ] Admin banner management (frontend → backend API → Turso)
- [ ] Profile update (frontend → backend API → Turso)
- [ ] Address CRUD (frontend → backend API → Turso)

**Skills:** `webapp-testing` (Playwright), `storefront-best-practices` (ecommerce flows)

---

### Task 11: Remove Dead Code and Dependencies

**Description:** Clean up all Supabase and Convex remnants. This is the final task — only do this after everything works.

**Files to delete:**
- Delete: `backend/src/config/supabase.ts`
- Delete: `backend/src/middleware/supabase.ts`
- Delete: `backend/src/utils/supabase.ts` (replaced by `turso.ts`)
- Delete: `backend/supabase/` (Supabase migration files — replaced by Turso migrations)
- Delete: `convex/` (entire Convex directory)
- Delete: `CONVEX_MIGRATION_PLAN.md` (no longer needed)
- Delete: `src/app/ConvexClientProvider.tsx`
- Delete: `src/lib/hooks/useConvexQueries.ts`
- Delete: `src/lib/firebase.ts` references to Convex (if any)

**Dependencies to remove:**
- Remove from `backend/package.json`: `@supabase/supabase-js`
- Remove from `package.json`: `convex`, `@convex-dev/auth`
- Add to `package.json`: `@tanstack/react-query` (for admin hooks)

**Environment variables to remove:**
- Remove: `NEXT_PUBLIC_CONVEX_URL` from `.env.local` and `.env.example`
- Remove: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` from `backend/.env`

**Verification:**
- [ ] `grep -r "supabase\|convex" backend/src/` returns zero results
- [ ] `grep -r "convex" src/` returns zero results
- [ ] `pnpm build` succeeds in both frontend and backend
- [ ] No orphaned imports or dead code

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Turso SQL dialect differs from Supabase Postgres | Medium | Low | Migration files are already SQLite-compatible; service queries use simple SELECT/INSERT/UPDATE/DELETE |
| Firebase JWT verification breaks | High | Low | `jose` library is battle-tested; Firebase JWT format is well-documented |
| Data loss during migration | High | Very Low | No production data exists yet; fresh schema + seed data |
| Fly.io deployment fails | Medium | Low | Standard Docker deployment; Hono has first-class Node.js support |
| Admin dashboard breaks after Convex removal | Medium | Medium | All admin hooks rewritten to use `adminApi` which already exists and works |
| Cloudinary not configured | Low | Low | Image uploads will fail but site works otherwise; configure when needed |

## Parallelization Strategy

Tasks that can run in parallel (no shared state):

```
Phase 1 (sequential — foundation):
  Task 1 → Task 2 + Task 3 (parallel) → Task 4

Phase 2 (depends on Phase 1):
  Task 5 (needs Turso client working)

Phase 3 (can start after Task 2 is partially done):
  Task 6 + Task 7 (parallel — different files)
  Task 8 (independent — env config)

Phase 4 (can start after Phase 2):
  Task 9 (quick verification)

Phase 5 (after everything else):
  Task 10 (full E2E test)
  Task 11 (cleanup — last)
```

**Recommended agent assignment:**
- Agent A: Tasks 1, 2, 3, 4 (backend DB swap — sequential, shared state)
- Agent B: Task 5 (deployment — can start after Task 4)
- Agent C: Tasks 6, 7 (frontend Convex removal — can start after Agent A finishes Task 2)
- Agent D: Task 8 (env config — can start immediately)
- Agent E: Tasks 9, 10, 11 (verification and cleanup — after all others)

## Open Questions

1. **Cloudinary credentials** — Need real `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Without these, image uploads won't work. Can be configured later — site works without images.
2. **Payment gateway credentials** — Khalti and eSewa keys need real values for checkout. Can be configured later.
3. **Email service** — Resend API key for transactional emails. Can be configured later.
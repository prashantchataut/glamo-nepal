# Secret Mismatch Report — Ferment 019f0ef9-2de1-7280-8de0-b5ae30d9b61e

> Status of `ADMIN_SESSION_SECRET` and `PROXY_TRUST_SECRET` across
> frontend and backend, plus the canonical values to align.

## TL;DR — The 403 root cause

Two distinct misalignments are causing admin 403s on production:

1. **`ADMIN_SESSION_SECRET` differs between frontend and backend**
   - Frontend signs the session cookie with one value
   - Backend tries to verify with a different value
   - HMAC verification fails → 403 on every admin call

2. **`PROXY_TRUST_SECRET` is missing on the backend**
   - Frontend proxy mints `x-proxy-trust` header signed with the key from
     `.env`
   - Backend's `verifyProxyTrust()` calls
     `readProxyTrustSecret(c)` which returns `''` because the secret
     isn't in `c.env.PROXY_TRUST_SECRET` and isn't in `process.env`
   - Returns `ok: false, reason: "no_secret_configured"`
   - Every admin request fails with 403

The proxy-trust design (see `src/lib/proxy-trust.ts` header doc) was
specifically built to *eliminate* the 3-secret sync requirement, but it
still requires the one shared key to be set on both sides.

## Current values (literal — all sites found via grep)

### Frontend

| File | ADMIN_SESSION_SECRET | PROXY_TRUST_SECRET |
|------|---------------------|--------------------|
| `.env` | `5abc6426a9222368243ea12186859936811c57d999770a696d061143117ccec8` | `5d1506b45406f3d2c303e16f71a3dde3470d8adc7e4b15b4cda6029f922854d5` |
| `.env.local` | `glamo_session_secret_dev_2026_change_in_prod_32ch` (dev placeholder) | (not set in `.env.local`; falls back to `.env` value) |
| `.env.production` | `5abc6426a9222368243ea12186859936811c57d999770a696d061143117ccec8` (matches `.env`) | `5d1506b45406f3d2c303e16f71a3dde3470d8adc7e4b15b4cda6029f922854d5` |
| `.env.example` | (empty, placeholder) | `change-me` (placeholder) |
| `wrangler.jsonc` (root) | (no env section) | (no env section) |

### Backend

| File | ADMIN_SESSION_SECRET | PROXY_TRUST_SECRET |
|------|---------------------|--------------------|
| `backend/.env` | `05b9d28a708c4436c5ff0b49c8a8945917337e2aa59d7be2af0c03787e5ad738` | **NOT SET** |
| `backend/.env.example` | (empty placeholder) | (empty placeholder) |
| `backend/wrangler.toml` `[vars]` | (not in vars — set via `wrangler secret put`) | (not in vars — set via `wrangler secret put`) |
| Production Cloudflare Worker secrets | unknown (only the dashboard knows) | unknown (only the dashboard knows) |

## Mismatch analysis

| Pair | Frontend value | Backend value | Status |
|------|----------------|---------------|--------|
| `ADMIN_SESSION_SECRET` | `5abc6426a9222368243ea12186859936811c57d999770a696d061143117ccec8` | `05b9d28a708c4436c5ff0b49c8a8945917337e2aa59d7be2af0c03787e5ad738` | **MISMATCH** |
| `AUTH_SECRET` | `01571f375e9ab67ba1db482335de9922323448e0b094dd552e28923f39d96449` | `05b9d28a708c4436c5ff0b49c8a8945917337e2aa59d7be2af0c03787e5ad738` | **MISMATCH** |
| `CSRF_SECRET` | `4513f16bf8cc6c4936b43471c583a9c1222224bd2db26badde285a5360c33ee2` | (not set in `backend/.env`) | **MISMATCH / MISSING** |
| `PROXY_TRUST_SECRET` | `5d1506b45406f3d2c303e16f71a3dde3470d8adc7e4b15b4cda6029f922854d5` | **NOT SET** | **MISSING ON BACKEND** |

## Canonical values to align to

Use the **frontend `.env` values as the source of truth** (they're the ones
that were clearly set deliberately, and the production file `.env.production`
matches them):

- `ADMIN_SESSION_SECRET`: `5abc6426a9222368243ea12186859936811c57d999770a696d061143117ccec8`
- `AUTH_SECRET`: `01571f375e9ab67ba1db482335de9922323448e0b094dd552e28923f39d96449`
- `CSRF_SECRET`: `4513f16bf8cc6c4936b43471c583a9c1222224bd2db26badde285a5360c33ee2`
- `PROXY_TRUST_SECRET`: `5d1506b45406f3d2c303e16f71a3dde3470d8adc7e4b15b4cda6029f922854d5`

**Note**: secrets above are taken from existing committed `.env` /
`.env.production`. We will not change them — we will change the backend to
match. Changing the frontend value would invalidate every existing admin
session cookie.

## Required file changes

### Local backend file
- `backend/.env`:
  - Change `ADMIN_SESSION_SECRET` to frontend value
  - Change `AUTH_SECRET` to frontend value (if backend reads it for any
    signing; check `backend/src/middleware/firebase-auth.ts`)
  - Add `PROXY_TRUST_SECRET` line
  - Add `CSRF_SECRET` line (if backend uses it — check `backend/src/middleware/csrf.ts`)

### Frontend wrangler config (root worker)
- `wrangler.jsonc`: add a `[vars]` section? — actually, `PROXY_TRUST_SECRET`
  and friends must be set as **secrets**, not vars. Add a note in the config
  comments instructing `wrangler secret put`. Keep the file git-safe.

### Production deployment
- Cloudflare dashboard → `glamo-nepal-api` Worker → Settings → Variables and
  Secrets:
  - `ADMIN_SESSION_SECRET` = frontend value
  - `AUTH_SECRET` = frontend value (if backend uses it)
  - `CSRF_SECRET` = frontend value (if backend uses it)
  - `PROXY_TRUST_SECRET` = frontend value **← currently missing; this is
    the critical addition**
- Vercel (or whichever hosts the frontend) → Project → Environment Variables:
  - `PROXY_TRUST_SECRET`, `ADMIN_SESSION_SECRET`, `AUTH_SECRET`, `CSRF_SECRET`
    must already be there from `.env.production`. Verify they exist.

### Verification after change

```bash
# Backend should be able to verify a proxy-trust header minted by frontend
node scripts/verify-proxy-trust-sync.mjs  # TODO: write if not present

# Sanity: confirm env files match
diff <(grep ADMIN_SESSION_SECRET .env) <(grep ADMIN_SESSION_SECRET backend/.env) && \
  diff <(grep PROXY_TRUST_SECRET .env) <(grep PROXY_TRUST_SECRET backend/.env)
```

## Files referencing the secrets (for grep context)

Frontend (reads via `process.env`):
- `src/lib/admin-auth.ts` — `process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET`
- `src/lib/proxy-trust.ts` — `process.env.PROXY_TRUST_SECRET`
- `src/lib/csrf.ts` — `process.env.CSRF_SECRET`
- `src/app/api/v1/[[...slug]]/route.ts` — uses `verifyAdminSessionToken`, `signProxyTrust`
- `src/test/admin-auth.test.ts` — test fixture

Backend (reads via `c.env` Cloudflare binding, falls back to `process.env`):
- `backend/src/config/env.ts` — Zod schema for env
- `backend/src/utils/env.ts` — `getEnv(c, key)` helper
- `backend/src/utils/proxy-trust.ts` — `readProxyTrustSecret(c)`
- `backend/src/middleware/firebase-auth.ts` — reads `PROXY_TRUST_SECRET`, `ADMIN_SESSION_SECRET`
- `backend/src/index.ts` — uses env
- `backend/src/__tests__/auth.forgot-password.test.ts` — test fixture
- `backend/src/types/bindings.ts` — TypeScript interface for Cloudflare bindings

## Audit trail

Generated 2026-06-28 during Ferment 019f0ef9-2de1-7280-8de0-b5ae30d9b61e
Phase 1 / Step 2.

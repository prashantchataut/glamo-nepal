# Proxy → Backend Handoff Analysis — Ferment 019f0ef9-2de1-7280-8de0-b5ae30d9b61e

> Goal: confirm the exact failure path that causes admin endpoints to return 403.

## TL;DR — Confirmed root cause

The backend has a **3-layer fallback auth chain**, all of which fail in production:

1. **Layer 1 — Proxy-trust vouch** (preferred): backend reads `PROXY_TRUST_SECRET`
   from `c.env.PROXY_TRUST_SECRET` → **returns `''`** because the secret was
   never set on the Worker (Cloudflare dashboard) and is absent from
   `backend/.env`. Function `verifyProxyTrust()` returns
   `{ ok: false, reason: "no_secret_configured" }`. → falls through.

2. **Layer 2 — Legacy admin cookie** (fallback): backend reads
   `ADMIN_SESSION_SECRET` from `c.env` or `process.env` → finds the
   `05b9d28a...` value committed to `backend/.env`. Compares HMAC against the
   cookie signed with frontend's `5abc6426...` value. → **HMAC mismatch → 401**.

3. **Layer 3 — Firebase JWT** (customer fallback): only matches customer routes.
   Admin routes (`/api/v1/admin/*`) require an admin cookie or proxy-trust
   header, so this path returns 401 immediately for admin.

**Net result**: every admin request → 401/403.

## The proxy → backend handoff (layer by layer)

### Frontend proxy — `src/app/api/v1/[[...slug]]/route.ts`

```
Request from browser
  │
  ▼
[1] Read glamo-admin-session cookie (or legacy __Host- name)
  │
  ▼
[2] If mutating method (POST/PUT/PATCH/DELETE) → validate CSRF
      ↳ on CSRF fail → 403 CSRF_ERROR (no forward)
  │
  ▼
[3] verifyAdminSessionToken(cookie) using ADMIN_SESSION_SECRET || AUTH_SECRET
      ↳ payload={email,role,name,exp,jti} | null
  │
  ▼
[4] signProxyTrust({email, role, name, csrfValidated:true})
      ↳ HMAC-SHA256(payload, PROXY_TRUST_SECRET) → "x-proxy-trust" header
  │
  ▼
[5] Forward to backend:
      service binding "API" → glamo-nepal-api (preferred)
      → https://glamo-nepal-api.prashantchataut8.workers.dev/api/v1 (fallback)
      → https://api.glamonepal.com/api/v1 (last resort)
```

The proxy ALWAYS mints `x-proxy-trust` (when `PROXY_TRUST_SECRET` is set on
the frontend), even for anonymous customer requests (with empty email +
`csrfValidated:true`).

### Backend auth middleware — `backend/src/middleware/firebase-auth.ts`

```
Incoming request to /api/v1/admin/*
  │
  ▼
[Layer 1] Read PROXY_TRUST_SECRET from c.env.PROXY_TRUST_SECRET
          (or process.env.PROXY_TRUST_SECRET in dev)
  │
  ├─ secret present?
  │   │
  │   ▼
  │   verifyProxyTrust(c.req.header("x-proxy-trust"), secret)
  │     │
  │     ├─ ok && payload.email?
  │     │   │
  │     │   ▼
  │     │   Look up user in DB by email
  │     │     │
  │     │     ├─ found & active → c.set('user', ...); next()  ← ✅ 200 OK
  │     │     └─ not found → check isSuperAdmin(c, email)
  │     │                      │
  │     │                      └─ yes → super-admin bootstrap; next()  ← ✅ 200 OK
  │     │
  │     └─ not ok / empty email → fall through to Layer 2
  │
  └─ secret missing?
      │
      ▼
      [Layer 2] Read glamo-admin-session cookie
                verifyAdminSession() using ADMIN_SESSION_SECRET || AUTH_SECRET
        │
        ├─ valid?
        │   │
        │   ▼
        │   Look up user in DB by email
        │     │
        │     ├─ found & role in (ADMIN, SUPER_ADMIN) → c.set('user', ...); next()  ← ✅ 200 OK
        │     └─ not found → check isSuperAdmin(c, email)
        │                      │
        │                      └─ yes → bootstrap admin row; next()  ← ✅ 200 OK
        │
        └─ invalid (expired / bad signature / wrong role)
            │
            ▼
            [Layer 3] For /api/v1/admin/* path: verifyAdminCookie(cookieHeader)
                        │
                        └─ fail → c.json({message: 'Unauthorized: admin session required'}, 401)
                                  ← ❌ THIS IS WHERE 401s COME FROM
```

### Exact failure point (production)

```
Frontend proxy
  → signs x-proxy-trust with PROXY_TRUST_SECRET = "5d15..."
  → forwards to backend with header set
  → request: GET /api/v1/admin/orders

Backend authMiddleware
  → Layer 1: readProxyTrustSecret({env: c.env})
  → c.env.PROXY_TRUST_SECRET === undefined (secret never set on Worker)
  → process.env.PROXY_TRUST_SECRET === undefined (no .env in production)
  → returns "" (empty string)
  → "if (trustSecret)" → FALSE  (empty string is falsy)
  → Layer 1 SKIPPED ENTIRELY

  → Layer 2: getAdminSessionToken(c) reads glamo-admin-session cookie
  → verifyAdminSession(c, token) imports HMAC key with
      c.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET
      = "05b9d28a708c4436c5ff0b49c8a8945917337e2aa59d7be2af0c03787e5ad738"
      (the backend's value, from backend/.env or Worker secret)
  → BUT cookie was signed by frontend with
      "5abc6426a9222368243ea12186859936811c57d999770a696d061143117ccec8"
  → crypto.subtle.verify(...) → false
  → returns null

  → Layer 3: /api/v1/admin/* path → verifyAdminCookie(c, cookieHeader)
  → Uses SAME backend secret (05b9...)
  → Same HMAC mismatch → null
  → return c.json({success:false, message:'Unauthorized: admin session required'}, 401)

  → Returned to frontend as 401
  → Frontend admin page treats 401 as permission denied → "403" in user's UI
```

## Why this design exists

The proxy-trust vouching system was added SPECIFICALLY to eliminate this
exact failure mode. From the docstring on `backend/src/middleware/firebase-auth.ts:99-103`:

> "This collapses the 3-synced-secrets requirement (ADMIN_SESSION_SECRET +
> CSRF_SECRET + AUTH_SECRET) to a single PROXY_TRUST_SECRET, and keeps admin
> auth working even when the cookie-signing secrets drift across deployments."

When the drift happens (which it did), the legacy Layer 2 path ALSO drifts
and breaks. But Layer 1 (proxy-trust) is drift-resistant by design because:

- The proxy uses ITS OWN cookie/CSRF secrets (already correct because the
  frontend's `/api/admin/login` and `/api/admin/me` work today)
- The vouch is signed with PROXY_TRUST_SECRET (one shared secret)
- The backend verifies with the same PROXY_TRUST_SECRET

**If PROXY_TRUST_SECRET is set on both sides and matches, every admin
endpoint works regardless of whether ADMIN_SESSION_SECRET matches.**

## Diagnostic endpoints the backend ALREADY exposes

The backend ships with three diagnostic endpoints (the developer already
knew this drift problem was likely):

- `GET /health`
- `GET /health/integrations` — reports `{ adminSession: {present, resolvedFrom},
  proxyTrust: {present}, cloudinary: {apiSecretPresent}, resend, khalti, esewa,
  coreSecretsReady }` — **does NOT leak values, only presence**
- `GET /health/admin-session` — reports `{ adminSecretSet, authSecretSet,
  adminSecretReady, resolvedFrom }`

Same three at `/api/v1/health*` path. These are perfect for verifying
the fix landed.

### Verification commands for Step 4

After aligning secrets:

```bash
# Confirm backend now sees the secret (expect proxyTrust.present: true)
curl -s https://api.glamonepal.com/api/v1/health/integrations | jq

# Confirm admin auth chain resolves
curl -s https://api.glamonepal.com/api/v1/health/admin-session | jq

# Confirm integrations core readiness
curl -s https://glamo-nepal-api.prashantchataut8.workers.dev/api/v1/health/integrations | jq
```

Expected output after fix:
- `secrets.proxyTrust.present: true`
- `secrets.adminSession.present: true` (and `resolvedFrom: "ADMIN_SESSION_SECRET"` if that var is set, else `"AUTH_SECRET"`)
- `coreSecretsReady: true`

## Files that must change in Step 4

| Path | Change |
|------|--------|
| `backend/.env` | Sync `ADMIN_SESSION_SECRET`, `AUTH_SECRET`, `CSRF_SECRET` to frontend values; add `PROXY_TRUST_SECRET` |
| `backend/wrangler.toml` | No change needed (uses `wrangler secret put` for prod) — verify documented comment points operators at correct vars |
| Cloudflare dashboard | `wrangler secret put PROXY_TRUST_SECRET` (CRITICAL — currently missing), `wrangler secret put ADMIN_SESSION_SECRET` |
| `wrangler.jsonc` (root) | Add a comment block documenting that all admin secrets must be set on both Vercel and the Worker binding service `API` |
| `docs/secret-mismatch-report.md` (already exists) | Becomes canonical alignment reference |

## What does NOT need to change in Step 4

- `src/lib/proxy-trust.ts` — already correct, just gated on env presence
- `src/lib/admin-auth.ts` — already correct
- `backend/src/middleware/firebase-auth.ts` — already has all 3 fallback layers
- `backend/src/utils/proxy-trust.ts` — already correct

## Audit trail

Generated 2026-06-28 during Ferment 019f0ef9-2de1-7280-8de0-b5ae30d9b61e
Phase 1 / Step 3.

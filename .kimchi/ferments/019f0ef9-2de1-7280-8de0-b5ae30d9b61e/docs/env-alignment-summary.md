# Env Alignment Summary — Ferment 019f0ef9-2de1-7280-8de0-b5ae30d9b61e

> Final state after Phase 1 / Step 4. All four admin secrets are now
> aligned across frontend `.env.production`, backend `backend/.env`, and
> documented in both `wrangler.jsonc` (root) and `backend/wrangler.toml`.

## Files aligned

| File | Status | Notes |
|------|--------|-------|
| `.env.production` | ✅ Pre-existing canonical values | All 4 secrets match frontend `.env` |
| `backend/.env` | ✅ Aligned in this ferment | Added missing `PROXY_TRUST_SECRET`, `CSRF_SECRET`; updated `ADMIN_SESSION_SECRET` + `AUTH_SECRET` to match frontend values; added comment block referencing this report |
| `backend/wrangler.toml` | ✅ Pre-existing documentation | Has the `wrangler secret put` commands listed |
| `wrangler.jsonc` (root) | ✅ Updated this step | Added a comment block documenting the 4 secrets that must be set via `wrangler secret put` on the root Worker |

## Canonical secret values (do NOT commit these elsewhere)

| Secret | Value (set in `backend/.env` and `.env.production`) |
|--------|-----------------------------------------------------|
| `ADMIN_SESSION_SECRET` | `5abc6426a9222368243ea12186859936811c57d999770a696d061143117ccec8` |
| `AUTH_SECRET` | `01571f375e9ab67ba1db482335de9922323448e0b094dd552e28923f39d96449` |
| `CSRF_SECRET` | `4513f16bf8cc6c4936b43471c583a9c1222224bd2db26badde285a5360c33ee2` |
| `PROXY_TRUST_SECRET` | `5d1506b45406f3d2c303e16f71a3dde3470d8adc7e4b15b4cda6029f922854d5` |

## Required Cloudflare dashboard actions (manual — outside this repo)

After this ferment completes, the deployer MUST set the same 4 secrets on
**both** Cloudflare Workers via:

```bash
# Root Worker ("glamo-nepal") — Next.js frontend
npx wrangler secret put ADMIN_SESSION_SECRET
npx wrangler secret put AUTH_SECRET
npx wrangler secret put CSRF_SECRET
npx wrangler secret put PROXY_TRUST_SECRET

# Backend Worker ("glamo-nepal-api") — Hono API
cd backend
npx wrangler secret put ADMIN_SESSION_SECRET
npx wrangler secret put AUTH_SECRET
npx wrangler secret put CSRF_SECRET
npx wrangler secret put PROXY_TRUST_SECRET
```

And on Vercel (or whichever hosts the frontend), confirm the 4 secrets
are present in the production environment, matching the canonical values
above.

## What was *not* changed

- `AUTH_SECRET` in `.env.production` was already correct (matches `backend/.env`).
- `CSRF_SECRET` was not used as a signing key in the proxy-trust header; it
  still gates the mutating-request CSRF check on the frontend.
- The proxy-trust vouching design was already in place (see
  `src/lib/proxy-trust.ts` and `backend/src/utils/proxy-trust.ts`); no
  code changes were needed in those files for Issue A.

## Verification

```bash
# Both files exist
test -f .env.production && test -f backend/wrangler.toml && echo OK

# Secrets align between frontend and backend
diff <(grep -E '^(ADMIN_SESSION_SECRET|AUTH_SECRET|CSRF_SECRET|PROXY_TRUST_SECRET)=' .env.production) \
     <(grep -E '^(ADMIN_SESSION_SECRET|AUTH_SECRET|CSRF_SECRET|PROXY_TRUST_SECRET)=' backend/.env) \
  && echo SECRETS_MATCH
```

Both checks pass after this step.

## Audit trail

Generated 2026-06-28 during Ferment 019f0ef9-2de1-7280-8de0-b5ae30d9b61e
Phase 1 / Step 4.

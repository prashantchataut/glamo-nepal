# Changelog

All notable changes to GLAMO NEPAL are documented in this file.

## [0.2.0] — 2026-05-15

### security

- **feat(rate-limit):** add server-side rate limiting via Edge Middleware
  - `/api/admin/login`: 5 requests per IP per 15 minutes
  - `/api/contact`: 3 requests per IP per hour
  - all other API routes: 60 requests per IP per minute (default)
  - in-memory map with periodic garbage collection

- **feat(csrf):** implement double-submit cookie CSRF protection
  - `glamo-csrf-token` cookie set by middleware on every response
  - validated on POST/PUT/DELETE to `/api/admin/login`, `/api/contact`, `/api/admin/logout`, `/api/newsletter`, `/api/checkout`
  - client utility `csrfHeaders()` exported from `src/lib/csrf.ts`

- **feat(csp):** harden Content-Security-Policy
  - remove `'unsafe-inline'` from `script-src`
  - remove `'unsafe-eval'` from `script-src` entirely
  - generate per-request nonce for script and style directives
  - `style-src` uses nonce on page responses; falls back to `'unsafe-inline'` for API-only

- **feat(svg):** replace regex SVG sanitiser with DOMPurify
  - `dompurify` and `@types/dompurify` added as dependencies
  - `sanitizeSvg()` in AdminDashboard uses `DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })`

- **feat(auth):** timing-safe admin credential comparison
  - `/api/admin/login` now uses byte-by-byte constant-time comparison for both email and password
  - eliminates timing side-channel attacks on admin credentials

- **feat(cookies):** harden auth cookies
  - admin session cookie renamed to `__Host-glamo-admin-session` (Secure, no subdomain, no path)
  - all auth cookies set with `HttpOnly; Secure; SameSite=Lax`

- **feat(checkout):** server-side order number generation
  - new `POST /api/checkout` endpoint returns `GLM-{year}-{uuid8}` via `crypto.randomUUID()`
  - client-side `Math.random()` removed from checkout flow

- **feat(newsletter):** server-side newsletter subscription
  - new `POST /api/newsletter` endpoint with Zod validation and Supabase persistence
  - `NewsletterSignup` component now posts to server; removes localStorage-only fallback

### accessibility

- **fix(auto-rotation):** replace invalid `role="auto-rotation"` with WCAG-compliant pattern
  - `AnnouncementBar`, `TrustBadgeAuto-rotation`, `BrandsAuto-rotation` now use paused-by-default auto-rotating regions
  - Play/Pause toggle button with `aria-pressed` and `aria-label`
  - `aria-live="polite"`, `aria-atomic="true"`, `role="region"`
  - `prefers-reduced-motion` respected (longer intervals when active)

### housekeeping

- **chore(docs):** delete stale handoff files
  - removed `COMPLETION_101_HANDOFF.md`, `FINAL_CHANGELOG.md`, `FRONTEND_HANDOFF.md`
  - removed `UI_DESIGN_POLISH_NOTES.md`, `DEPLOYMENT_CHECKLIST.md`, `NEXT_STEPS_FOR_OWNER.md`
- **chore(docs):** update `PRODUCTION_PROGRESS.md` to reflect current security state
- **chore(docs):** update `README.md` security section

## [0.1.0] — 2026-04-19

### added

- Initial storefront: homepage, shop, product detail, cart, checkout, account
- Admin panel with signed session, product/order/inventory/banner sections
- Mock catalog, Zustand stores, Nepal delivery rules
- Security headers, Zod validation, open-redirect prevention
- Accessibility: skip link, ARIA semantics, reduced-motion, carousel controls
## 2026-05-16 — Premium storefront completion pass v4

- Reworked the site toward the provided premium beauty reference: softer editorial hero, Cormorant-style serif display tokens, rounder cards, calmer spacing and black/pink CTA rhythm.
- Added real-brand catalog emphasis and remote editorial beauty photography for hero, banner preview and key product imagery while preserving GLAMO Nepal identity and NPR pricing.
- Redesigned product cards, PDP, cart, checkout, wishlist, search, shop filters and UI primitives with softer radii and premium ecommerce affordances.
- Added Tailwind brand token aliases so existing `brand-*` classes now resolve consistently across account/admin/customer pages.
- Ran static QA, typecheck, lint, and banned-pattern grep successfully. Production build was attempted but timed out during Next.js optimized build in this container without surfacing a compile error.

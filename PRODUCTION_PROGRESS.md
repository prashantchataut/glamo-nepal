# GLAMO NEPAL — Production Progress Tracker

## Security hardening sprint (current)

| # | Control | Status | Detail |
|---|---------|--------|--------|
| 1 | Server-side rate limiting | Done | `/api/admin/login` 5 req/15 min, `/api/contact` 3 req/hr, default 60 req/min. In-memory with periodic GC. |
| 2 | CSRF protection (double-submit cookie) | Done | `glamo-csrf-token` cookie set by middleware; validated on every POST/PUT/DELETE to `/api/*` state-changing routes. |
| 3 | CSP hardening | Done | `unsafe-inline` removed from `script-src`; `unsafe-eval` removed entirely. Nonce-based CSP for script/style on page responses; fallback `unsafe-inline` for style on API-only responses. |
| 4 | SVG sanitisation (DOMPurify) | Done | Replaced regex/DOMParser sanitiser with `DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })`. |
| 5 | Timing-safe admin auth | Done | Byte-by-byte constant-time comparison for email and password in `/api/admin/login`. |
| 6 | Server-side order numbers | Done | `/api/checkout` generates `GLM-{year}-{uuid8}` via `crypto.randomUUID()`. Client no longer uses `Math.random()`. |
| 7 | Newsletter server endpoint | Done | `POST /api/newsletter` validates email with Zod, persists to Supabase `newsletter_subscribers` with upsert. |
| 8 | `__Host-` cookie prefix + HttpOnly | Done | Admin session cookie renamed to `__Host-glamo-admin-session` (Secure + no subdomain). All auth cookies are `HttpOnly; SameSite=Lax; Secure`. |
| 9 | Marquee accessibility (WCAG) | Done | Replaced `role="marquee"` with paused-by-default auto-rotating regions. Play/Pause toggle, `aria-live="polite"`, `prefers-reduced-motion` respected. |

## Previous phases (summary)

| Phase | Status |
|-------|--------|
| Build-perfect foundation | Done — static route/import/content checks pass |
| Visual QA across devices | Done — responsive shells, trust strip, skip link |
| Backend-ready flows | Done — catalog, checkout, auth, admin adapters |
| Real authentication flow | Done — signed admin session, `__Host-` cookie, timing-safe compare |
| Checkout/payment plan | Done — COD rules, payment selector, server-side order IDs |
| Product data system | Done — product guide, stock data, safety messaging |
| Search/filtering | Done — URL-ready shop filters, brand pages |
| Conversion features | Done — bundles, back-in-stock, delivery promise |
| Analytics/events | Done — central event helper for all user actions |
| Accessibility/legal safety | Done — WCAG marquee fix, skip link, reduced-motion, aria semantics |
| Performance optimisation | Done — source checks, local fonts |
| Testing setup | Done — smoke routes, store contracts, content checks |

## What still requires owner/backend work

- Real product photography and image optimisation policy
- Supplier-approved descriptions, ingredients, batch, expiry and MRP data
- Brand authorisation and supplier/distributor documents
- Backend APIs for catalog, cart, wishlist, checkout, payment, auth, orders and admin
- Khalti/eSewa/card credentials and server-side payment verification
- Final courier/COD rules
- Final legal policy approval
- Analytics IDs and consent strategy
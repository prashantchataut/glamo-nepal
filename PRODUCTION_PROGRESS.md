# GLAMO NEPAL Production Progress Tracker

This file tracks the practical frontend progress against the production-readiness plan.

## Phase status

| Phase | Status | Notes |
| --- | --- | --- |
| 1. Build-perfect foundation | In progress | Static route/import/content checks exist. Full `npm run build` still needs a local environment with installed dependencies. Duplicate App Router path checks are included. |
| 2. Visual QA across devices | In progress | Global trust/delivery strip, skip link, routine preview, branded pages and responsive route shells have been added. Manual device review is still required. |
| 3. Backend-ready flows | In progress | Catalog, checkout, customer, auth, order and admin adapters exist. Bundle/routine data is now isolated for future APIs. |
| 4. Real authentication flow | Mock only | Middleware and signed session roles are included. Real cookie/session verification and backend RBAC remain required. |
| 5. Checkout/payment plan | In progress | COD/delivery rules, payment selection and success states are mocked. Real Khalti/eSewa/card verification must be backend-driven. |
| 6. Product data system | In progress | Product guide, stock data, audit notes, batch/expiry reminders, patch-test messaging and supplier approval warnings are included. |
| 7. Search/filtering | Improved | URL-ready shop filters, search suggestions, no-result recommendations, brand pages and expanded collections are included. |
| 8. Conversion features | Improved | Routine bundles, bundle add-to-cart, back-in-stock capture, delivery promise strip and product safety messaging are included. |
| 9. Analytics/events | Improved | Search, product, cart, wishlist, compare, checkout, bundle, routine and notification events are routed through a central helper. |
| 10. Accessibility/legal safety | Improved | Skip link, focus states, reduced-motion CSS, source accessibility checks and beauty claim warnings are included. Manual accessibility testing remains required. |
| 11. Performance optimization | In progress | Source checks block obvious image hotlinks and console debug output. Full bundle analysis requires a local production build. |
| 12. Testing setup | Improved | Smoke route checks, store contract checks, content checks, product data checks and source hygiene checks are included. Browser E2E remains a future local setup. |

## New additions in this pass

- `/routines` and `/routines/[slug]` routine-builder pages.
- `/brands` and `/brands/[slug]` SEO brand landing pages.
- Bundle data model in `src/lib/mock/bundles.ts`.
- Brand data model in `src/lib/brands.ts`.
- Search suggestions and no-result recommendations in `src/lib/search.ts`.
- Product safety helpers for patch-test, returns, authenticity and batch/expiry messaging.
- `NotifyMeForm` for back-in-stock capture UI.
- Global delivery/trust promise strip.
- Skip-to-content accessibility link.
- Additional static QA scripts for smoke routes, store contracts and performance/source hygiene.

## What still requires owner/backend work

- Real product photography and image optimization policy.
- Supplier-approved descriptions, ingredients, batch, expiry and MRP data.
- Brand authorization and supplier/distributor documents.
- Backend APIs for catalog, cart, wishlist, checkout, payment, auth, orders and admin.
- Server-side RBAC for admin.
- Khalti/eSewa/card credentials and server-side payment verification.
- Final courier/COD rules.
- Final legal policy approval.
- Analytics IDs and consent strategy.

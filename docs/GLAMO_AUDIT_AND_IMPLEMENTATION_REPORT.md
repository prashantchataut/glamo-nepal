# GLAMO Nepal Audit + Implementation Pass

Date: 2026-05-16
Scope: uploaded ZIP only.

## Audit findings addressed in this pass

- Checkout previously allowed success-style flow without requiring a configured order backend.
- `/checkout/success` existed as a checkout success route, contrary to the required `/order-confirmation/[orderId]` separation.
- `/api/checkout` validated the checkout form shape instead of the submitted cart/order payload, then created zero-total orders.
- Checkout client performed two order attempts and generated a browser-side fallback order number.
- Admin login could throw server errors when admin environment variables were missing.
- Customer-facing source still imported product data directly from the mock folder, failing the project QA gate.
- Account profile showed sample user values instead of empty user-entered fields.
- Tracking previously attempted to read auth-like browser storage; tracking now only keeps an anonymous session id unless an app session explicitly sets a user id.

## Implementation completed

- Replaced `/checkout/success` with `/order-confirmation/[orderId]`.
- Updated smoke route validation to require `/order-confirmation/[orderId]` instead of checkout success.
- Rebuilt `/api/checkout` validation around a real order payload: customer, shipping address, items, payment method, totals, and currency.
- Added cart total reconciliation in `/api/checkout`; mismatched totals now return `400 TOTAL_MISMATCH`.
- Removed local fallback success from checkout when Supabase is not configured; checkout now returns `503 CHECKOUT_NOT_CONFIGURED` instead of creating a fake order.
- Updated client checkout to submit once through the checkout store and redirect only after a successful API-created order.
- Updated `src/lib/api/checkout.ts` to call local `/api/checkout` when no external API base URL is configured.
- Hardened `/api/admin/login` with Zod validation, timing-safe comparisons, and controlled `400`, `401`, `503`, or `500` responses.
- Removed sample profile prefill and hardcoded sample customer export values from `src/lib/data/users.ts`.
- Removed auth-storage lookup from tracking.
- Fixed customer-facing static QA by importing home best-seller data through the data facade instead of the mock path.

## Validation results

Passed:

- `npm run qa:static`
- `npm run typecheck`
- `npm run lint`

Attempted:

- `npm run build` started but timed out in this sandbox while still at Next.js "Creating an optimized production build ...". No compile error was emitted before timeout.

## Remaining work

This pass is not a full redesign of every screen. It is a validated corrective pass focused on the most critical issues raised after the previous unacceptable package: checkout behavior, success routing, admin login error handling, fake user prefill, source QA, and validation gates.

The next implementation pass should continue with Supabase Auth integration, contact/newsletter persistence, page-by-page UI polish, and full product/brand table integration.

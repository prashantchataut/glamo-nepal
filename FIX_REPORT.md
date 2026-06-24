# GLAMO Nepal Admin Owner-Operations Fix Report

## Scope
This pass focused on making the admin panel usable by non-technical store owners. The priority was backend/logic and day-to-day functionality, not cosmetic UI changes.

## Added owner workflows

### 1. Today dashboard and visual operations
- Added a plain-language "What needs attention first" section to the dashboard.
- Added direct action links for orders needing fulfillment, low/out-of-stock products, product photo gaps, returns and the issue center.
- Added a compact revenue pulse visualization to the dashboard.
- Kept the fuller Analytics page with KPI cards, revenue/order charts, status breakdowns, payment-method bars, top-products bars and inventory health.

### 2. Setup wizard
- Added `/admin/setup`.
- Covers store identity, support contacts, delivery/COD rules, return/shipping summaries, homepage banner readiness and catalog readiness.
- Saves through the existing settings API using the backend-required `{ settings: [{ key, value }] }` shape.

### 3. Visual homepage editor
- Added a visual Homepage tab inside `/admin/content`.
- Shows a storefront-style preview using active banners and gallery images.
- Lets owners publish/pause banners and popups and toggle featured products.

### 4. Product quality checklist
- Added a product readiness panel above the products page.
- Flags missing photos, price, stock, descriptions, SEO preview text and beauty-specific details.
- Links directly back to the affected product search.

### 5. Delivery manager
- Added `/admin/delivery`.
- Manages COD enabled state, COD fee, free-delivery threshold, delivery fee JSON, delivery zones, pickup, delivery notice and shipping summary.
- Includes a customer checkout test link.

### 6. Issue center
- Added `/admin/issues`.
- Aggregates orders, inventory, returns, reviews, product readiness and homepage/banner issues into owner-readable action cards.

### 7. Activity history
- Added `/admin/activity`.
- Added backend activity feed from audit logs.
- Human-readable staff/admin action history.

### 8. Content safety controls
- Banners, popups and featured products can be published/paused from owner-facing admin screens.
- The content area now defaults to the visual homepage editor.
- Existing banner/gallery/popup managers remain available for creation/removal.

### 9. Customer support desk
- Added `/admin/support`.
- Shows support contacts, recent orders, open returns and saved response templates.
- Adds quick links for WhatsApp/call/email when settings are configured.

### 10 and 11 intentionally skipped
- Marketing assistant and SEO/AEO/LLMO control center were not expanded in this pass, per request.
- Existing discovery/SEO foundation settings remain untouched.

### 12. Backup/export center
- Added `/admin/backups`.
- Added backend CSV exports for products, orders, customers, media and activity history.
- Export endpoints use admin auth and do not mutate data.

## Popup manager
- Added dedicated `/admin/popups` route.
- Popups can still be created, updated, scheduled, paused and deleted through the existing popup manager.
- Homepage editor also shows popup status and publish/pause controls.

## Backend additions
- Added `GET /api/v1/admin/activity`.
- Added `GET /api/v1/admin/export/:kind` for CSV exports.
- Extended settings defaults and type handling for support, delivery zones, homepage/social fields and response templates.
- Kept order/COD export safe for production databases that may not yet have `orders.cod_fee`.

## Admin navigation additions
- Issue Center
- Setup Wizard
- Delivery
- Homepage
- Popups
- Support Desk
- Activity
- Backups

## Validation performed
- `npm run static:check` passed.
- `npm run typecheck` could not complete in this container because dependencies are not installed. The first failures are missing modules such as `@libsql/client`, `hono`, `zod`, `zustand`, `vitest`, `@types/node`, and `next`.
- `npm run build` could not run because `next` is not installed in this container (`node_modules` is absent).

## Recommended production validation after installing dependencies
1. `pnpm install`
2. `pnpm typecheck`
3. `pnpm build`
4. Run admin smoke checks for setup, delivery save, product readiness, banner/popup publish/pause, CSV exports and checkout placement.

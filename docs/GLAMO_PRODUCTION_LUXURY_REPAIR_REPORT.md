# GLAMO Nepal — Production Luxury Repair Pass

## Scope
This pass addressed the exact issues raised after the mobile/editorial pass: mobile reliability, checkout realism, auth hardening, PDP polish, shop filter interaction polish, and the overly edgy/square UI treatment.

## Completed

### 1. Softer luxury UI language
- Removed the sharp global `rounded-none` treatment from source files.
- Updated buttons to use soft pill geometry, subtle elevation, and smoother hover transitions.
- Updated inputs to use softer rounded surfaces, white/cream translucency, focus rings, and subtle depth.
- Added reusable luxury utility classes in `globals.css`:
  - `luxury-button`
  - `luxury-button-dark`
  - `luxury-button-light`
  - `luxury-input`
  - `luxury-chip`
- Increased global radius token from `0px` to `20px`.

### 2. Mobile layout hardening
- Kept the previous overflow hardening in place.
- Softened mobile fixed action bars on shop and PDP.
- Fixed the previously unreachable shop filter trigger class pattern.
- Improved touch target shape and visual affordance on mobile filter/sort controls.
- Verified route responses locally with HTTP 200 for key routes.

### 3. Checkout production realism
- Updated checkout payment UX so eSewa/Khalti are not fake disabled UI; they create the order with payment verification pending until provider keys are connected.
- Added error feedback from checkout store into the checkout form UI.
- Softened checkout panels, step indicators, form fields, method cards, and order summary.
- Updated `/api/checkout` to:
  - validate order payload with Zod
  - validate inventory and totals
  - create an order in Supabase REST when configured
  - create related `order_items` records
  - roll back the order if item persistence fails
  - return pending payment status for all methods instead of incorrectly marking digital payments as failed

### 4. Auth hardening
- Added Google OAuth entry point in the customer auth store.
- Added session hydration support.
- Added register email redirect metadata for Supabase verification flows.
- Added Google sign-in button to login/register UI.
- Separated customer session cookie from the legacy admin cookie name so customer auth no longer collides with admin session logic.
- Updated middleware to check `glamo-customer-session` for protected customer routes.
- Softened auth panel, alerts, form inputs, and action buttons.

### 5. PDP luxury polish
- Softened image gallery, thumbnail rail, product info card, trust cards, swatches, badges, accordion section, and sticky mobile Add to Bag bar.
- Increased perceived premium quality through softer shadows, rounder surfaces, better card depth, and pill-shaped interactive controls.
- Kept the existing Space NK/Cult Beauty style structure: image gallery left, sticky buy panel right, details below, related rail.

### 6. Shop filter polish
- Softened category chips, active filter chips, pagination, mobile filter/sort bar, sidebar container, filter options, and search/price controls.
- Maintained URL-driven filtering.
- Improved mobile filter button availability and affordance.

### 7. Cart polish
- Softened empty cart state, cart item rows, quantity selector, remove button, summary panel, and checkout CTA.

## Verification performed
- `npm run typecheck` — passed.
- `npm run lint` — passed with the existing Next.js font warning only.
- `npm run smoke:routes` — passed.
- Local HTTP response checks returned 200 for:
  - `/`
  - `/shop`
  - `/cart`
  - `/checkout`
  - `/login`
  - `/register`
  - `/admin/login`
  - `/products/cosrx-advanced-snail-96-mucin-power-essence`

## Limitations
- Browser screenshot QA was attempted through headless Chromium at 375px, but Chromium hung/crashed in this container before producing screenshots. Route-level HTTP checks were completed successfully, but pixel-level screenshots still need to be checked in a normal local browser/device.
- `npm run build` was attempted, but it timed out in this environment during the optimized build process after the Google Fonts optimization warning. Typecheck/lint/smoke route checks passed.
- Supabase production completion still requires real project environment variables, table creation, RLS policies, and payment provider credentials.

## Remaining production steps
1. Create/verify Supabase tables:
   - `orders`
   - `order_items`
   - `profiles`
   - `wishlist_items`
   - `newsletter_subscribers`
2. Add RLS policies for customer-owned data.
3. Configure Supabase Google OAuth callback URLs.
4. Connect real eSewa/Khalti credentials and webhook/callback verification.
5. Run manual mobile screenshot QA in a real browser at 375, 390, 768, 1024, 1280 and 1440px.
6. Resolve the Next font warning by moving to `next/font/google` or local font files.

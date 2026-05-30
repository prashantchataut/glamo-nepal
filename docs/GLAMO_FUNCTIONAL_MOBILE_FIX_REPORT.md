# GLAMO Nepal — Functional Mobile/Route Repair Pass

## Context
This pass responded to the live-site issues reported by the client:

- Mobile hamburger menu did not open.
- Cart icon navigation appeared broken.
- Cart page could remain stuck on loading placeholders.
- Shop page could render blank/loading instead of products.
- Admin login page could remain stuck on the loading fallback.
- Customer login entry was not clear from the navigation.

## Major fixes executed

### 1. Removed hidden BOM characters from client files
Several client components had a UTF-8 BOM at the beginning of the file. This can make client-boundary behavior brittle and harder to reason about. The BOM was removed from affected files, including:

- `src/app/(public)/shop/ShopPageContent.tsx`
- `src/components/admin/AdminLoginForm.tsx`
- `src/components/auth/AuthForm.tsx`
- `src/components/cart/CartDrawer.tsx`
- multiple account, search, common, and product components

### 2. Rebuilt `/shop` so it no longer depends on a blank Suspense fallback
Before:

- `/shop/page.tsx` wrapped the whole page in Suspense.
- The fallback was a blank full-screen block.
- `ShopPageContent` used `useSearchParams`, which can suspend and leave the user staring at blank/loading UI.

After:

- `/shop/page.tsx` now parses search params on the server and passes them as serializable initial props.
- `ShopPageContent` keeps filters in local state and updates the URL with `router.replace`.
- Products render immediately in server HTML instead of relying on a blank Suspense fallback.

### 3. Rebuilt admin login to avoid the stuck loading state
Before:

- `/admin/login/page.tsx` used Suspense around `AdminLoginForm`.
- `AdminLoginForm` used `useSearchParams` directly.
- On fragile hydration, the page could stay on “Loading admin login…” as shown in the screenshot.

After:

- The server page reads `searchParams.redirect` and passes `redirectTo` to the client form.
- The Suspense wrapper was removed.
- `AdminLoginForm` no longer imports or uses `useSearchParams`.
- The admin layout was visually tightened and made more responsive.

### 4. Reworked customer login routing
Before:

- Customer account icon routed to `/account`, relying on protected-route redirect behavior.
- This made it feel like there was no customer login page.

After:

- Desktop account icon now links directly to `/login`.
- Mobile drawer “Account” was changed to “Login” and links directly to `/login`.
- Auth pages no longer use Suspense wrappers around `AuthForm`.
- `AuthForm` now receives `redirectTo` from the server page instead of calling `useSearchParams` itself.

### 5. Hardened cart rendering
Before:

- `CartPageClient` rendered a skeleton until the component mounted.
- If hydration failed or stalled, the user could see skeleton placeholders indefinitely.

After:

- The cart page now renders a real empty-cart state immediately when no items are present.
- The cart no longer depends on a mount-only skeleton as the first meaningful UI.
- Navbar cart and mobile drawer cart links use normal navigation to `/cart` so the route opens reliably.

### 6. Mobile navigation fixes
Changes:

- Added `aria-expanded` and `aria-controls` to the hamburger button.
- Assigned an explicit ID to the drawer.
- Kept the drawer state-controlled, but reduced the chance of hydration blockers by removing Suspense/useSearchParams patterns from high-risk pages.
- Mobile drawer cart uses a direct anchor to `/cart`.

## Verification performed

### TypeScript
`npx tsc --noEmit` passed.

### Lint
`npm run lint` passed with one existing warning about custom font loading in `src/app/layout.tsx`.

### Route smoke checks
Local HTTP checks returned `200` for:

- `/`
- `/shop`
- `/cart`
- `/checkout`
- `/login`
- `/register`
- `/admin/login`
- `/brands`
- `/about`
- `/search`
- `/wishlist`

### Important browser limitation
A real Chromium visual QA pass was attempted, but Chromium navigation is blocked in this environment with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Because of that, this pass could verify route HTML and code health, but not pixel-perfect browser screenshots.

## Remaining recommendations

1. Deploy this ZIP to Vercel preview.
2. Test on real mobile at 390px and 375px.
3. Verify hamburger open/close, cart icon navigation, `/shop`, `/cart`, `/login`, and `/admin/login` on the preview URL.
4. Send screenshots of any remaining page-specific visual issue for another surgical pass.

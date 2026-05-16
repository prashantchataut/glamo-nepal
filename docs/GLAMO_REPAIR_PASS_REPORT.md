# GLAMO Nepal Repair Pass Report

## Scope
This pass focused on the issues reported after the v4 package: broken or confusing navigation, non-working search/cart behavior, weak mobile responsiveness, insufficient reference-inspired hero/footer art direction, missing real-image direction, and logic/security wiring gaps.

## What was fixed in code

### Navigation wiring
- Rebuilt `src/components/layout/Navbar.tsx` around stable routes instead of category-only top navigation.
- Restored top-level nav to `Shop`, `Brands`, `Routines`, `New In`, and `About`.
- Moved category shortcuts into the mobile drawer and linked them to `/shop?category=...`.
- Changed the cart affordance from drawer-only behavior to a reliable `/cart` route link.
- Changed the search affordance to a progressive `/search` link with modal enhancement when JavaScript is available.
- Confirmed the GLAMO logo is a real `Link href="/"` and restyled the mark to a cleaner uppercase wordmark.
- Added account, wishlist, and cart quick links inside the mobile drawer.

### Search, cart, and checkout logic
- Added CSRF headers to the local checkout request in `src/lib/api/checkout.ts`; checkout was likely failing because middleware expects `x-csrf-token` for `/api/checkout`.
- Added CSRF headers to the footer newsletter form; the footer form was also likely failing because middleware protects `/api/newsletter`.
- Kept the existing CSRF-protected contact and newsletter components intact.
- Kept cart page and checkout page as real route-first screens rather than relying only on overlays.

### Admin login/logout wiring
- Updated middleware to verify either the hardened `__Host-glamo-admin-session` cookie or the legacy admin auth cookie.
- This fixes local development where `__Host-` cookies can be difficult because they require secure cookie behavior.
- Added CSRF header handling to the admin logout request.

### Hero redesign
- Rebuilt the hero into a closer reference-inspired editorial beauty layout:
  - compact copy hierarchy
  - large serif headline
  - soft pink/lilac brand background
  - black primary CTA
  - rounded editorial image composition
  - product mini-cards
  - mobile-first stacking
  - trust stats without noisy SaaS visuals

### Footer redesign
- Rebuilt footer as a premium black editorial footer inspired by beauty retail references.
- Added a clearer newsletter block, stronger GLAMO wordmark, shop/category/help columns, contact details, and mobile-responsive spacing.
- Fixed footer newsletter submission wiring with CSRF.

### Imagery and catalog presentation
- Added a more curated remote image library in `src/lib/image-library.ts`.
- Expanded real-image mapping across the catalog so products no longer fall back heavily to generated local SVG placeholders.
- Kept real product/brand names already present in the catalog: COSRX, Cetaphil, Beauty of Joseon, The Ordinary, Innisfree, CeraVe, Bioderma, La Roche-Posay, Maybelline, Lakme, etc.
- Used stock/editorial imagery as a placeholder asset strategy until supplier-approved packshots and owned campaign images are available.

### Security and vulnerability pass
- Reduced SVG risk by disabling `dangerouslyAllowSVG` in `next.config.mjs`.
- Preserved CSP, frame blocking, object blocking, strict referrer policy, HSTS, and API rate-limit middleware.
- Added Google Fonts domains to CSP only if external fonts are used.
- Ran `npm audit` and reduced package audit findings from 5 to 2 by updating direct PostCSS and overriding vulnerable Glob.

## Remaining known issues

### Package vulnerabilities
`npm audit` still reports 2 findings through `next@14.2.35`:
- 1 high severity grouped under Next.js advisories.
- 1 moderate severity because Next internally pins an older PostCSS.

Recommended solution:
- Plan a controlled framework upgrade to Next 15.5.16+ or Next 16 after testing App Router changes, metadata, middleware, route handlers, and admin flows.
- Do not force-upgrade blindly in this pass because it is a framework-major upgrade and may introduce regressions.

### Real product packshots
The site now uses better real editorial imagery, but exact product packshots should still be replaced before launch with:
- supplier-provided product images,
- distributor-approved product photography,
- own product shoots,
- or licensed packshot assets.

Recommended solution:
- Build `/public/images/products/real/` and replace remote placeholders product by product.
- Store license/source notes in a product asset manifest.

### Typography loading
The project now declares the desired serif/sans stack. External Google font loading may be blocked in offline build environments.

Recommended solution:
- For production, self-host Cormorant Garamond and Inter or another licensed serif/sans pair.
- Do not ship font files without confirming license and source.

### Mobile QA
Source checks pass, but final mobile approval still needs human/browser testing at:
- 320px
- 375px
- 390px
- 430px
- 768px
- 1024px
- 1440px

Recommended solution:
- Run Playwright screenshots for homepage, shop, PDP, cart, checkout, account, admin login.
- Compare against the reference screenshot and iterate section by section.

## Validation run
- `npm run qa:static` passed.
- `npm run typecheck` passed after installing dependencies.
- `npm run lint` passed with one non-blocking font warning.
- Banned-pattern grep passed with no matches for: `customer@glamo.com`, `backdrop-blur`, `bg-clip-text`, `marquee`, `fake auth`, `checkout success screen`, `localStorage auth token`, `mock product imports in customer pages`, `blur-3xl`.
- `npm run build` was attempted. It timed out during optimized production build after a Google Fonts optimization warning, without a concrete code compile error.

## Next step recommendation
The next pass should be a browser-visible QA pass with screenshots, not another blind code-only pass. Start with nav/hero/footer at mobile sizes, then PDP/cart/checkout interactions, then admin login/logout.

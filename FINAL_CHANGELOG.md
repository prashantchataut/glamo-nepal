# Final Changelog

## Production-polish sprint added

- Rebuilt the auth screens with reusable frontend-only login/register/forgot/reset UI.
- Added middleware protection for `/account` and `/admin` using a mock `glamo-auth-token` cookie.
- Added an account shell with responsive navigation, logout, profile, orders, order detail, wishlist, addresses and password screens.
- Added a stronger admin placeholder shell with inventory, low-stock, campaign, audit and production-auth warnings.
- Added `LegalLayout` plus canonical static pages for FAQ, shipping, returns, privacy and terms, with alias redirects for policy-style URLs.
- Added page-level SEO metadata across storefront, content, account, auth, legal, cart, checkout, compare, category, search and product routes.
- Added shared JSON-LD helpers for organization, product and breadcrumb schema.
- Added polished reusable loading and error boundary components and route-level boundaries for key sections.
- Added backend adapter files for API client, checkout/payment verification and customer account endpoints.
- Added analytics-ready frontend event helper for add-to-cart, wishlist, compare, payment method and simulated order events.
- Refined 404 page with premium GLAMO styling and recovery links.

## Added in the ecommerce build

- Complete route coverage requested by the owner.
- Nepal-market mock product catalog with NPR pricing, SKU, stock, origin, Made in Nepal flag, concerns, benefits, how-to-use, ingredients, review summaries and source/audit notes.
- Local neutral placeholder SVG product/category/hero/blog imagery.
- Backend-ready TypeScript API contracts and mock catalog API helpers.
- Persistent Zustand stores: cart, wishlist, compare, recently viewed, mock auth and checkout simulation.
- Product comparison tray and `/compare` page with max-three-product behavior.
- Recently viewed product strip.
- COD availability checker component.
- WhatsApp floating button linked to `https://wa.me/9779818212188` and hidden on checkout pages.
- Back-to-top button.
- Config-driven Dashain sale banner.
- Beauty profile quiz with mock recommendations.
- `.env.example` with public environment placeholders.
- SEO files: sitemap and robots.

## Improved

- Product cards include NPR formatting, hover zoom, wishlist, compare, sale/Made in Nepal badges, rating, stock messaging, analytics hooks and accessible focus states.
- Shop page supports category, subcategory, brand, concern, skin type, Made in Nepal, price, stock, search and sort filters with URL-ready state.
- Product detail page includes rich merchandising, variant/shade selector, sticky add-to-cart, SKU copy, share action, related products, recently viewed and structured data.
- Cart and checkout pages show a complete frontend ecommerce flow with Nepal-specific address and payment UI.
- Blog list/detail pages now use stronger editorial layout, dynamic metadata and article schema.
- Footer, Instagram gallery, metadata and constants use the correct GLAMO NEPAL details.

## Verified manually in files

- Instagram handle: `@glamo_nepal`
- Instagram URL: `https://www.instagram.com/glamo_nepal/`
- Phone: `+977 9818212188`
- Address: `Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal`
- Currency formatting helper uses NPR.
- No remote competitor product images are referenced in source data; local neutral placeholder SVGs are used.

## Remaining production requirements

- Real product images
- Supplier-approved product data and product claims
- Backend API
- Real auth, secure sessions and admin RBAC
- Khalti/eSewa/card credentials and server-side verification
- Courier/COD rules
- Legal policy approval
- Analytics IDs and consent strategy


## Production hardening pass

- Removed legacy `src/app/(auth)` route group to prevent duplicate `/login` and related auth route collisions in Next.js App Router.
- Expanded mock in-stock catalog to 44 products with Nepal-market category/price-band audit notes, stock counts, variants and placeholder images.
- Added inventory snapshot helpers and upgraded admin mock with reorder thresholds, stock risk labels and source/audit notes.
- Added dependency-free static QA scripts for route duplicates, local import resolution and content safety.
- Added `PRODUCT_DATA_GUIDE.md` and `DEPLOYMENT_CHECKLIST.md`.
- Updated mock auth middleware to distinguish customer/admin demo roles while documenting that backend RBAC is required.

## Production-readiness pass - current update

- Added delivery/COD rules layer in `src/lib/delivery.ts` with province/district service rules, free-delivery thresholds, delivery fees and owner action notes.
- Upgraded checkout UX with step progress, district options by province, route-based delivery fee calculation, free-delivery progress, COD disabling for unsupported districts and stronger payment warnings.
- Added merchandising collection routes:
  - `/collections`
  - `/collections/new-arrivals`
  - `/collections/best-sellers`
  - `/collections/made-in-nepal`
  - `/collections/festival-ready`
  - `/collections/under-npr-1000`
  - `/collections/low-stock`
- Added collection metadata, breadcrumb JSON-LD and sitemap coverage.
- Improved shop URL filter behavior with removable active chips, min/max price persistence and quick price ranges.
- Added frontend API adapters for auth, orders and admin endpoints.
- Added environment readiness helper in `src/lib/env.ts` and surfaced environment status in the admin dashboard.
- Expanded analytics event layer with dataLayer, gtag and Meta Pixel-compatible hooks.
- Improved mock auth store with explicit customer/admin roles and safer default logged-out state.
- Added QA checks for product data, source accessibility and `.env.example` completeness.
- Fixed external social links to use `rel="noopener noreferrer"`.


## Production-readiness continuation pass

- Added routine-builder feature routes: `/routines` and `/routines/[slug]`.
- Added brand landing routes: `/brands` and `/brands/[slug]`.
- Added bundle-ready product routine data and reusable `ProductBundleCard`.
- Added back-in-stock `NotifyMeForm` with Nepal phone/email validation and analytics event.
- Added product safety messaging helpers for return eligibility, authenticity, patch testing and batch/expiry requirements.
- Added global delivery/trust promise strip and skip-to-content accessibility link.
- Improved search UX with suggestions and no-result recommendations.
- Expanded public sitemap coverage for routines and brands.
- Added static QA scripts for smoke routes, store contracts and performance/source hygiene.
- Added `PRODUCTION_PROGRESS.md` to track remaining frontend/backend production work.

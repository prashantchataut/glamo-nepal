# Final Changelog - UI Redesign Update

## What was improved

### Homepage simplification
- Reduced homepage clutter and removed several stacked promotional sections.
- Rebuilt the flow to focus on a cleaner customer journey: hero -> trust strip -> categories -> seasonal banner -> featured products -> category discovery -> beauty finder -> social/blog/newsletter.

### Hero section refresh
- Reworked the hero banner into a more premium editorial layout.
- Simplified the copy and removed AI-looking filler styling.
- Improved CTA hierarchy and supporting content blocks.

### New Year campaign banner
- Replaced the previous Dashain-focused customer-facing banner with a **New Year 2083 Special Offer** banner.
- Removed technical or internal-sounding text such as frontend/config messaging.
- Introduced a richer, more visually appealing festive offer layout aligned with the GLAMO theme.

### Product card cleanup
- Simplified product cards to feel more premium and less template-like.
- Reduced visual noise while keeping essential commerce information visible.
- Improved pricing, wishlist interaction and card hierarchy.

### Navigation and footer refinement
- Rebuilt the navbar for a cleaner storefront feel.
- Simplified the footer and improved overall polish.

### Content cleanup
- Replaced customer-facing technical language in several visible areas.
- Updated checkout, cart and contact wording so the storefront sounds more customer-ready.

### Technical adjustments
- Replaced remote Google font loading with local-safe CSS variable fallbacks so builds are less fragile in restricted environments.
- Removed duplicate delivery strip rendering from the global layout.

## Main files updated
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/lib/constants.ts`
- `src/components/home/HeroBanner.tsx`
- `src/components/home/DashainSaleBanner.tsx`
- `src/components/home/QuickCategoryPills.tsx`
- `src/components/home/FeaturedProducts.tsx`
- `src/components/home/BeautyProfileQuiz.tsx`
- `src/components/common/DeliveryPromiseStrip.tsx`
- `src/components/product/ProductCard.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/checkout/CheckoutPageClient.tsx`
- `src/components/cart/CartPageClient.tsx`
- `src/app/contact/page.tsx`
- `src/lib/analytics.ts`
- `src/lib/api/orders.ts`


## UI restraint and New Year 2083 polish pass

- Reworked the homepage into a calmer storefront sequence.
- Replaced the Dashain/dev-style campaign banner with a New Year 2083 offer banner.
- Simplified hero, nav, footer, category entry points and product cards.
- Removed customer-facing developer wording from key shopping pages.
- Removed Framer Motion from root-level overlays/navigation for a calmer feel and lighter source.
- Confirmed TypeScript, ESLint and static QA checks pass in the sandbox.
- Full Next build still times out in this sandbox at the optimized production build stage; run locally with dependencies installed.

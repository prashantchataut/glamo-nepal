# GLAMO Nepal — Mobile Editorial Execution Pass

## Scope
This pass focused on the user's urgent request: mobile-view instability and stronger art direction based on the Nibelu, SkinGlow, and The Act references.

## Verification performed
- Local development server route smoke checks were performed with `curl` after restarting the dev server.
- Verified HTTP 200 server render for:
  - `/`
  - `/shop`
  - `/brands`
  - `/about`
  - `/cart`
  - `/checkout`
  - `/login`
  - `/register`
  - `/search`
  - `/products/beauty-of-joseon-relief-sun-spf50`
- `npm run typecheck` passed.
- `npm run lint` passed with one pre-existing Next font warning.

## Browser/mobile inspection limitation
Chromium exists in the execution container, but headless navigation is blocked by the environment with `net::ERR_BLOCKED_BY_ADMINISTRATOR`, even for local and data URLs. Because of that, a real screenshot-based mobile pass could not be completed inside this environment. I compensated by doing a source-level mobile audit and route smoke rendering.

## Major fixes applied

### 1. Tailwind token rescue for pages that visually dropped classes
Several older pages were still using legacy classes such as:
- `text-brand-textMuted`
- `text-brand-textPrimary`
- `bg-brand-bgLight`
- `border-brand-border`
- `bg-brand-surfacePink`

Those classes were not part of the surgical design token set, which means large sections could silently lose their intended colors. Added compatible legacy aliases into `tailwind.config.ts` so every existing page renders with the warm rose/cream system instead of missing styles.

### 2. Global mobile overflow hardening
Added CSS-level protection for mobile:
- `box-sizing: border-box` for all elements
- media, image, svg max-width constraints
- horizontal overflow clipping
- mobile-safe display type scale overrides
- safe-area handling
- mobile snap utilities
- text balance / pretty utilities

### 3. Hero rebuilt toward The Act / SkinGlow direction
The homepage hero is now more image-led and editorial:
- photo dominates the layout
- text overlaps the image zone on mobile
- giant display serif headline has mobile-specific sizing
- floating product card now exists on mobile and desktop
- CTA block is safer on 375px screens
- trust strip is simplified and divided cleanly

### 4. Category cards rebuilt toward The Act
`ShopByCategory` now uses:
- parenthetical category labels `( skincare )`
- horizontal snap scrolling on mobile
- sharp cream product-photo cards
- minimal top-right arrows
- reduced boxed/tinted-card behavior

### 5. Product grid sections rebuilt with editorial rhythm
`FeaturedProducts` now includes a large background type texture (`glamo`) inspired by The Act. Product shelves have tighter mobile gaps and less template rhythm.

### 6. Brand philosophy section rebuilt toward SkinGlow
The brand mission section now uses:
- organic image framing
- large-number stats as design elements
- two-column editorial label/body rhythm
- warmer blush surface

### 7. Brand showcase rebuilt from logo grid to photo-led brand cards
The previous logo-lockup brand grid felt generic. It was replaced with photographic cards, dark image overlays, large serif brand names, and arrow affordances.

### 8. Navbar mobile cleanup
- Mobile header now hides the search icon to match the prompt's desired `[menu] [GLAMO] [cart]` structure.
- Drawer width changed to `min(85vw, 320px)`.
- Wordmark refined with lighter Cormorant styling.
- Drawer shape is sharper and more reference-aligned.

### 9. Shop mobile UX repair
- Mobile product grid spacing tightened.
- Added sticky mobile bottom filter/sort bar.
- Mobile filter drawer is now a bottom sheet, not a desktop-like side drawer.
- Shop hero display type is clamped to avoid mobile overflow.

### 10. PDP mobile repair
- PDP title now uses mobile-safe clamped display sizing.
- Main PDP content receives bottom padding for sticky CTA safety.
- Add-to-bag CTA is now sticky on mobile.
- Related products use tighter mobile gaps.

## Files changed heavily
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/components/home/HeroBanner.tsx`
- `src/components/home/ShopByCategory.tsx`
- `src/components/home/FeaturedProducts.tsx`
- `src/components/home/BestSellers.tsx`
- `src/components/home/BrandPhilosophyBanner.tsx`
- `src/components/home/BrandShowcase.tsx`
- `src/components/common/Section.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/product/ProductCard.tsx`
- `src/app/(public)/shop/ShopPageContent.tsx`
- `src/components/shop/MobileFilterSheet.tsx`
- `src/components/product/detail/ProductDetailClient.tsx`

## Still recommended
A real visual pass should be run in a normal browser environment at:
- 375px
- 390px
- 768px
- 1024px
- 1280px

The next high-value pass should focus on screenshot-based tuning of actual rendered spacing and image crops.

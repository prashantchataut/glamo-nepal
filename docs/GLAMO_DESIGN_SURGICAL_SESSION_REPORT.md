# GLAMO Nepal — Design Surgical Pass Report

## Session focus
Pure UI/UX surgery: color discipline, typography courage, editorial homepage composition, product-card restraint, category-card redesign, navigation refinement, brand directory polish, and global token enforcement.

## Major changes implemented

### 1. Design token overhaul
- Rebuilt `tailwind.config.ts` color system around the requested warm rose/cream palette.
- Added luxury-specific brand tokens:
  - `brand-blush` `#F2D4DA`
  - `brand-rose` `#D4798A`
  - `brand-deep` `#A84D5E`
  - `brand-dark` `#6B2535`
  - `cream-*` warm neutral scale
  - `ink` warm near-black
  - `gold` accent for ratings/prices
- Replaced cold grey/purple direction with warm cream, rose, ink, and gold usage.

### 2. Typography scale enforcement
- Added the requested large editorial scale:
  - `display-2xl`
  - `display-xl`
  - `display-lg`
  - `display-md`
  - heading/body/label/price tokens
- Kept Cormorant Garamond + Manrope because the pair fits the brand: editorial beauty display + highly legible UI body.
- Added utility classes for display, label, price, body, and editorial headings.

### 3. Global CSS reset and utilities
- Rebuilt `globals.css` with:
  - warm cream page base
  - proper text selection color
  - focus-visible ring
  - larger section rhythm
  - underline input utility
  - editorial grid utility
  - luxury container utility
- Increased major section padding to make the site breathe.

### 4. Curated image library
- Replaced the image library with `GLAMO_IMAGES` using the curated Unsplash URLs from the surgical brief.
- Added comments for future `CLIENT_ASSET` replacement.
- Preserved the existing `IMAGES` export to avoid breaking current imports.

### 5. Homepage hero surgery
- Rebuilt `HeroBanner` from boxed image collage into an editorial image-led hero.
- Hero image now functions as the layout canvas.
- Added oversized display headline:
  - “Beauty, finally / curated for you.”
- Mixed font weights and italic treatment for the second line.
- Added floating product card over the hero image area.
- Added restrained trust row beneath hero.

### 6. Category cards redesign
- Rebuilt `ShopByCategory` into The Act-inspired cards:
  - `( skincare )` parenthetical labels
  - image-first layouts
  - top-right arrow
  - no colored card backgrounds
  - no gradient overlays
  - barely-there dividers
  - restrained hover treatment

### 7. Product card reconstruction
- Removed quick-add buttons from product cards.
- Removed image gradient overlay.
- Removed cluttered badge stack and CTA-heavy hover behavior.
- Rebuilt anatomy around:
  - 4:5 image
  - hover wishlist only
  - bottom-left badge only when applicable
  - tiny uppercase brand
  - Cormorant product name
  - clean NPR price
  - subtle rating row
  - sale pricing treatment
- Mobile cards are now more compact and visually cleaner.

### 8. Navigation refinement
- Reduced desktop nav to the required premium structure:
  - Shop
  - Brands
  - New In
  - About
- Updated GLAMO wordmark to Cormorant Garamond, light-weight, fashion-brand spacing.
- Set nav height to 68px.
- Nav now uses cream/ink/rose instead of pink blocks or purple remnants.
- Mobile drawer remains left-slide, with warmer tokens and 44px touch targets retained.

### 9. Brands page rebuild
- Replaced card-grid brand layout with A-Z indexed brand directory.
- Added search input visual treatment.
- Added letter jump navigation.
- Added letter sections with editorial rows.
- Added graceful “coming soon” fallback when brand data is empty.

### 10. 404 page rebuild
- Rebuilt 404 into premium editorial page:
  - huge Cormorant `404`
  - calm explanatory copy
  - primary/ghost actions
  - warm cream background

### 11. Broad token cleanup
- Performed a broad pass replacing many hardcoded warm/pink hex utility classes with Tailwind tokens.
- Replaced most visible purple/violet remnants in source and illustration assets with rose/cream equivalents.
- Reduced rounded “SaaS pill” styling in many components to sharper luxury geometry.

## Important note
Per instruction, this pass intentionally skipped full testing/build verification. The resulting archive contains major visual/code changes but still needs a proper local `npm run build` and visual QA pass before production deployment.

## Remaining design tasks
1. Full visual QA at 375, 390, 768, 1024, 1280, and 1440px.
2. Deep PDP refinement against the exact luxury PDP spec.
3. Deep checkout form surgery: underline inputs, stepper polish, payment details, district dropdown UX.
4. Cart page final refinement: sharper two-column luxury layout and sticky summary.
5. Shop filter sidebar and mobile bottom sheet final polish.
6. Auth form final polish: remove rounded card language entirely and make inputs fully underline-style.
7. Remove remaining non-token hex values from secondary/supporting components.
8. Replace stock imagery with real GLAMO/product photography when available.

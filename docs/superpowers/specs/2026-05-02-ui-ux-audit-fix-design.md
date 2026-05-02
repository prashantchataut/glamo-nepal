# GLAMO Nepal UI/UX Audit & Fix — Design Spec

**Date:** 2026-05-02  
**Scope:** Full frontend visual audit, design token enforcement, layout safety, interaction polish, accessibility, and WhatsApp clickable phone

---

## A) UI Inventory & Duplication Cleanup

### A1. Remove Dead Code
- **Delete** `src/components/home/DashainSaleBanner.tsx` — imported in `page.tsx` but not rendered
- **Remove** its import from `src/app/page.tsx`
- **Remove** unused CSS classes `.bg-grain`, `.blob-1`, `.blob-2` from `globals.css` if confirmed unused across all components

### A2. Consolidate Duplicate Routes
- **Keep** the canonical long-form routes: `/terms-and-conditions`, `/privacy-policy`, `/shipping-policy`, `/return-policy`
- **Add Next.js redirects** in `next.config.mjs` for the short-form routes → canonical routes
- **Delete** the duplicate page directories: `src/app/terms/`, `src/app/privacy/`, `src/app/shipping/`, `src/app/returns/`

### A3. Consolidate Off-White Colors
Three near-identical off-white pinks are used across 6+ files:
- `#FBF7F8` (HeroBanner, QuickCategoryPills, BeautyProfileQuiz, DeliveryPromiseStrip)
- `#FFF9F7` (Footer, NewsletterSignup, AnnouncementBar, NewYearOfferBanner, PageHeader)
- `#FFFDFC` (Navbar, ShopFilterSidebar, RouteError)

**Action:** Add three new design tokens to `tailwind.config.ts`:
- `brand.surfacePink: '#FBF7F8'`
- `brand.surfaceWarm: '#FFF9F7'`
- `brand.surfaceCream: '#FFFDFC'`

Then replace all hardcoded instances with these tokens.

### A4. Extract Repeated Gradient
The gradient `linear-gradient(135deg, #FFF9F7 0%, #F8EEF2 45%, #F7F1EA 100%)` appears in:
- `PageHeader.tsx`
- `NewYearOfferBanner.tsx`
- `RouteError.tsx`

**Action:** Add CSS custom property in `globals.css`:
```css
--gradient-editorial: linear-gradient(135deg, #FFF9F7 0%, #F8EEF2 45%, #F7F1EA 100%);
```

Replace all three instances with `bg-[var(--gradient-editorial)]`.

---

## B) Design Token Enforcement

### B1. Color Tokens
Add to `tailwind.config.ts` under `colors.brand`:
```
surfacePink: '#FBF7F8',
surfaceWarm: '#FFF9F7',
surfaceCream: '#FFFDFC',
```

Replace all 17+ hardcoded hex values with token references. Key replacements:
| Hardcoded | Token | Files |
|-----------|-------|-------|
| `#FBF7F8` | `brand.surfacePink` | HeroBanner, QuickCategoryPills, BeautyProfileQuiz, DeliveryPromiseStrip |
| `#FFF9F7` / `#FFF9F7` | `brand.surfaceWarm` | Footer, AnnouncementBar, NewsletterSignup, NewYearOfferBanner, PageHeader |
| `#FFFDFC` | `brand.surfaceCream` | Navbar, ShopFilterSidebar |
| `#25D366` | Keep as-is (WhatsApp brand color, not a GLAMO token) | WhatsAppFloatingButton |
| DashainSaleBanner colors | N/A (file deleted) | — |

### B2. Spacing — 8pt Grid
The current Tailwind config uses a 4pt grid. We enforce 8pt grid alignment:
- Replace `gap-2.5` → `gap-3` (12px) or `gap-2` (8px)
- Replace `py-2.5` → `py-3` (12px) or `py-2` (8px)
- Replace `py-3.5` → `py-4` (16px)
- Replace `px-1.5` / `py-1.5` → `px-2` / `py-2` (8px)
- Replace `gap-5` → `gap-6` (24px) or `gap-4` (16px)
- Replace `gap-7` → `gap-8` (32px) or `gap-6` (24px)
- Replace `text-[9px]` → `text-xs` (12px)
- Replace `text-[10px]` → `text-xs` (12px)
- Replace `text-[11px]` → `text-xs` (12px)
- Replace `text-[15px]` → `text-base` (16px)

### B3. Border Radius Consistency
Standardize:
- **Cards/sections:** `rounded-[1.5rem]` to `rounded-[2rem]` (brand pattern)
- **Buttons/CTAs:** `rounded-full`
- **UI primitives (shadcn):** Keep `rounded-md` / `rounded-lg` as-is (these are internal component defaults)
- **Inputs:** `rounded-full` to match brand button style
- **Dialogs/sheets:** `rounded-[2rem]` for outer containers

### B4. Shadows & Hover States
Add shadow tokens to `tailwind.config.ts`:
```js
boxShadow: {
  'card': '0 20px 70px -58px rgba(36,31,34,0.55)',
  'card-hover': '0 30px 90px -60px rgba(154,107,130,0.75)',
  'editorial': '0 30px 90px -65px rgba(36,31,34,0.45)',
  'soft': '0 20px 60px -15px rgba(139,58,143,0.08)',
}
```

Replace all inline `shadow-[...]` with these named tokens.

---

## C) Z-Index & Layout Safety

### C1. Fix shadcn/ui Z-Index
Override these files to use the project's named z-index scale:
- `src/components/ui/dialog.tsx`: Change `z-50` → `z-modal` (overlay) and `z-modal` (content)
- `src/components/ui/dropdown-menu.tsx`: Change `z-50` → `z-modal`
- `src/components/ui/sheet.tsx`: Change `z-50` → `z-modal`

### C2. Replace Hardcoded Z-Index Values
| Component | Current | Named Token |
|-----------|---------|-------------|
| Navbar.tsx | `z-50`, `z-[65]`, `z-[70]` | `z-navbar`, `z-menu-backdrop`, `z-menu` |
| CartDrawer.tsx | `z-[55]`, `z-[60]` | `z-cart-backdrop`, `z-cart` |
| SearchModal.tsx | `z-[75]`, `z-[80]` | `z-modal-backdrop`, `z-modal` |
| MobileBottomNav.tsx | `z-[50]` | `z-navbar` |
| WhatsAppFloatingButton.tsx | `z-[45]` | `z-whatsapp` |
| BackToTopButton.tsx | `z-[45]` | `z-back-to-top` |
| SkipToContent.tsx | `z-[100]` | Add `z-skip-link: 100` to scale |

### C3. Add `z-skip-link` to Scale
In `tailwind.config.ts`, add:
```js
'skip-link': '100',
```

### C4. Overflow & Clipping Fixes
- Audit all parent containers of dropdowns/modals for `overflow-hidden` that clips fixed/sticky children
- Ensure `AppShell.tsx` main content area has `pb-20 md:pb-0` to account for `MobileBottomNav`

### C5. iOS Scroll Lock
- Add `useScrollLock` hook that sets `document.body.style.overflow = 'hidden'` when cart drawer or search modal is open
- Apply in `CartDrawer.tsx` and `SearchModal.tsx`

### C6. Carousel Swipeability
- Verify Embla carousel config has `dragFree: true` and touch drag enabled
- Ensure carousel containers don't have `overflow-hidden` on the wrong axis

---

## D) Page-by-Page Visual QA

### D1. Vertical Rhythm
Standardize section spacing:
- Hero sections: `py-16 md:py-24`
- Content sections: `py-12 md:py-16`
- Tight sections: `py-8 md:py-12`

### D2. Typography Hierarchy
- H1: `font-serif text-3xl md:text-5xl` — page titles
- H2: `font-serif text-2xl md:text-4xl` — section headings
- H3: `font-serif text-xl md:text-2xl` — sub-sections
- Body: `font-sans text-base` — paragraphs
- Small: `font-sans text-sm` — captions, labels

### D3. Mobile Layout Verification
- All pages must work at 360px (small mobile), 390px (iPhone), 768px (tablet), 1280px+ (desktop)
- Verify no horizontal overflow at any breakpoint
- Ensure `MobileBottomNav` doesn't obscure content (add bottom padding)

### D4. Touch Target Audit
All interactive elements must be ≥ 44px. See E1 for specific fixes.

---

## E) Interaction Polish

### E1. Touch Target Fixes (≥ 44px)
| Component | Current | Fix |
|-----------|---------|-----|
| `ui/checkbox.tsx` | 16×16px | Add `p-2` wrapper for 32px, then `min-h-[44px] min-w-[44px]` on label |
| `ui/slider.tsx` thumb | 20×20px | Increase to `h-6 w-6` (24px) + invisible touch target `after:absolute after:h-[44px] after:w-[44px]` |
| `ShopFilterSidebar` checkboxes | 16×16px | Same as ui/checkbox fix |
| `ProductCard` wishlist btn | 40×40px | Increase to `h-11 w-11` (44px) |
| `ProductCard` add-to-cart btn | ~42px height | Increase to `min-h-[44px]` |
| `ProductBundleCard` add btn | ~40px | Increase to `min-h-[44px]` |
| `CartPageClient` remove btn | 36×36px | Increase to `h-11 w-11` (44px) |
| `SearchModal` clear btn | ~24px | Increase to `h-11 w-11` (44px) |
| `SearchModal` suggestions | ~small | Increase padding to `py-3 px-4` |
| `AnnouncementBar` dismiss | 28×28px | Increase to `h-11 w-11` (44px) |
| `HeroBanner` carousel dots | 8×32px | Add `p-2` wrapper for 44px touch target |
| `NotifyMeForm` submit btn | ~42px | Increase to `min-h-[44px]` |

### E2. Micro-interactions
Add to `globals.css`:
```css
@layer utilities {
  .btn-press { @apply active:scale-[0.97] transition-transform duration-100; }
  .card-hover { @apply hover:shadow-card-hover transition-shadow duration-300; }
}
```

Apply `btn-press` to all buttons, `card-hover` to all product cards.

### E3. Reduced Motion Support
Add to `globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### E4. Skeleton Loaders
Create `src/components/common/Skeleton.tsx` with variants:
- `SkeletonCard` — matches ProductCard layout
- `SkeletonText` — matches text blocks
- `SkeletonImage` — matches image placeholders

Replace any `loading.tsx` generic blocks with these.

### E5. Empty States
Create `src/components/common/EmptyState.tsx` with variants:
- Empty Cart — illustration + "Your cart is empty" + CTA
- Empty Search — "No results found" + suggestions
- Empty Wishlist — "Your wishlist is empty" + CTA
- Empty Orders — "No orders yet" + CTA

---

## F) WhatsApp Clickable Phone in Announcement Bar

### F1. Implementation
In `src/components/layout/AnnouncementBar.tsx`:
- Wrap the phone number text in an `<a>` tag
- `href="https://wa.me/9779818212188"`
- `target="_blank"` `rel="noopener noreferrer"`
- Visible text remains `+977 9818212188`
- Style: `underline decoration-brand-primary/40 underline-offset-2 hover:decoration-brand-primary transition-colors`
- Add `aria-label="Contact us on WhatsApp"`

---

## G) Deliverables

### G1. UI/UX Fix Report
Will be generated as a final summary listing: Issue → Cause → Fix → Files Changed.

### G2. Consistency Checklist
- [ ] All colors use design tokens (no hardcoded hex except WhatsApp green)
- [ ] All spacing follows 8pt grid
- [ ] All z-index values use named tokens
- [ ] All border-radius values follow brand pattern
- [ ] All touch targets ≥ 44px
- [ ] All interactive elements have hover/active/focus states
- [ ] All modals/drawers have scroll lock
- [ ] All ARIA attributes present
- [ ] Reduced motion supported
- [ ] No horizontal overflow at 360px/390px/768px/1280px+
- [ ] No dead code or unused imports
- [ ] Skeleton loaders match component layouts
- [ ] Empty states are designed

### G3. Remaining UI Risks
- Real photography will significantly improve the visual quality
- Brand-approved logos and typography may require token adjustments
- Payment gateway integration may need additional form styling
- Admin panel not in scope for this audit

---

## Implementation Order

1. **Foundation:** Design tokens (tailwind.config.ts, globals.css) — everything else depends on this
2. **Z-Index Safety:** Fix shadcn/ui + all hardcoded z-index values
3. **Color Token Replacement:** Replace all hardcoded hex → tokens
4. **Spacing Grid Alignment:** Fix all non-8pt spacing
5. **Touch Targets:** Fix all undersized interactive elements
6. **Accessibility:** Add missing ARIA attributes
7. **WhatsApp Link:** Make announcement bar phone clickable
8. **Micro-interactions & Polish:** Add btn-press, card-hover, reduced-motion
9. **Cleanup:** Remove dead code, consolidate routes, extract gradient
10. **Skeleton & Empty States:** Create and wire up
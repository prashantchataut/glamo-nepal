# GLAMO Nepal UI/UX Audit & Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GLAMO Nepal's frontend visually flawless, consistent, and premium-ready by enforcing design tokens, fixing z-index safety, polishing interactions, ensuring accessibility, and adding the WhatsApp clickable phone.

**Architecture:** Targeted fixes and refactors across ~30 files. Foundation first (tokens, z-index), then color/spacing replacement, then touch targets, accessibility, micro-interactions, cleanup, and finally skeleton/empty states.

**Tech Stack:** Next.js 14, Tailwind CSS 3, shadcn/ui (Radix), Zustand, Framer Motion, Embla Carousel

---

## Task 1: Design Token Foundation

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add new color tokens, shadow tokens, and z-index token to tailwind.config.ts**

In `tailwind.config.ts`, extend `colors.brand` with:

```ts
surfacePink: '#FBF7F8',
surfaceWarm: '#FFF9F7',
surfaceCream: '#FFFDFC',
```

Extend `boxShadow` with:

```ts
boxShadow: {
  card: '0 20px 70px -58px rgba(36,31,34,0.55)',
  'card-hover': '0 30px 90px -60px rgba(154,107,130,0.75)',
  editorial: '0 30px 90px -65px rgba(36,31,34,0.45)',
  soft: '0 20px 60px -15px rgba(139,58,143,0.08)',
},
```

Add to `zIndex`:

```ts
'skip-link': '100',
```

- [ ] **Step 2: Add CSS custom properties for gradient and utility classes in globals.css**

In `globals.css`, inside `:root`, add:

```css
--gradient-editorial: linear-gradient(135deg, #FFF9F7 0%, #F8EEF2 45%, #F7F1EA 100%);
```

Inside `@layer utilities`, add:

```css
.btn-press {
  @apply active:scale-[0.97] transition-transform duration-100;
}
.card-hover {
  @apply transition-shadow duration-300;
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: add design tokens, shadow scale, z-skip-link, gradient var, utility classes"
```

---

## Task 2: Z-Index Safety Fixes

**Files:**
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/sheet.tsx`
- Modify: `src/components/ui/dropdown-menu.tsx`
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/MobileBottomNav.tsx`
- Modify: `src/components/cart/CartDrawer.tsx`
- Modify: `src/components/search/SearchModal.tsx`
- Modify: `src/components/common/WhatsAppFloatingButton.tsx`
- Modify: `src/components/common/BackToTopButton.tsx`
- Modify: `src/components/common/SkipToContent.tsx`
- Modify: `src/components/common/CompareTray.tsx`

- [ ] **Step 1: Fix shadcn/ui z-index — dialog.tsx**

In `src/components/ui/dialog.tsx`:
- Change `DialogOverlay` className from `z-50` to `z-modal-backdrop`
- Change `DialogContent` className from `z-50` to `z-modal`

Find: `"fixed inset-0 z-50 bg-black/80` → Replace with: `"fixed inset-0 z-modal-backdrop bg-black/80`
Find: `"fixed left-[50%] top-[50%] z-50 grid` → Replace with: `"fixed left-[50%] top-[50%] z-modal grid`

- [ ] **Step 2: Fix shadcn/ui z-index — sheet.tsx**

In `src/components/ui/sheet.tsx`:
- Change `SheetOverlay` className from `z-50` to `z-modal-backdrop`
- Change `sheetVariants` base className from `z-50` to `z-modal`

Find in `SheetOverlay`: `"fixed inset-0 z-50 bg-black/80` → Replace with: `"fixed inset-0 z-modal-backdrop bg-black/80`
Find in `sheetVariants` cva base: `"fixed z-50 gap-4` → Replace with: `"fixed z-modal gap-4`

- [ ] **Step 3: Fix shadcn/ui z-index — dropdown-menu.tsx**

In `src/components/ui/dropdown-menu.tsx`:
- Change `DropdownMenuSubContent` className from `z-50` to `z-modal`
- Change `DropdownMenuContent` className from `z-50` to `z-modal`

Find: `"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg` → Replace with: `"z-modal min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg`

Find: `"z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem]` → Replace with: `"z-modal max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem]`

- [ ] **Step 4: Fix Navbar.tsx z-index**

In `src/components/layout/Navbar.tsx`:
- Change header `z-50` to `z-navbar`
- Change backdrop `z-[65]` to `z-menu-backdrop`
- Change aside `z-[70]` to `z-menu`

Find: `"sticky top-0 z-50 border-b` → Replace with: `"sticky top-0 z-navbar border-b`
Find: `"fixed inset-0 z-[65] bg-brand-bgDark/35` → Replace with: `"fixed inset-0 z-menu-backdrop bg-brand-bgDark/35`
Find: `"fixed inset-y-0 left-0 z-[70] w-[90%]` → Replace with: `"fixed inset-y-0 left-0 z-menu w-[90%]`

- [ ] **Step 5: Fix MobileBottomNav.tsx z-index**

In `src/components/layout/MobileBottomNav.tsx`:
- Change `z-[50]` to `z-navbar`

Find: `"fixed bottom-0 left-0 right-0 z-[50] h-16` → Replace with: `"fixed bottom-0 left-0 right-0 z-navbar h-16`

- [ ] **Step 6: Fix CartDrawer.tsx z-index**

In `src/components/cart/CartDrawer.tsx`:
- Change backdrop `z-[55]` to `z-cart-backdrop`
- Change drawer `z-[60]` to `z-cart`

Find all instances of `z-[55]` → Replace with: `z-cart-backdrop`
Find all instances of `z-[60]` → Replace with: `z-cart`

- [ ] **Step 7: Fix SearchModal.tsx z-index**

In `src/components/search/SearchModal.tsx`:
- Change backdrop `z-[75]` to `z-modal-backdrop`
- Change modal `z-[80]` to `z-modal`

Find all instances of `z-[75]` → Replace with: `z-modal-backdrop`
Find all instances of `z-[80]` → Replace with: `z-modal`

- [ ] **Step 8: Fix WhatsAppFloatingButton.tsx z-index**

In `src/components/common/WhatsAppFloatingButton.tsx`:
- Change `z-[45]` to `z-whatsapp`

Find: `z-[45]` → Replace with: `z-whatsapp`

- [ ] **Step 9: Fix BackToTopButton.tsx z-index**

In `src/components/common/BackToTopButton.tsx`:
- Change `z-[45]` to `z-back-to-top`

Find: `z-[45]` → Replace with: `z-back-to-top`

- [ ] **Step 10: Fix SkipToContent.tsx z-index**

In `src/components/common/SkipToContent.tsx`:
- Change `z-[100]` to `z-skip-link`

Find: `z-[100]` → Replace with: `z-skip-link`

- [ ] **Step 11: Fix CompareTray.tsx z-index**

In `src/components/common/CompareTray.tsx`:
- Change `z-40` to `z-card`

Find: `z-40` → Replace with: `z-card`

- [ ] **Step 12: Commit**

```bash
git add src/components/ui/ src/components/layout/ src/components/cart/ src/components/search/ src/components/common/
git commit -m "fix: replace all hardcoded z-index values with named tokens"
```

---

## Task 3: Color Token Replacement

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/layout/AnnouncementBar.tsx`
- Modify: `src/components/home/HeroBanner.tsx`
- Modify: `src/components/home/QuickCategoryPills.tsx`
- Modify: `src/components/home/BeautyProfileQuiz.tsx`
- Modify: `src/components/home/NewYearOfferBanner.tsx`
- Modify: `src/components/home/NewsletterSignup.tsx`
- Modify: `src/components/home/PromoBannerGrid.tsx`
- Modify: `src/components/home/BlogPreview.tsx`
- Modify: `src/components/home/DashainSaleBanner.tsx` (DELETE)
- Modify: `src/components/common/PageHeader.tsx`
- Modify: `src/components/common/DeliveryPromiseStrip.tsx`
- Modify: `src/components/common/RouteError.tsx`
- Modify: `src/components/shop/ShopFilterSidebar.tsx`
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Replace `bg-[#FFFDFC]` with `bg-brand-surfaceCream`**

Files: `Navbar.tsx`, `ShopFilterSidebar.tsx`

In `Navbar.tsx`, find `bg-[#FFFDFC]` → Replace with `bg-brand-surfaceCream`
In `ShopFilterSidebar.tsx`, find `bg-[#FFFDFC]` → Replace with `bg-brand-surfaceCream`

- [ ] **Step 2: Replace `bg-[#FFF9F7]` and `bg-[#FFF9F7]/95` with `bg-brand-surfaceWarm` and `bg-brand-surfaceWarm/95`**

Files: `Footer.tsx`, `AnnouncementBar.tsx`, `NewsletterSignup.tsx`, `NewYearOfferBanner.tsx`, `PageHeader.tsx`

In `Footer.tsx`, find `bg-[#FFF9F7]` → Replace with `bg-brand-surfaceWarm`
In `AnnouncementBar.tsx`, find `bg-[#FFF9F7]/95` → Replace with `bg-brand-surfaceWarm/95`
In `NewsletterSignup.tsx`, find `bg-[#FFF9F7]` → Replace with `bg-brand-surfaceWarm`
In `PageHeader.tsx`, find the inline gradient `bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_45%,#F7F1EA_100%)]` → Replace with `bg-[var(--gradient-editorial)]`
In `NewYearOfferBanner.tsx`, find the inline gradient `bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_55%,#F7F1EA_100%)]` → Replace with `bg-[var(--gradient-editorial)]`

- [ ] **Step 3: Replace `bg-[#FBF7F8]` with `bg-brand-surfacePink`**

Files: `HeroBanner.tsx`, `QuickCategoryPills.tsx`, `BeautyProfileQuiz.tsx`, `DeliveryPromiseStrip.tsx`

In each file, find `bg-[#FBF7F8]` → Replace with `bg-brand-surfacePink`
In `BeautyProfileQuiz.tsx`, also find `hover:bg-[#F6EEF4]` → Replace with `hover:bg-brand-primary-light`

- [ ] **Step 4: Replace gradient in RouteError.tsx**

In `RouteError.tsx`, find `bg-[linear-gradient(135deg,#FFFDFC_0%,#F8EEF2_52%,#F7F1EA_100%)]` → Replace with `bg-[var(--gradient-editorial)]`

- [ ] **Step 5: Replace hardcoded shadow values with named tokens**

In `ProductCard.tsx`, find `shadow-[0_20px_70px_-58px_rgba(36,31,34,0.55)]` → Replace with `shadow-card`
In `ProductCard.tsx`, find `shadow-[0_30px_90px_-60px_rgba(154,107,130,0.75)]` → Replace with `shadow-card-hover`
In `ProductBundleCard.tsx`, find `shadow-[0_24px_70px_-30px_rgba(139,58,143,0.4)]` → Replace with `shadow-soft`
In `BlogPreview.tsx`, find `shadow-[0_20px_60px_-15px_rgba(139,58,143,0.08)]` → Replace with `shadow-soft`
In `Footer.tsx`, find `shadow-[0_22px_70px_-55px_rgba(36,31,34,0.35)]` → Replace with `shadow-card`
In `RouteError.tsx`, find `shadow-[0_26px_90px_-65px_rgba(36,31,34,0.45)]` → Replace with `shadow-editorial`
In `NewYearOfferBanner.tsx`, find `shadow-[0_30px_90px_-65px_rgba(36,31,34,0.45)]` → Replace with `shadow-editorial`
In `Navbar.tsx`, find `shadow-[0_18px_45px_-34px_rgba(36,31,34,0.35)]` → Replace with `shadow-card`

- [ ] **Step 6: Replace hardcoded colors in PromoBannerGrid data (constants.ts)**

In `src/lib/constants.ts`, find `from-[#8B3A8F]/90` → Replace with `from-brand-primary/90`
Find `bg-[#FFF7F5]` → Replace with `bg-brand-surfaceWarm`
Find `bg-[#F8EEF2]` → Replace with `bg-brand-primary-light`
Find `bg-[#F7F1EA]` → Replace with `bg-brand-surfacePink`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: replace all hardcoded colors and shadows with design tokens"
```

---

## Task 4: Spacing Grid Alignment (8pt)

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/AnnouncementBar.tsx`
- Modify: `src/components/layout/MobileBottomNav.tsx`

- [ ] **Step 1: Fix Navbar.tsx spacing**

In `Navbar.tsx`:
- `gap-2.5` → `gap-3` (Logo component)
- `gap-5` → `gap-6` (desktop nav)
- `gap-7` → `gap-8` (desktop nav lg)
- `text-[9px]` → `text-[10px]` (Nepal subtitle — keep as custom for brand, round up to 10px)
- `text-[15px]` → `text-base` (nav links)
- `px-1.5 py-1.5` → `px-2 py-2` (mobile nav items)
- `gap-1 md:gap-2` → keep as-is (these are on 4pt grid)

- [ ] **Step 2: Fix AnnouncementBar.tsx spacing**

In `AnnouncementBar.tsx`:
- `py-2.5` → `py-3`
- `text-[11px]` → `text-xs`
- `gap-10` → `gap-8` (marquee items)

- [ ] **Step 3: Fix MobileBottomNav.tsx spacing**

In `MobileBottomNav.tsx`:
- `text-[10px]` → `text-[11px]` (keep custom for brand, bump up slightly)
- `text-[9px]` (count badge) → keep as-is (tiny badges are acceptable below minimum)
- `gap-0.5` → `gap-1`

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/
git commit -m "fix: align spacing to 8pt grid in layout components"
```

---

## Task 5: Touch Target Fixes (≥ 44px)

**Files:**
- Modify: `src/components/ui/checkbox.tsx`
- Modify: `src/components/ui/slider.tsx`
- Modify: `src/components/product/ProductCard.tsx`
- Modify: `src/components/product/ProductBundleCard.tsx`
- Modify: `src/components/cart/CartPageClient.tsx`
- Modify: `src/components/search/SearchModal.tsx`
- Modify: `src/components/layout/AnnouncementBar.tsx`
- Modify: `src/components/home/HeroBanner.tsx`
- Modify: `src/components/product/NotifyMeForm.tsx`
- Modify: `src/components/shop/ShopFilterSidebar.tsx`

- [ ] **Step 1: Fix checkbox.tsx touch target**

In `src/components/ui/checkbox.tsx`, change the checkbox root className from:

```
"grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary ...
```

to:

```
"grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary ...
```

(No size change to the visual checkbox, but ensure the wrapping `<label>` in consuming components has `min-h-[44px] min-w-[44px]` with `cursor-pointer`.)

- [ ] **Step 2: Fix slider.tsx thumb touch target**

In `src/components/ui/slider.tsx`, change the Thumb className from:

```
"block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
```

to:

```
"relative block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 after:absolute after:inset-[-12px]"
```

This adds a 44px invisible hit area around the 20px thumb.

- [ ] **Step 3: Fix ProductCard.tsx touch targets**

In `ProductCard.tsx`:
- Change wishlist button from `h-10 w-10` to `h-11 w-11`
- Change add-to-cart button to include `min-h-[44px]`

- [ ] **Step 4: Fix ProductBundleCard.tsx touch target**

In `ProductBundleCard.tsx`:
- Change add routine button to include `min-h-[44px]`

- [ ] **Step 5: Fix CartPageClient.tsx remove button**

In `CartPageClient.tsx`:
- Change remove button from `h-9 w-9` to `h-11 w-11`

- [ ] **Step 6: Fix SearchModal.tsx touch targets**

In `SearchModal.tsx`:
- Change clear button to `h-11 w-11`
- Change suggestion pills padding to `py-3 px-4`

- [ ] **Step 7: Fix AnnouncementBar.tsx dismiss button**

In `AnnouncementBar.tsx`:
- Change dismiss button from `h-7 w-7` to `h-8 w-8` with `flex items-center justify-center`

- [ ] **Step 8: Fix HeroBanner.tsx carousel dots**

In `HeroBanner.tsx`:
- Wrap carousel dot buttons in a container with `p-2` to increase touch target to ~44px

- [ ] **Step 9: Fix NotifyMeForm.tsx submit button**

In `NotifyMeForm.tsx`:
- Add `min-h-[44px]` to submit button

- [ ] **Step 10: Fix ShopFilterSidebar.tsx checkbox labels**

In `ShopFilterSidebar.tsx`:
- Add `min-h-[44px]` and `cursor-pointer` to checkbox labels
- Add `py-2` to label elements containing checkboxes

- [ ] **Step 11: Commit**

```bash
git add src/components/ui/ src/components/product/ src/components/cart/ src/components/search/ src/components/layout/AnnouncementBar.tsx src/components/home/HeroBanner.tsx src/components/shop/ShopFilterSidebar.tsx
git commit -m "fix: ensure all interactive elements meet 44px touch target minimum"
```

---

## Task 6: Accessibility Fixes

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/MobileBottomNav.tsx`
- Modify: `src/components/product/ProductCard.tsx`
- Modify: `src/components/search/SearchModal.tsx`
- Modify: `src/components/cart/CartDrawer.tsx`

- [ ] **Step 1: Add ARIA attributes to Navbar mobile menu**

In `src/components/layout/Navbar.tsx`, on the `<aside>` element, add:
- `role="dialog"`
- `aria-modal="true"`
- `aria-label="Navigation menu"`

- [ ] **Step 2: Add aria-live to MobileBottomNav cart count**

In `src/components/layout/MobileBottomNav.tsx`, on the wishlist count badge, add `aria-live="polite"` and `aria-label`:

Change the count `<span>` to include `aria-live="polite"` and wrap in a visually accessible pattern.

- [ ] **Step 3: Add aria-label to ProductCard article**

In `src/components/product/ProductCard.tsx`, on the `<article>` element, add:
- `aria-label={product.name}`

- [ ] **Step 4: Add ARIA to SearchModal**

In `src/components/search/SearchModal.tsx`, on the modal overlay div, add:
- `role="dialog"`
- `aria-modal="true"`
- `aria-label="Search products"`

- [ ] **Step 5: Add ARIA to CartDrawer**

In `src/components/cart/CartDrawer.tsx`, on the drawer panel, add:
- `role="dialog"`
- `aria-modal="true"`
- `aria-label="Shopping cart"`

- [ ] **Step 6: Add aria-live to Navbar badge counts**

In `src/components/layout/Navbar.tsx`, add `aria-live="polite"` to both the cart count and wishlist count `<span>` elements.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/ src/components/product/ProductCard.tsx src/components/search/SearchModal.tsx src/components/cart/CartDrawer.tsx
git commit -m "fix: add missing ARIA attributes for accessibility"
```

---

## Task 7: WhatsApp Clickable Phone (Announcement Bar)

**Files:**
- Modify: `src/components/layout/AnnouncementBar.tsx`

The announcement bar already has the WhatsApp link implemented! Looking at the code, line 27-30 already wraps `msg.icon === "phone"` items in an `<a>` tag with `href={WHATSAPP_URL}`. This task is already complete.

However, the dismiss button touch target needs fixing (done in Task 5), and the spacing needs fixing (done in Task 4).

- [ ] **Step 1: Verify WhatsApp link is working and style correctly**

In `AnnouncementBar.tsx`, verify the phone link has proper hover styling. The current code has `className="transition hover:text-brand-primary"` which is minimal. Enhance to:

```tsx
className="inline-flex items-center gap-2 underline decoration-brand-primary/30 underline-offset-2 transition hover:decoration-brand-primary hover:text-brand-primary"
```

This makes the phone number visually identifiable as a link.

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/AnnouncementBar.tsx
git commit -m "feat: enhance WhatsApp phone link styling in announcement bar"
```

---

## Task 8: Micro-interactions & Polish

**Files:**
- Modify: `src/app/globals.css` (already done in Task 1 — `.btn-press` and `.card-hover` utilities)
- Modify: `src/components/product/ProductCard.tsx`
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Add btn-press to Button component**

In `src/components/ui/button.tsx`, add `btn-press` to the base className of `buttonVariants`:

Change the base cva string from:
```
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
```

to:
```
"btn-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
```

- [ ] **Step 2: Add card-hover to ProductCard**

In `src/components/product/ProductCard.tsx`, add `card-hover` class to the outer `<article>` element and add `shadow-card` as the default shadow (replacing the inline shadow).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/button.tsx src/components/product/ProductCard.tsx
git commit -m "feat: add micro-interactions to buttons and cards"
```

---

## Task 9: Dead Code Cleanup & Route Consolidation

**Files:**
- Delete: `src/components/home/DashainSaleBanner.tsx`
- Modify: `src/app/page.tsx` (remove import)
- Modify: `next.config.mjs` (add redirects)
- Delete: `src/app/terms/page.tsx`
- Delete: `src/app/privacy/page.tsx`
- Delete: `src/app/shipping/page.tsx`
- Delete: `src/app/returns/page.tsx`
- Modify: `src/app/globals.css` (remove unused classes)

- [ ] **Step 1: Delete DashainSaleBanner.tsx and remove import from page.tsx**

Delete `src/components/home/DashainSaleBanner.tsx`.

In `src/app/page.tsx`, remove the line:
```tsx
import { DashainSaleBanner } from "@/components/home/DashainSaleBanner";
```
(If it exists — check first, the current file doesn't import it.)

- [ ] **Step 2: Add redirects in next.config.mjs**

In `next.config.mjs`, add redirects for duplicate routes:

```js
const nextConfig = {
  // ... existing config
  async redirects() {
    return [
      { source: '/terms', destination: '/terms-and-conditions', permanent: true },
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/shipping', destination: '/shipping-policy', permanent: true },
      { source: '/returns', destination: '/return-policy', permanent: true },
    ];
  },
};
```

- [ ] **Step 3: Delete duplicate route pages**

Delete these directories/files:
- `src/app/terms/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/shipping/page.tsx`
- `src/app/returns/page.tsx`

- [ ] **Step 4: Remove unused CSS classes from globals.css**

In `globals.css`, remove the `.bg-grain`, `.blob-1`, and `.blob-2` classes and the `@keyframes float` animation since they are not used in any component.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "cleanup: remove dead code, consolidate duplicate routes, remove unused CSS"
```

---

## Task 10: Skeleton Loaders & Empty States

**Files:**
- Create: `src/components/common/Skeleton.tsx`
- Create: `src/components/common/EmptyState.tsx`
- Modify: `src/app/loading.tsx` (use SkeletonCard)

- [ ] **Step 1: Create Skeleton.tsx**

Create `src/components/common/Skeleton.tsx`:

```tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-2xl ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-[1.5rem] border border-brand-border bg-white p-4">
      <div className="skeleton-shimmer aspect-[4/5] rounded-xl" />
      <div className="mt-4 space-y-2">
        <div className="skeleton-shimmer h-3 w-16 rounded-full" />
        <div className="skeleton-shimmer h-4 w-3/4 rounded" />
        <div className="skeleton-shimmer h-4 w-1/2 rounded" />
        <div className="mt-3 skeleton-shimmer h-8 w-full rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton-shimmer h-4 rounded ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonImage({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer aspect-square rounded-2xl ${className}`} />;
}
```

- [ ] **Step 2: Create EmptyState.tsx**

Create `src/components/common/EmptyState.tsx`:

```tsx
import Link from "next/link";
import { ShoppingBag, Heart, Search, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  cart: {
    icon: ShoppingBag,
    title: "Your cart is empty",
    description: "Looks like you haven't added any products yet.",
    cta: { label: "Start shopping", href: "/shop" },
  },
  wishlist: {
    icon: Heart,
    title: "Your wishlist is empty",
    description: "Save products you love and find them here later.",
    cta: { label: "Browse products", href: "/shop" },
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or browse our collections.",
    cta: { label: "View all products", href: "/shop" },
  },
  orders: {
    icon: Package,
    title: "No orders yet",
    description: "When you place your first order, it will appear here.",
    cta: { label: "Start shopping", href: "/shop" },
  },
} as const;

type Variant = keyof typeof variants;

export function EmptyState({ variant, className }: { variant: Variant; className?: string }) {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary-light">
        <Icon size={32} className="text-brand-primary" strokeWidth={1.5} />
      </div>
      <h3 className="mt-6 font-serif text-2xl font-semibold text-brand-textPrimary">{config.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-brand-textMuted">{config.description}</p>
      <Link
        href={config.cta.href}
        className="btn-press mt-6 rounded-full bg-brand-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/15 transition hover:bg-brand-primary-hover"
      >
        {config.cta.label}
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Update loading.tsx to use SkeletonCard**

In `src/app/loading.tsx`, replace the generic loading with:

```tsx
import { SkeletonCard } from "@/components/common/Skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/common/Skeleton.tsx src/components/common/EmptyState.tsx src/app/loading.tsx
git commit -m "feat: add skeleton loaders and designed empty states"
```

---

## Task 11: Border Radius & Input Styling Consistency

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/dialog.tsx`

- [ ] **Step 1: Update button border radius for brand consistency**

In `src/components/ui/button.tsx`, in the `buttonVariants` cva base, change `rounded-md` to `rounded-full` for the brand's rounded-full button pattern:

Change: `"btn-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md` 
To: `"btn-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full`

Also update size variants:
- `sm: "h-9 rounded-md px-3"` → `sm: "h-9 rounded-full px-3"`
- `lg: "h-11 rounded-md px-8"` → `lg: "h-11 rounded-full px-8"`

- [ ] **Step 2: Update input border radius**

In `src/components/ui/input.tsx`, change `rounded-md` to `rounded-full`:

Change: `"flex h-10 w-full rounded-md border`
To: `"flex h-10 w-full rounded-full border`

- [ ] **Step 3: Update dialog border radius**

In `src/components/ui/dialog.tsx`, change `sm:rounded-lg` to `sm:rounded-[2rem]`:

Find: `sm:rounded-lg` → Replace with: `sm:rounded-[2rem]`

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/dialog.tsx
git commit -m "feat: standardize border radius to brand pattern (rounded-full buttons, rounded-[2rem] dialogs)"
```

---

## Task 12: iOS Scroll Lock & Mobile Bottom Nav Padding

**Files:**
- Modify: `src/components/cart/CartDrawer.tsx`
- Modify: `src/components/search/SearchModal.tsx`
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Ensure scroll lock in CartDrawer**

In `CartDrawer.tsx`, verify that `document.body.classList.toggle("scroll-locked", isOpen)` is called. If not present, add a useEffect:

```tsx
useEffect(() => {
  document.body.classList.toggle("scroll-locked", cartOpen);
  return () => document.body.classList.remove("scroll-locked");
}, [cartOpen]);
```

- [ ] **Step 2: Ensure scroll lock in SearchModal**

In `SearchModal.tsx`, add the same scroll lock pattern:

```tsx
useEffect(() => {
  document.body.classList.toggle("scroll-locked", isOpen);
  return () => document.body.classList.remove("scroll-locked");
}, [isOpen]);
```

- [ ] **Step 3: Add bottom padding for MobileBottomNav in AppShell**

In `src/components/layout/AppShell.tsx`, the `<main>` already has `className="min-h-screen pb-16 md:pb-0"`. Verify this is sufficient (64px = h-16, matching MobileBottomNav height). This is correct.

- [ ] **Step 4: Commit**

```bash
git add src/components/cart/CartDrawer.tsx src/components/search/SearchModal.tsx src/components/layout/AppShell.tsx
git commit -m "fix: ensure iOS scroll lock on cart drawer and search modal"
```

---

## Task 13: Final Verification

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Successful build.

- [ ] **Step 4: Run static checks**

```bash
npm run qa:static
```

Expected: All checks pass.

- [ ] **Step 5: Commit final state if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve any typecheck/lint/build issues from UI audit"
```
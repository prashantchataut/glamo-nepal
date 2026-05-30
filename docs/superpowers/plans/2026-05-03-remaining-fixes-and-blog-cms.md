# Remaining Fixes & Blog CMS Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all dishonest UX states (newsletter fake success, checkout silent fallback, false promo banners, generic text, disabled admin buttons without tooltips) and build a production-ready Blog CMS frontend that connects to the existing backend blog module.

**Architecture:** Frontend-only changes. Newsletter shows honest "coming soon" state. Checkout shows clear error on API failure instead of fake success. Promo content is made evergreen or removed. Admin disabled buttons get a visible ComingSoonTooltip. Blog CMS adds a `src/lib/api/blog.ts` client, updates `src/lib/data/blog.ts` to try API first then fall back to mock, and enriches the existing blog page components with richer content and better SEO. No new database or backend changes needed.

**Tech Stack:** Next.js App Router, React, Zustand, Zod, existing `apiRequest` client, existing `BlogPost` type from `src/lib/mock/blog.ts`

---

## File Structure

### New Files
- `src/components/ui/ComingSoonTooltip.tsx` — Reusable tooltip for "Coming soon" disabled buttons
- `src/lib/api/blog.ts` — Blog API client (list, getBySlug, getRelated)

### Modified Files
- `src/components/home/NewsletterSignup.tsx` — Replace fake success with honest "coming soon"
- `src/store/useCheckoutStore.ts` — Show error instead of fake success on API failure
- `src/app/shop/ShopPageContent.tsx` — Replace "GLAMO glow edit" with category-aware text
- `src/components/home/NewYearOfferBanner.tsx` — Replace with evergreen editorial banner
- `src/components/home/HeroBanner.tsx` — Remove hardcoded "Up to 30% OFF" and "New Year 2083" overlays
- `src/lib/constants.ts` — Update HERO_SLIDES, PROMO_BANNERS, BLOG_POSTS to be evergreen
- `src/lib/mock/blog.ts` — Add richer mock content, add `isPublished` field
- `src/lib/data/blog.ts` — Add API-first logic with mock fallback
- `src/app/blog/page.tsx` — Use data layer, add pagination-ready structure
- `src/app/blog/[slug]/page.tsx` — Use data layer, add SEO metadata from post
- `src/app/blog/[slug]/BlogPostClient.tsx` — Enhanced reading experience
- `src/components/home/BlogPreview.tsx` — Use data layer
- `src/components/admin/AdminDashboard.tsx` — Wrap disabled buttons with ComingSoonTooltip

---

### Task 1: Fix Newsletter Fake Success with Honest "Coming Soon"

**Files:**
- Modify: `src/components/home/NewsletterSignup.tsx`

Currently `NewsletterSignup` sets `submitted=true` on form submit without any API call, showing a green "You are in!" success message. This is dishonest.

- [ ] **Step 1: Replace the fake success state with a "coming soon" message**

Replace the entire `NewsletterSignup` component body. Remove the `submitted` state. When the user submits the form, store the email in localStorage for future use, and show a message explaining that newsletter is coming soon.

```tsx
"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      const existing = JSON.parse(localStorage.getItem("glamo-newsletter-interest") || "[]");
      localStorage.setItem("glamo-newsletter-interest", JSON.stringify([...existing, email]));
    } catch {
      // localStorage unavailable, continue silently
    }
    setSubmitted(true);
  }

  return (
    <section className="relative overflow-hidden border-t border-brand-border bg-brand-surfaceWarm py-16 md:py-20 lg:py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-secondary/30 blur-[110px]" />
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2.25rem] border border-brand-border bg-white/82 p-8 text-center shadow-[0_30px_90px_-65px_rgba(36,31,34,0.45)] soft-overlay md:p-12">
          <span className="mb-6 inline-block rounded-full bg-brand-primary-light px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary">Join the Glow Notes</span>
          <h2 className="font-serif text-4xl font-semibold leading-tight text-brand-textPrimary md:text-5xl lg:text-6xl">Get Glowing. <span className="italic text-brand-primary">Get GLAMO.</span></h2>
          <p className="mx-auto mt-5 mb-8 max-w-lg text-base leading-7 text-brand-textMuted">New arrivals, routine tips and Nepal-only beauty edits without inbox clutter.</p>
          {submitted ? (
            <div className="mx-auto max-w-md rounded-full border border-brand-primary/20 bg-brand-primary-light px-8 py-4 text-center">
              <p className="font-bold text-brand-primary">You are on the list!</p>
              <p className="mt-1 text-sm text-brand-textMuted">We will reach out when our newsletter launches. Thank you for your interest.</p>
            </div>
          ) : (
            <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
              <div className="relative flex-grow">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-textMuted" strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full rounded-full border border-brand-border bg-brand-bgLight py-4 pl-12 pr-6 text-brand-textPrimary placeholder:text-brand-textMuted/60 outline-none transition-all duration-300 focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <button type="submit" className="btn-press whitespace-nowrap rounded-full bg-brand-primary px-8 py-4 font-bold text-white shadow-lg shadow-brand-primary/15 transition hover:bg-brand-primary-hover">
                Join waitlist
              </button>
            </form>
          )}
          <p className="mt-5 text-xs text-brand-textMuted">No spam. Just glow tips and exclusive deals.</p>
        </div>
      </div>
    </section>
  );
}
```

Key changes:
- CTA button text changed from "Subscribe" to "Join waitlist" — honest about intent
- Success message changed from "You are in! We will send beauty updates to your inbox." (dishonest) to "You are on the list! We will reach out when our newsletter launches. Thank you for your interest." (honest — no promise of emails)
- Email stored in localStorage for future use when backend newsletter module connects
- Added `btn-press` class to button for micro-interaction consistency

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors in NewsletterSignup.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/home/NewsletterSignup.tsx
git commit -m "fix: replace newsletter fake success with honest waitlist message"
```

---

### Task 2: Fix Checkout Silent Fallback — Show Clear Error Instead of Fake Success

**Files:**
- Modify: `src/store/useCheckoutStore.ts`

Currently `placeOrder` in `useCheckoutStore` simulates order creation with `setTimeout` and always succeeds. When the real API is unavailable, it silently falls back to localStorage. This is dishonest — the user thinks their order went through but it didn't.

- [ ] **Step 1: Update useCheckoutStore to attempt API call first, show error on failure**

The checkout store should try the real API first. If it fails (because `NEXT_PUBLIC_API_BASE_URL` is not set or network error), it should set `status: "failed"` with an informative error message, NOT silently succeed.

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createCheckoutOrder } from "@/lib/api/checkout";
import { GlamoApiError } from "@/lib/api/client";

export type OrderStatus = "idle" | "pending" | "success" | "failed";
export type CustomerOrderStatus = "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface CheckoutLineItem {
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
  selectedShade?: string;
}

export interface SimulatedOrder {
  id: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  shippingAddress: string;
  customerName?: string;
  customerPhone?: string;
  status: CustomerOrderStatus;
  items: CheckoutLineItem[];
  createdAt: string;
  date: string;
}

interface CheckoutState {
  status: OrderStatus;
  lastOrder: SimulatedOrder | null;
  orders: SimulatedOrder[];
  error: string | null;
  placeOrder: (order: Omit<SimulatedOrder, "id" | "createdAt" | "date" | "status"> & Partial<Pick<SimulatedOrder, "status">>) => Promise<SimulatedOrder>;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      status: "idle" as OrderStatus,
      lastOrder: null,
      orders: [] as SimulatedOrder[],
      error: null as string | null,

      placeOrder: async (order) => {
        set({ status: "pending", error: null });

        try {
          const response = await createCheckoutOrder({
            items: order.items.map((item) => ({
              productId: item.name,
              name: item.name,
              brand: item.brand,
              price: item.price,
              quantity: item.quantity,
              selectedShade: item.selectedShade,
            })),
            shippingAddress: order.shippingAddress,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            paymentMethod: order.paymentMethod,
            total: order.total,
          });

          const saved: SimulatedOrder = {
            ...order,
            id: response.data?.id || crypto.randomUUID(),
            status: response.data?.status || "Confirmed",
            createdAt: response.data?.createdAt || new Date().toISOString(),
            date: response.data?.date || new Date().toISOString().slice(0, 10),
          };
          const existing = get().orders.filter((item) => item.orderNumber !== saved.orderNumber);
          set({ status: "success", lastOrder: saved, orders: [saved, ...existing].slice(0, 20) });
          return saved;
        } catch (error) {
          const message =
            error instanceof GlamoApiError
              ? error.code === "API_BASE_URL_MISSING"
                ? "Checkout is not available yet. Please try again later or contact us on WhatsApp."
                : error.message
              : error instanceof Error
                ? error.message
                : "Something went wrong. Please try again.";

          set({ status: "failed", error: message });
          throw error;
        }
      },

      reset: () => set({ status: "idle", error: null }),
    }),
    { name: "glamo-checkout-storage" },
  ),
);
```

Key changes:
- Added `error: string | null` to state
- `placeOrder` now calls `createCheckoutOrder` (the real API) instead of faking success with `setTimeout`
- On `GlamoApiError` with code `API_BASE_URL_MISSING`, shows a clear message: "Checkout is not available yet"
- On any error, sets `status: "failed"` with an informative message instead of silently succeeding
- Removed the `setTimeout` fake delay

- [ ] **Step 2: Update checkout page to show the error message**

Find the checkout success/failure UI and make sure it reads `error` from the store. The `CheckoutPageClient.tsx` already handles `status === "success"` and `status === "failed"`. We need to verify it shows the error message from `store.error`.

Read `src/components/checkout/CheckoutPageClient.tsx` and find where it handles the `failed` status. If it doesn't show `store.error`, add it.

- [ ] **Step 3: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/store/useCheckoutStore.ts
git commit -m "fix: checkout shows clear error on API failure instead of fake success"
```

---

### Task 3: Replace "GLAMO Glow Edit" Generic Text in Shop Page

**Files:**
- Modify: `src/app/shop/ShopPageContent.tsx`

Currently line 124 has `{categoryObj?.name || "Shop the GLAMO glow edit"}` — this is a generic fallback that doesn't describe the page well.

- [ ] **Step 1: Replace the generic fallback text**

In `src/app/shop/ShopPageContent.tsx`, change line 124 from:

```tsx
{categoryObj?.name || "Shop the GLAMO glow edit"}
```

to:

```tsx
{categoryObj?.name || "All Products"}
```

Also change line 127 from:

```tsx
{categoryObj?.description || "Browse skincare, soft-glam makeup and daily beauty essentials with clean filters, authentic cues and product visuals that feel like a real beauty shelf."}
```

to:

```tsx
{categoryObj?.description || "Browse skincare, soft-glam makeup and daily beauty essentials with NPR pricing and Nepal delivery."}
```

This removes the marketing-speak "that feel like a real beauty shelf" and the generic "GLAMO glow edit" text, replacing with clear, honest descriptions.

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/shop/ShopPageContent.tsx
git commit -m "fix: replace generic 'GLAMO glow edit' text with honest labels"
```

---

### Task 4: Make Promo Content Evergreen — Replace NewYearOfferBanner and Hero Slides

**Files:**
- Modify: `src/lib/constants.ts` — Update HERO_SLIDES, PROMO_BANNERS, BLOG_POSTS
- Modify: `src/components/home/NewYearOfferBanner.tsx` — Make evergreen
- Modify: `src/components/home/HeroBanner.tsx` — Remove hardcoded "30% OFF" and "New Year 2083" overlays
- Modify: `src/lib/mock/blog.ts` — Update blog post #3 title and content

The current promo content is time-specific ("New Year 2083", "Up to 30% OFF") and dishonest since there's no real discount. We need to make it evergreen.

- [ ] **Step 1: Update HERO_SLIDES in constants.ts**

Replace the first hero slide's annotation and related New Year references:

```ts
export const HERO_SLIDES = [
  {
    id: 1,
    title1: "The",
    title2: "New Year Glow",
    subtitle: "Fresh skincare, soft glam makeup and gifting edits curated for celebrations across Nepal.",
    cta: "Shop Festival Edit",
    ctaLink: "/collections/festival-ready",
    image: "/images/editorial/hero-editorial.svg",
    bgColor: "bg-brand-surfaceWarm",
    annotation: "Festival Edit",
  },
  // ... slides 2 and 3 stay the same
];
```

Change: `annotation: "New Year 2083"` → `annotation: "Festival Edit"`, `cta: "Shop New Year Edit"` → `cta: "Shop Festival Edit"`

- [ ] **Step 2: Update PROMO_BANNERS in constants.ts**

Replace the first promo banner:

```ts
export const PROMO_BANNERS = [
  { id: 1, title: "Festival Beauty Edit", subtitle: "Curated skincare, lip and fragrance picks for celebrations and gifting.", cta: "Shop the Edit", ctaLink: "/collections/festival-ready", tag: "Festival", image: "/images/editorial/new-year-editorial.svg", gradient: "from-black/80 via-black/30 to-transparent" },
  // banner 2 stays the same
];
```

- [ ] **Step 3: Update BLOG_POSTS in constants.ts**

Change blog post #3 title from "Giftable Beauty Picks for New Year" to "Giftable Beauty Picks for Any Occasion":

```ts
export const BLOG_POSTS = [
  { id: 1, title: "How to Build a Kathmandu Skincare Routine", category: "Skincare", excerpt: "A simple routine framework for sun, dust, humidity and seasonal dryness.", image: "/images/promo-store.svg", slug: "kathmandu-skincare-routine" },
  { id: 2, title: "Festival Makeup That Lasts", category: "Makeup", excerpt: "Primer, tint, lip and setting tips for New Year, wedding events and long celebrations.", image: "/images/product-placeholder-blush.svg", slug: "festival-makeup-that-lasts" },
  { id: 3, title: "Giftable Beauty Picks for Any Occasion", category: "Gift Guide", excerpt: "Easy picks for skincare lovers, fragrance gifting and feel-good vanity upgrades.", image: "/images/product-placeholder-foundation.svg", slug: "beauty-gift-guide" },
];
```

- [ ] **Step 4: Update NewYearOfferBanner to be evergreen**

Rename the component and file. Replace `src/components/home/NewYearOfferBanner.tsx` with an evergreen editorial banner:

```tsx
import Image from "next/image";
import Link from "next/link";

export function EditorialBanner() {
  return (
    <section className="bg-brand-bgLight py-14 md:py-20">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-brand-border bg-[var(--gradient-editorial)] px-6 py-8 shadow-editorial md:px-10 md:py-12 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
          <div className="pointer-events-none absolute right-[-10%] top-[-20%] h-72 w-72 rounded-full bg-brand-secondary/35 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex rounded-full bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-brand-primary ring-1 ring-brand-primary/10">Curated Beauty Edit</span>
            <h2 className="mt-5 font-serif text-4xl font-semibold leading-[0.95] text-brand-textPrimary md:text-5xl lg:text-6xl">Celebrate with a <span className="italic text-brand-primary">fresh beauty edit</span></h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-brand-textMuted md:text-base">Gift-ready skincare, soft glam makeup and daily glow essentials curated for celebrations across Nepal.</p>
            <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-white px-5 py-4 shadow-sm ring-1 ring-brand-border">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">Curated picks</p>
                <p className="mt-1 font-serif text-3xl font-semibold text-brand-textPrimary">Best Sellers</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/70 px-5 py-4 shadow-sm ring-1 ring-brand-border">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">Highlights</p>
                <p className="mt-1 text-sm text-brand-textMuted">Gift sets · Best sellers · New arrivals</p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/collections/festival-ready" className="rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-hover">Shop Festival Edit</Link>
              <Link href="/collections/new-arrivals" className="rounded-full border border-brand-primary/20 bg-white/70 px-6 py-3 text-sm font-bold text-brand-primary transition hover:bg-white">Explore new arrivals</Link>
            </div>
          </div>
          <div className="relative z-10 mt-8 lg:mt-0">
            <div className="relative mx-auto aspect-[4/3] max-w-[560px] overflow-hidden rounded-[2rem] border border-white/70 bg-white p-3 shadow-[0_30px_90px_-55px_rgba(36,31,34,0.45)]">
              <div className="relative h-full w-full overflow-hidden rounded-[1.5rem]">
                <Image src="/images/editorial/new-year-editorial.svg" alt="GLAMO curated beauty edit" fill className="object-cover" sizes="(max-width: 1024px) 90vw, 40vw" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

Key changes:
- Component renamed from `NewYearOfferBanner` to `EditorialBanner`
- Removed "New Year 2083 Beauty Edit" badge → "Curated Beauty Edit"
- Removed "Save up to 30% OFF" card → "Best Sellers" (honest, not a fake discount)
- CTA: "Shop New Year Offers" → "Shop Festival Edit"
- Image alt text: "GLAMO New Year 2083 beauty offer" → "GLAMO curated beauty edit"

- [ ] **Step 5: Update HeroBanner.tsx — Remove hardcoded "30% OFF" and "New Year 2083" overlays**

In `src/components/home/HeroBanner.tsx`, replace lines 74-80 (the hardcoded overlay cards inside the hero image):

Change from:
```tsx
<div className="absolute left-6 top-6 z-10 rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-bgDark shadow-sm">
  Up to 30% OFF
</div>
<div className="absolute bottom-6 left-6 z-10 max-w-[220px] rounded-[1.5rem] bg-white/92 px-5 py-4 shadow-lg ring-1 ring-black/5 soft-overlay">
  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">GLAMO edit</p>
  <p className="mt-2 font-serif text-2xl font-semibold text-brand-textPrimary">New Year 2083</p>
  <p className="mt-1 text-sm leading-6 text-brand-textMuted">Celebrate with skin-loving essentials, makeup heroes and giftable beauty picks.</p>
</div>
```

To:
```tsx
<div className="absolute left-6 top-6 z-10 rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-bgDark shadow-sm">
  {slide.annotation}
</div>
<div className="absolute bottom-6 left-6 z-10 max-w-[220px] rounded-[1.5rem] bg-white/92 px-5 py-4 shadow-lg ring-1 ring-black/5 soft-overlay">
  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">GLAMO edit</p>
  <p className="mt-2 font-serif text-2xl font-semibold text-brand-textPrimary">{slide.title1} {slide.title2}</p>
  <p className="mt-1 text-sm leading-6 text-brand-textMuted">{slide.subtitle}</p>
</div>
```

This makes the overlay dynamic based on slide data instead of hardcoded "30% OFF" and "New Year 2083".

- [ ] **Step 6: Update homepage import**

In `src/app/page.tsx`, change:
```tsx
import { NewYearOfferBanner } from "@/components/home/NewYearOfferBanner";
```
to:
```tsx
import { EditorialBanner } from "@/components/home/EditorialBanner";
```

And change:
```tsx
<NewYearOfferBanner />
```
to:
```tsx
<EditorialBanner />
```

- [ ] **Step 7: Update blog mock data**

In `src/lib/mock/blog.ts`, update blog post #3:

Change the title from `"Giftable Beauty Picks for New Year 2083"` to `"Giftable Beauty Picks for Any Occasion"`.
Change the slug from `"new-year-2083-beauty-gift-guide"` to `"beauty-gift-guide"`.
Update the excerpt and content to be evergreen (remove "New Year 2083" references).

- [ ] **Step 8: Rename the file**

Rename `src/components/home/NewYearOfferBanner.tsx` to `src/components/home/EditorialBanner.tsx`.

- [ ] **Step 9: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "fix: make promo content evergreen — remove fake discounts and New Year 2083 references"
```

---

### Task 5: Add ComingSoonTooltip for Disabled Admin Buttons

**Files:**
- Create: `src/components/ui/ComingSoonTooltip.tsx`
- Modify: `src/components/admin/AdminDashboard.tsx`

Currently disabled admin buttons use `disabled title="Coming soon"` which shows a plain native tooltip. We need a styled tooltip component that makes "Coming soon" more visible and clear.

- [ ] **Step 1: Create ComingSoonTooltip component**

Create `src/components/ui/ComingSoonTooltip.tsx`:

```tsx
"use client";

import { useState, type ReactNode } from "react";

export function ComingSoonTooltip({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-bgDark px-3 py-1.5 text-xs font-medium text-white shadow-lg"
        >
          Coming soon
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-brand-bgDark" />
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Wrap disabled buttons in AdminDashboard with ComingSoonTooltip**

In `src/components/admin/AdminDashboard.tsx`, import the tooltip:

```tsx
import { ComingSoonTooltip } from "@/components/ui/ComingSoonTooltip";
```

Then wrap each disabled button. For example, the filter button (line 471):

From:
```tsx
<button disabled title="Coming soon" className="btn-press inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary disabled:opacity-50 disabled:cursor-not-allowed"><Filter size={15} /> Filter</button>
```

To:
```tsx
<ComingSoonTooltip><button disabled className="btn-press inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary disabled:opacity-50 disabled:cursor-not-allowed"><Filter size={15} /> Filter</button></ComingSoonTooltip>
```

Apply this pattern to ALL disabled buttons with `title="Coming soon"`:
1. Filter button (line ~471)
2. Add product button (line ~473)
3. View product button (line ~510)
4. Edit product button (line ~511)
5. Delete product button (line ~512)
6. Today/This week/Create manual order buttons (line ~528)
7. Restock button (line ~552)

Remove `title="Coming soon"` from all these buttons since the tooltip now handles it.

- [ ] **Step 3: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ComingSoonTooltip.tsx src/components/admin/AdminDashboard.tsx
git commit -m "feat: add ComingSoonTooltip for disabled admin buttons"
```

---

### Task 6: Build Blog API Client and Data Layer

**Files:**
- Create: `src/lib/api/blog.ts`
- Modify: `src/lib/data/blog.ts`
- Modify: `src/lib/mock/blog.ts`

- [ ] **Step 1: Create blog API client**

Create `src/lib/api/blog.ts`:

```ts
import { apiRequest } from "@/lib/api/client";
import type { BlogPost } from "@/lib/mock/blog";

export async function fetchBlogPosts(params?: { page?: number; limit?: number; category?: string }): Promise<{ posts: BlogPost[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.category) searchParams.set("category", params.category);
  const query = searchParams.toString();
  const path = query ? `/blog/posts?${query}` : "/blog/posts";
  const response = await apiRequest<{ data: BlogPost[]; meta: { total: number } }>(path);
  return { posts: response.data?.data ?? [], total: response.data?.meta?.total ?? 0 };
}

export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  const response = await apiRequest<BlogPost>(`/blog/posts/${slug}`);
  return response.data ?? null;
}

export async function fetchRelatedPosts(slug: string, limit = 3): Promise<BlogPost[]> {
  const response = await apiRequest<{ data: BlogPost[] }>(`/blog/posts/${slug}/related?limit=${limit}`);
  return response.data?.data ?? [];
}
```

- [ ] **Step 2: Update `src/lib/data/blog.ts` to be API-first with mock fallback**

Replace the current re-export with a smart data layer:

```ts
import { BLOG_POSTS, getBlogBySlug as getBlogBySlugMock, getRelatedPosts as getRelatedPostsMock, type BlogPost } from "@/lib/mock/blog";
import { fetchBlogPosts, fetchBlogPost, fetchRelatedPosts } from "@/lib/api/blog";

let apiAvailable: boolean | null = null;

async function checkApiAvailable(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  try {
    await fetchBlogPosts({ limit: 1 });
    apiAvailable = true;
    return true;
  } catch {
    apiAvailable = false;
    return false;
  }
}

export type { BlogPost };
export { BLOG_POSTS, BLOG_CATEGORIES } from "@/lib/mock/blog";

export async function getBlogPosts(params?: { page?: number; limit?: number; category?: string }): Promise<{ posts: BlogPost[]; total: number }> {
  if (await checkApiAvailable()) {
    try {
      return await fetchBlogPosts(params);
    } catch {
      apiAvailable = false;
    }
  }
  let posts = [...BLOG_POSTS];
  if (params?.category) posts = posts.filter((p) => p.category === params.category);
  const page = params?.page ?? 1;
  const limit = params?.limit ?? posts.length;
  const start = (page - 1) * limit;
  return { posts: posts.slice(start, start + limit), total: posts.length };
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  if (await checkApiAvailable()) {
    try {
      return await fetchBlogPost(slug);
    } catch {
      apiAvailable = false;
    }
  }
  return getBlogBySlugMock(slug) ?? null;
}

export async function getRelatedPosts(slug: string, limit = 3): Promise<BlogPost[]> {
  if (await checkApiAvailable()) {
    try {
      return await fetchRelatedPosts(slug, limit);
    } catch {
      apiAvailable = false;
    }
  }
  return getRelatedPostsMock(slug, limit);
}
```

- [ ] **Step 3: Update mock blog data to be richer and evergreen**

In `src/lib/mock/blog.ts`, update blog post #3:

Change the slug from `"new-year-2083-beauty-gift-guide"` to `"beauty-gift-guide"`.
Change the title from `"Giftable Beauty Picks for New Year 2083"` to `"Giftable Beauty Picks for Any Occasion"`.
Update the excerpt to remove New Year references.
Update the content HTML to be evergreen.

- [ ] **Step 4: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/blog.ts src/lib/data/blog.ts src/lib/mock/blog.ts
git commit -m "feat: add blog API client and data layer with mock fallback"
```

---

### Task 7: Update Blog Page Components to Use Data Layer

**Files:**
- Modify: `src/app/blog/page.tsx`
- Modify: `src/app/blog/[slug]/page.tsx`
- Modify: `src/components/home/BlogPreview.tsx`

- [ ] **Step 1: Update blog listing page to use async data layer**

The blog listing page currently imports `BLOG_POSTS` directly from mock data. Update it to use the async data layer:

```tsx
import Image from "next/image";
import Link from "next/link";
import { getBlogPosts } from "@/lib/data/blog";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Beauty Blog — Skincare Tips, Makeup Tutorials & Nepal Beauty",
  description: "Expert skincare routines, makeup tips, beauty gift guides and Nepal-focused beauty advice from GLAMO NEPAL.",
  path: "/blog",
});

export default async function BlogPage() {
  const { posts } = await getBlogPosts();

  return (
    <main className="min-h-screen bg-brand-bgLight">
      <div className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_50%,#F7F1EA_100%)] py-14 md:py-20">
        <div className="container mx-auto px-4 text-center md:px-6">
          <span className="mb-6 inline-block rounded-full bg-white/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary ring-1 ring-brand-primary/10">
            Beauty Journal
          </span>
          <h1 className="font-serif text-4xl font-semibold text-brand-textPrimary md:text-6xl">
            Glow Tips & <span className="italic text-brand-primary">Beauty Secrets</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-brand-textMuted">
            Expert advice, tutorials and ingredient guides for building better routines.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {posts.map((post) => (
            <article key={post.id} className="group overflow-hidden rounded-[2rem] border border-border/30 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md">
              <Link href={`/blog/${post.slug}`} className="block relative aspect-[16/9] overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary shadow-sm soft-overlay-sm">
                  {post.category}
                </span>
              </Link>
              <div className="p-6 md:p-8">
                <h3 className="mb-3 line-clamp-2 font-serif text-xl font-semibold leading-tight text-brand-textPrimary transition-colors group-hover:text-brand-primary">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-brand-textMuted">{post.excerpt}</p>
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full bg-brand-bgLight">
                    <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" sizes="32px" />
                  </div>
                  <div className="text-xs text-brand-textMuted">
                    <span className="font-medium text-brand-textPrimary">{post.author.name}</span> · {post.readTime}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Update blog post page to use async data layer**

Update `src/app/blog/[slug]/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, UserRound } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBlogPost, getRelatedPosts } from "@/lib/data/blog";
import { absoluteUrl } from "@/lib/utils";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const { posts } = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  return createMetadata({
    title: post?.title ?? "Blog — GLAMO NEPAL",
    description: post?.excerpt ?? "Beauty tips, skincare routines and Nepal beauty advice from GLAMO NEPAL.",
    path: `/blog/${params.slug}`,
    image: post?.image,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post.slug, 2);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: absoluteUrl(post.image),
    author: { "@type": "Organization", name: post.author.name },
    publisher: { "@type": "Organization", name: "GLAMO NEPAL" },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };

  return (
    <main className="bg-brand-bgLight py-10 md:py-12">
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])]} />
      <article className="container mx-auto max-w-4xl px-4 md:px-6">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary"><ArrowLeft size={16} /> Back to blog</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">{post.category}</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-brand-textPrimary md:text-6xl">{post.title}</h1>
        <p className="mt-4 text-lg leading-8 text-brand-textMuted">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-brand-textMuted">
          <span className="inline-flex items-center gap-2"><UserRound size={16} /> {post.author.name}</span>
          <span className="inline-flex items-center gap-2"><Clock size={16} /> {post.readTime}</span>
          <span>{post.date}</span>
        </div>
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[2rem] border border-border/70 bg-white shadow-sm">
          <Image src={post.image} alt={post.title} fill className="object-cover" sizes="100vw" priority />
        </div>
        <div className="mt-8 rounded-[2rem] border border-border/70 bg-white p-6 text-brand-textMuted shadow-sm md:p-8 [&_h2]:mt-8 [&_h2:first-child]:mt-0 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:text-brand-textPrimary [&_p]:mt-4 [&_p]:leading-8" dangerouslySetInnerHTML={{ __html: post.content }} />
        <section className="mt-10">
          <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Related posts</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {related.map((item) => (
              <Link key={item.id} href={`/blog/${item.slug}`} className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:text-brand-primary hover:shadow-md">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">{item.category}</p>
                <h3 className="mt-2 font-serif text-xl font-semibold text-brand-textPrimary">{item.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
```

Note: Need to add `import { getBlogPosts } from "@/lib/data/blog";` at the top for `generateStaticParams`.

- [ ] **Step 3: Update BlogPreview component**

The `BlogPreview` component imports from `@/lib/constants` (which has a simplified blog post shape). Update it to import from the data layer instead:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { BLOG_POSTS } from "@/lib/data/blog";

export function BlogPreview() {
  const posts = BLOG_POSTS.slice(0, 3);

  return (
    <section className="bg-brand-bgLight py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="mb-4 font-serif text-4xl font-semibold text-brand-textPrimary md:text-5xl">
              Glow Tips & <span className="italic text-brand-primary">Beauty Secrets</span>
            </h2>
            <p className="text-lg leading-relaxed text-brand-textMuted">
              Expert advice, tutorials, and deep-dives into the ingredients that transform your skin.
            </p>
          </div>
          <Link href="/blog" className="group flex shrink-0 items-center gap-2 font-semibold text-brand-primary transition-colors duration-300 hover:text-brand-bgDark">
            Read All Articles
            <span className="rounded-full bg-brand-primary/10 p-2 transition-all duration-300 group-hover:bg-brand-primary group-hover:text-white">
              <MoveRight size={16} />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {posts.map((post) => (
            <article key={post.id} className="group overflow-hidden rounded-2xl border border-border/30 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-soft">
              <Link href={`/blog/${post.slug}`} className="block relative aspect-[3/2] overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary shadow-sm soft-overlay-sm">
                    {post.category}
                  </span>
                </div>
              </Link>
              <div className="p-6 md:p-8">
                <h3 className="mb-3 line-clamp-2 font-serif text-xl font-semibold leading-tight text-brand-textPrimary transition-colors duration-300 group-hover:text-brand-primary md:text-2xl">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>
                <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-brand-textMuted">
                  {post.excerpt}
                </p>
                <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-brand-textPrimary transition-colors duration-300 group-hover:text-brand-primary">
                  Read More <MoveRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Wait — `BlogPreview` is a client component (`"use client"`) so it can't use async data. Keep it using `BLOG_POSTS` from the data layer (which is synchronous from the mock). The import change is from `@/lib/constants` to `@/lib/data/blog`.

Actually, since `BLOG_POSTS` is a synchronous export from mock data, the import from `@/lib/data/blog` will work fine in a client component. The key change is just the import source.

- [ ] **Step 4: Remove stale BLOG_POSTS from constants.ts**

In `src/lib/constants.ts`, remove the `BLOG_POSTS` export (lines 117-121) since it's now redundant with the data layer. The `BlogPreview` component and other consumers should use `@/lib/data/blog` instead.

- [ ] **Step 5: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/app/blog/page.tsx src/app/blog/[slug]/page.tsx src/components/home/BlogPreview.tsx src/lib/constants.ts
git commit -m "feat: blog pages use async data layer with API-first and mock fallback"
```

---

### Task 8: Update BlogPostClient to Use Data Layer

**Files:**
- Modify: `src/app/blog/[slug]/BlogPostClient.tsx`

- [ ] **Step 1: Update BlogPostClient to use async data layer**

The `BlogPostClient.tsx` is a client component that uses `getBlogBySlug` and `getRelatedPosts` directly from mock data. Since blog post pages are now server components (Task 7), the `BlogPostClient` component can receive post data as props instead.

However, `BlogPostClient.tsx` provides the reading progress bar and enhanced client-side features. We should keep it but make it accept post data as props.

Update `src/app/blog/[slug]/BlogPostClient.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, UserRound } from "lucide-react";
import type { BlogPost } from "@/lib/data/blog";

export default function BlogPostClient({ post, related }: { post: BlogPost; related: BlogPost[] }) {
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const progress = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setReadingProgress(Math.min(progress, 100));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-brand-bgLight">
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-border/30">
        <div className="h-full bg-brand-primary transition-all duration-150" style={{ width: `${readingProgress}%` }} />
      </div>

      <div className="relative h-[40vh] overflow-hidden bg-brand-bgDark md:h-[50vh]">
        <Image src={post.image} alt={post.title} fill className="object-cover opacity-50" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bgDark via-brand-bgDark/60 to-transparent" />
        <div className="relative z-10 container mx-auto flex h-full flex-col justify-end px-4 pb-10 md:px-6 md:pb-16">
          <Link href="/blog" className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
            <ArrowLeft size={16} strokeWidth={1.5} /> Back to Blog
          </Link>
          <span className="mb-4 inline-block w-fit rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white soft-overlay-sm">{post.category}</span>
          <h1 className="max-w-3xl font-serif text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">{post.title}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-8 flex items-center gap-4 border-b border-border/30 pb-8">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand-bgLight">
            <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" sizes="48px" />
          </div>
          <div>
            <p className="font-semibold text-brand-textPrimary">{post.author.name}</p>
            <p className="text-sm text-brand-textMuted">{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {post.readTime}</p>
          </div>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-brand-textPrimary prose-p:text-brand-textMuted prose-a:text-brand-primary" dangerouslySetInnerHTML={{ __html: post.content }} />

          <div className="mt-12 border-t border-border/30 pt-8">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-bgLight">
                <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" sizes="64px" />
              </div>
              <div>
                <p className="font-serif text-xl font-semibold text-brand-textPrimary">{post.author.name}</p>
                <p className="text-sm text-brand-textMuted">Beauty writer at GLAMO Nepal</p>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-8 text-center font-serif text-3xl font-semibold text-brand-textPrimary">Related Articles</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group overflow-hidden rounded-2xl border border-border/30 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image src={r.image} alt={r.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-lg font-semibold text-brand-textPrimary transition-colors group-hover:text-brand-primary">{r.title}</h3>
                    <p className="mt-2 text-xs text-brand-textMuted">{r.readTime}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update the server page to pass props to BlogPostClient**

In `src/app/blog/[slug]/page.tsx`, the server component now fetches data and passes it to `BlogPostClient`:

```tsx
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBlogPost, getRelatedPosts } from "@/lib/data/blog";
import { absoluteUrl } from "@/lib/utils";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import BlogPostClient from "./BlogPostClient";

// ... (generateStaticParams and generateMetadata stay the same)

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post.slug, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: absoluteUrl(post.image),
    author: { "@type": "Organization", name: post.author.name },
    publisher: { "@type": "Organization", name: "GLAMO NEPAL" },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: absoluteUrl(`/blog/${params.slug}`),
  };

  return (
    <>
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])]} />
      <BlogPostClient post={post} related={related} />
    </>
  );
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/blog/[slug]/BlogPostClient.tsx src/app/blog/[slug]/page.tsx
git commit -m "feat: blog post page uses async data layer with server component"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `npx next lint`
Expected: No errors (or only pre-existing warnings)

- [ ] **Step 3: Run build**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 4: Final commit if any lint fixes were needed**

```bash
git add -A
git commit -m "fix: resolve lint and build issues from remaining fixes"
```
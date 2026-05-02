# Critical Fixes & Form Infrastructure Design

**Date:** 2026-05-02
**Status:** Approved

## Problem Summary

A critical analysis identified 20 issues in the GLAMO NEPAL site. After code review, the real issues are:

| # | Issue | Severity |
|---|-------|----------|
| 1 | Blog route conflict — `page.tsx` is a post page, conflicting with `[slug]/page.tsx` | Critical |
| 2 | API URL not configured — `NEXT_PUBLIC_API_BASE_URL` missing, checkout API throws | Critical |
| 3 | Contact form dead submit (`type="button"`) + fake submission in ContactClient | Critical |
| 4 | No form validation — Zod + react-hook-form installed but unused | High |
| 5 | No form feedback (success/error/loading states) | High |
| 6 | Missing ARIA labels on icon buttons | Medium |
| 7 | Missing loading states (add-to-cart, page transitions) | Medium |

## Design Decisions

### Approach: Shared Form Infrastructure + Targeted Fixes

Zod and react-hook-form are already in `package.json` but unused. Build shared validation infrastructure, then apply it to all forms.

---

## 1. Blog Route Conflict Fix

**Problem:** `src/app/blog/page.tsx` contains a blog post component with `generateStaticParams` for slugs. `src/app/blog/[slug]/page.tsx` also exists with nearly identical code. Next.js routing conflict causes `/blog` to render a post page instead of a listing.

**Fix:**
- Delete the current `src/app/blog/page.tsx` (duplicate of `[slug]/page.tsx`)
- Create a new `src/app/blog/page.tsx` as a blog listing page that:
  - Imports `BLOG_POSTS` from `@/lib/constants` (same data source as `BlogPreview`)
  - Renders a grid of post cards with title, excerpt, category, date, image
  - Links each card to `/blog/[slug]`
  - Has proper SEO metadata via `createMetadata`
  - Uses the same design language as the rest of the site (rounded cards, brand colors)

**Files changed:**
- `src/app/blog/page.tsx` — rewritten as listing page
- `src/app/blog/[slug]/page.tsx` — unchanged (already works)

---

## 2. API URL Configuration

**Problem:** `NEXT_PUBLIC_API_BASE_URL` is empty, causing `apiRequest()` to throw `GlamoApiError` with `API_BASE_URL_MISSING`.

**Fix:**
- Create `.env` with:
  ```
  NEXT_PUBLIC_API_BASE_URL=https://omvrdlnxqifuxthgkluq.supabase.co
  NEXT_PUBLIC_SITE_URL=https://glamonepal.com
  ADMIN_SESSION_SECRET=<generate 32+ char random string>
  AUTH_SECRET=<generate 32+ char random string>
  ```
- In `src/lib/api/client.ts`, improve error handling:
  - When `API_BASE_URL` is missing, still throw but with a clearer message
  - When API returns unexpected response, include the HTTP status code in the error
  - Add a `retry` option for transient failures

**Files changed:**
- `.env` — created with backend URL
- `src/lib/api/client.ts` — improved error handling

---

## 3. Contact Form Fix

**Problem:** `src/app/contact/page.tsx` has a `type="button"` submit that does nothing. `ContactClient.tsx` simulates submission with `setTimeout`.

**Fix:**
- Rewrite `src/app/contact/page.tsx` to be a server component that renders `ContactClient.tsx` (the client component with real functionality)
- Remove the dead form from `page.tsx`
- In `ContactClient.tsx`:
  - Integrate react-hook-form + zod resolver with the contact validation schema
  - Replace `setTimeout` fake submission with a real API call (POST to `/api/contact` or Supabase directly)
  - Add an API route `src/app/api/contact/route.ts` that forwards to Supabase
  - Add proper success/error feedback: toast on success, inline field errors on validation failure, loading state during submission
  - Reset form on success

**Validation schema** (`src/lib/validations/contact.ts`):
```typescript
z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number").or(z.literal("")),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})
```

**Files changed:**
- `src/app/contact/page.tsx` — simplified to render ContactClient
- `src/app/contact/ContactClient.tsx` — rewritten with react-hook-form + zod
- `src/lib/validations/contact.ts` — new Zod schema
- `src/app/api/contact/route.ts` — new API route

---

## 4. Shared Validation Infrastructure

**Create Zod schemas:**

`src/lib/validations/contact.ts` — contact form schema (as above)

`src/lib/validations/checkout.ts` — checkout form schema:
```typescript
z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  phone: z.string().regex(/^(\+977\s?)?9[78]\d{8}$/, "Enter a valid Nepal mobile number"),
  province: z.string().min(1),
  district: z.string().min(1),
  city: z.string().min(1, "City is required"),
  ward: z.string().min(1, "Ward is required"),
  address: z.string().min(5, "Address is required"),
  giftWrap: z.boolean().optional(),
  notes: z.string().optional(),
  payment: z.enum(["Cash on Delivery", "Khalti", "eSewa", "Cards"]),
})
```

`src/lib/validations/auth.ts` — auth schemas for login, register, forgot-password, reset-password forms

**Integrate into existing forms:**
- `CheckoutPageClient.tsx` — replace manual `useState` + `canSubmit` with react-hook-form + zod resolver
- Auth forms — add validation where missing

**Files changed:**
- `src/lib/validations/contact.ts` — new
- `src/lib/validations/checkout.ts` — new
- `src/lib/validations/auth.ts` — new
- `src/components/checkout/CheckoutPageClient.tsx` — refactor to use react-hook-form
- Auth form components — add validation

---

## 5. Form Feedback & ARIA

**Form feedback:**
- All forms: show inline field errors below each input (using react-hook-form's `errors` object)
- All forms: show loading state on submit (button disabled, text changes to "Sending..." / "Placing order...")
- All forms: show success toast on completion, error toast on failure
- Checkout: maintain existing `canSubmit` logic but derive from form validation state

**ARIA accessibility:**
- Add `aria-label` to all icon-only buttons throughout the app:
  - Cart icon button → `aria-label="Shopping cart"`
  - Wishlist icon → `aria-label="Add to wishlist"`
  - Search icon → `aria-label="Search"`
  - Menu toggle → `aria-label="Open menu"` / `aria-label="Close menu"`
  - Close buttons → `aria-label="Close"`
- Add `aria-invalid="true"` and `aria-describedby` linking to error messages on form fields with errors
- Add `role="alert"` on error message containers for screen reader announcement

**Files changed:**
- `src/app/contact/ContactClient.tsx` — ARIA on form fields
- `src/components/checkout/CheckoutPageClient.tsx` — ARIA on form fields
- Various component files with icon buttons — add `aria-label`

---

## 6. Loading States

**Add-to-cart:**
- Find all "Add to cart" buttons
- Add a loading state: disable button, show spinner or "Adding..." text
- Re-enable after cart store update completes

**Page transitions:**
- Add `loading.tsx` files for key routes:
  - `src/app/shop/loading.tsx` — product grid skeleton
  - `src/app/product/[slug]/loading.tsx` — product detail skeleton
  - `src/app/checkout/loading.tsx` — checkout skeleton
  - `src/app/blog/loading.tsx` — blog skeleton

**Files changed:**
- Product card/button components — add loading state
- New `loading.tsx` files for key routes

---

## Out of Scope

These items from the original analysis are NOT included:
- Homepage redirect bug — does not exist in current code
- Email verification — not a P0/P1 concern for MVP
- Product comparison — feature request, not a bug fix
- Cart persistence across browser sessions — localStorage already used by Zustand persist
- Quantity limits — backend concern
- Admin dashboard testing — requires running app, not a code fix

## Implementation Order

1. `.env` creation + API client fix (unblocks checkout)
2. Blog listing page (fixes routing conflict)
3. Zod validation schemas (infrastructure)
4. Contact form rewrite with react-hook-form + zod + real submission
5. Checkout form refactor with react-hook-form + zod
6. Auth form validation
7. ARIA labels on icon buttons
8. Loading states (add-to-cart + page skeletons)
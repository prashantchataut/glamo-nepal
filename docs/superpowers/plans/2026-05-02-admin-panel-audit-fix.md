# Admin Panel UI/UX Audit & Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the monolithic 594-line AdminDashboard into focused components, enforce design tokens, fix accessibility, security, touch targets, and polish interactions.

**Architecture:** Split AdminDashboard.tsx into 7 smaller components (AdminSidebar, AdminHeader, AdminStatsGrid, AdminOrdersTable, AdminProductsTable, AdminInventorySection, AdminBannerManager). Fix AdminLoginForm separately. Add auth guard. All use brand/admin design tokens exclusively.

**Tech Stack:** Next.js 14, Tailwind CSS 3, shadcn/ui, Zustand, Lucide icons

---

## Task 1: Add Admin Design Tokens

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add admin color tokens and z-index tokens**

In `tailwind.config.ts`, inside `theme.extend.colors`, add an `admin` object:

```ts
admin: {
  success: '#4CAF82',
  'success-light': '#E8F5E9',
  warning: '#F59E0B',
  'warning-light': '#FFF8E1',
  error: '#E05252',
  'error-light': '#FFEBEE',
  info: '#0EA5E9',
  'info-light': '#E0F2FE',
  neutral: '#71717A',
  'neutral-light': '#F4F4F5',
},
```

Inside `theme.extend.zIndex`, add:

```ts
'admin-overlay': '45',
'admin-header': '30',
```

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add admin color tokens and z-index scale"
```

---

## Task 2: Security Fixes

**Files:**
- Modify: `src/lib/admin-auth.ts`
- Modify: `src/components/admin/AdminLoginForm.tsx`
- Create: `src/components/admin/AdminAuthGuard.tsx`
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Remove default credential fallback in admin-auth.ts**

In `src/lib/admin-auth.ts`, change the `getSecret()` function from:

```ts
function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET || "local-dev-change-me";
}
```

to:

```ts
function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET or AUTH_SECRET environment variable is required. Set it in .env.local before running the admin panel.");
  }
  return secret;
}
```

And change the `getAdminCredentials()` function from:

```ts
export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "admin@glamonepal.com",
    password: process.env.ADMIN_PASSWORD || "ChangeMe@123",
    name: process.env.ADMIN_NAME || "GLAMO Admin",
  };
}
```

to:

```ts
export function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required. Set them in .env.local before running the admin panel.");
  }
  return {
    email,
    password,
    name: process.env.ADMIN_NAME || "GLAMO Admin",
  };
}
```

- [ ] **Step 2: Remove pre-filled email from AdminLoginForm.tsx**

In `AdminLoginForm.tsx`, change line 11 from:

```ts
const [email, setEmail] = useState("admin@glamonepal.com");
```

to:

```ts
const [email, setEmail] = useState("");
```

And add a placeholder to the email input. Find the `<input type="email"` and add `placeholder="admin@glamonepal.com"` attribute.

- [ ] **Step 3: Add SVG sanitization to AdminBannerManager (will be created in Task 4)**

This will be handled in the BannerManager component creation — when processing SVG uploads, strip `<script>` tags and `on*` event attributes.

- [ ] **Step 4: Create AdminAuthGuard component**

Create `src/components/admin/AdminAuthGuard.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/admin/login", { method: "GET" });
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          router.replace("/admin/login");
        }
      } catch {
        router.replace("/admin/login");
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bgLight">
        <div className="skeleton-shimmer h-8 w-48 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

- [ ] **Step 5: Update admin layout to use AuthGuard**

In `src/app/admin/layout.tsx`, change to:

```tsx
import type { ReactNode } from "react";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin-auth.ts src/components/admin/AdminLoginForm.tsx src/components/admin/AdminAuthGuard.tsx src/app/admin/layout.tsx
git commit -m "fix: remove default credential fallback, add auth guard, remove pre-filled email"
```

---

## Task 3: Fix AdminLoginForm Design Tokens & Polish

**Files:**
- Modify: `src/components/admin/AdminLoginForm.tsx`

- [ ] **Step 1: Replace hardcoded colors with tokens**

In `AdminLoginForm.tsx`, make these replacements:
- `bg-[#f8eef5]` → `bg-brand-primary-light`
- `shadow-[0_35px_120px_-55px_rgba(26,10,30,0.85)]` → `shadow-editorial`
- `shadow-[0_25px_80px_-45px_rgba(139,58,143,0.6)]` → `shadow-soft`
- `rgba(212,160,215,0.35)` → use `bg-brand-secondary/35` (in the gradient div)
- `rgba(201,168,76,0.24)` → use `bg-brand-gold/24` (in the gradient div)
- `text-white/72` → `text-white/70`
- `text-white/58` → `text-white/60`
- `border-red-100 bg-red-50 text-red-700` → `border-admin-error/20 bg-admin-error-light text-admin-error`
- `leading-[0.95]` → `leading-tight`

- [ ] **Step 2: Fix spacing to 8pt grid**

- `py-3` → `py-4` (on form inputs and submit button)
- `space-y-5` → `space-y-6` (form spacing)
- `mt-1.5` → `mt-2` (text spacing)

- [ ] **Step 3: Fix touch targets**

- Password toggle button: add `h-11 w-11` and `flex items-center justify-center rounded-full`
- Submit button: already `py-3` → change to `min-h-[44px]`

- [ ] **Step 4: Fix gradient overlays**

Replace the two `radial-gradient` inline styles with Tailwind-compatible classes. Change the gradient overlay div from:

```tsx
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,160,215,0.35),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(201,168,76,0.24),transparent_28%)]" />
```

to:

```tsx
<div className="absolute inset-0">
  <div className="absolute right-0 top-0 h-1/2 w-1/2 rounded-full bg-brand-secondary/35 blur-3xl" />
  <div className="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-full bg-brand-gold/24 blur-3xl" />
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminLoginForm.tsx
git commit -m "fix: replace hardcoded colors with tokens, fix spacing and touch targets in admin login"
```

---

## Task 4: Decompose AdminDashboard — Create Component Files

**Files:**
- Create: `src/components/admin/AdminSidebar.tsx`
- Create: `src/components/admin/AdminHeader.tsx`
- Create: `src/components/admin/AdminStatsGrid.tsx`
- Create: `src/components/admin/AdminOrdersTable.tsx`
- Create: `src/components/admin/AdminProductsTable.tsx`
- Create: `src/components/admin/AdminInventorySection.tsx`
- Create: `src/components/admin/AdminBannerManager.tsx`
- Modify: `src/components/admin/AdminDashboard.tsx` (rewrite as shell)

This is the largest task. Each new component extracts a section from the monolith and applies all fixes (tokens, spacing, ARIA, touch targets, border-radius) during extraction.

- [ ] **Step 1: Create AdminSidebar.tsx**

Extract the `<aside>` section (lines 283-328) and the overlay backdrop (line 330). Apply these fixes:
- Wrap in `<aside role="navigation" aria-label="Admin navigation">`
- Nav buttons: add `role="tab"` and `aria-selected={activeSection === section.id}`
- Nav wrapper: add `role="tablist"`
- Close button: change `p-2` → `h-11 w-11`
- Logout button: change `text-red-600 hover:bg-red-50` → `text-admin-error hover:bg-admin-error-light`
- Spacing: `px-5 py-5` → `px-6 py-6`, `px-3 py-4` → `px-4 py-4`, `space-y-0.5` → `space-y-1`, `px-3 py-2.5` → `px-4 py-3`, `gap-3` → `gap-4`
- Z-index: `z-50` → `z-navbar`, `z-40` → `z-admin-overlay`
- Border radius: already uses `rounded-xl` and `rounded-2xl` (consistent)

- [ ] **Step 2: Create AdminHeader.tsx**

Extract the `<header>` section (lines 333-366). Apply these fixes:
- Wrap in `<header role="banner">`
- Add `aria-label="Search orders and products"` to search input
- Change `bg-white/92` → `bg-white/95`
- Z-index: `z-30` → `z-admin-header`
- Status pill: `bg-emerald-50 text-emerald-700 ring-emerald-100` → `bg-admin-success-light text-admin-success ring-admin-success/20`
- Status dot: `bg-emerald-500` → `bg-admin-success`
- Menu button: `p-2.5` → `h-11 w-11`
- Bell button: `p-2.5` → `h-11 w-11`
- Search input: `py-2.5` → `py-3`
- Spacing: `px-3.5` → `px-4`, `py-1.5` → `py-2`

- [ ] **Step 3: Create AdminStatsGrid.tsx**

Extract the `StatCard` component (lines 117-131) and the stats section. Apply:
- `p-5` → `p-6`
- `p-2.5` → `p-3`
- `px-2.5 py-1` → `px-3 py-1`
- `text-[10px]` → `text-xs` with `tracking-wider`
- `text-[11px]` → `text-xs`
- `mt-1.5` → `mt-2`
- Add `card-hover shadow-sm` to card div

- [ ] **Step 4: Create AdminOrdersTable.tsx**

Extract the orders section. Apply:
- Replace all `orderStatusStyles` with admin tokens:
  - `bg-amber-50 text-amber-700 ring-amber-100` → `bg-admin-warning-light text-admin-warning ring-admin-warning/20`
  - `bg-sky-50 text-sky-700 ring-sky-100` → `bg-admin-info-light text-admin-info ring-admin-info/20`
  - `bg-violet-50 text-violet-700 ring-violet-100` → keep violet (not semantic)
  - `bg-blue-50 text-blue-700 ring-blue-100` → `bg-admin-info-light text-admin-info ring-admin-info/20`
  - `bg-emerald-50 text-emerald-700 ring-emerald-100` → `bg-admin-success-light text-admin-success ring-admin-success/20`
  - `bg-red-50 text-red-700 ring-red-100` → `bg-admin-error-light text-admin-error ring-admin-error/20`
- Add `<caption className="sr-only">Recent orders</caption>` to table
- Add `scope="col"` to all `<th>` elements
- Disable "Today", "This week", "Create manual order" buttons with `disabled title="Coming soon"`
- Spacing: `px-3 py-2.5` → `px-4 py-3`, `px-3 py-3` → `px-4 py-4`, `py-2.5` → `py-3`
- `select` element: add `aria-label="Order status"`

- [ ] **Step 5: Create AdminProductsTable.tsx**

Extract the products section. Apply:
- Disable "Filter" and "Add product" buttons with `disabled title="Coming soon"`
- View/Edit/Delete buttons: change `p-1.5` → `h-11 w-11` with `flex items-center justify-center`
- Product status pills: replace `emerald/amber/red` with admin tokens
- Add `<caption className="sr-only">Product catalog</caption>` to table
- Add `scope="col"` to all `<th>` elements
- Search input: add `aria-label="Search products by SKU, brand or name"`
- Spacing: `p-5` → `p-6`, `px-3.5 py-2` → `px-4 py-2`

- [ ] **Step 6: Create AdminInventorySection.tsx**

Extract the inventory section. Apply:
- `riskStyles`: replace `emerald/amber/red/zinc` with admin tokens:
  - `healthy`: `bg-admin-success-light text-admin-success ring-admin-success/20`
  - `watch`: `bg-admin-warning-light text-admin-warning ring-admin-warning/20`
  - `low`: `bg-admin-error-light text-admin-error ring-admin-error/20`
  - `out`: `bg-admin-neutral-light text-admin-neutral ring-admin-neutral/20`
- Disable "Restock" button with `disabled title="Coming soon"`
- CheckCircle2 icon: `text-emerald-600` → `text-admin-success`
- AlertTriangle icon: `text-amber-600` → `text-admin-warning`
- Spacing: `p-5` → `p-6`, `p-3` → `p-4`, `gap-5` → `gap-6`

- [ ] **Step 7: Create AdminBannerManager.tsx**

Extract the banners section and `BannerPreview` component. Apply:
- Add SVG sanitization in `handleBannerUpload`:
```ts
function sanitizeSvg(svgString: string): string {
  return svgString
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}
```
  Use this before storing SVG data URLs.
- Replace `bg-red-50 text-red-700` → `bg-admin-error-light text-admin-error`
- Replace `bg-emerald-50 text-emerald-700` → `bg-admin-success-light text-admin-success`
- Add `aria-live="polite"` region around error/success messages
- Form labels: add `htmlFor` + `id` attributes
- Banner selector buttons: `p-3` → `p-4`
- Form inputs: `py-2.5` → `py-3`
- Spacing: `space-y-1.5` → `space-y-2`, `p-3` → `p-4`, `space-y-5` → `space-y-6`, `gap-5` → `gap-6`
- `text-white/72` → `text-white/70`
- `text-white/75` → `text-white/75` (keep, close enough)

- [ ] **Step 8: Rewrite AdminDashboard.tsx as shell**

The new `AdminDashboard.tsx` should be a thin shell that:
- Imports all 7 sub-components
- Manages `activeSection`, `isSidebarOpen`, `productQuery`, `orderStatusById`, `banners`, `selectedBannerId`, `bannerMessage`, `uploadError`, `isLoggingOut` state
- Passes required props to each sub-component
- Uses proper semantic structure: `<aside>` + `<header>` + `<main>`
- The `StatusPill`, `MiniBar`, and `StatCard` components stay in AdminDashboard or move to a shared file

- [ ] **Step 9: Commit**

```bash
git add src/components/admin/
git commit -m "feat: decompose AdminDashboard into 7 focused components with design token and accessibility fixes"
```

---

## Task 5: Touch Target & ARIA Pass Across All Admin Components

**Files:**
- All files in `src/components/admin/`

- [ ] **Step 1: Verify all icon-only buttons are ≥ 44px**

Search all admin components for buttons with `p-2`, `p-1.5`, `p-2.5` and ensure they have `h-11 w-11` or `min-h-[44px] min-w-[44px]`.

- [ ] **Step 2: Verify all table action buttons are ≥ 44px**

Ensure View, Edit, Delete, MoreHorizontal buttons have `h-11 w-11`.

- [ ] **Step 3: Add `aria-live="polite"` to all status message regions**

In AdminBannerManager, wrap error/success messages in `<div aria-live="polite">`.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/
git commit -m "fix: ensure all admin interactive elements meet 44px touch targets and ARIA standards"
```

---

## Task 6: Micro-interactions & Disabled Button Styling

**Files:**
- All files in `src/components/admin/`

- [ ] **Step 1: Add btn-press to all admin buttons**

Add `btn-press` class to all `<button>` elements across admin components that don't have `disabled`.

- [ ] **Step 2: Style disabled buttons**

Add `disabled:opacity-50 disabled:cursor-not-allowed` to buttons marked as `disabled`.

- [ ] **Step 3: Add card-hover to stat cards**

Add `card-hover` class to `StatCard` component div.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/
git commit -m "feat: add micro-interactions and disabled button styling to admin components"
```

---

## Task 7: Final Verification

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

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve any typecheck/lint/build issues from admin panel audit"
```
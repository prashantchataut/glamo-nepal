# GLAMO Nepal Admin Panel UI/UX Audit & Fix — Design Spec

**Date:** 2026-05-02  
**Scope:** Full admin panel audit — design tokens, accessibility, security, decomposition, and polish

---

## A) Component Decomposition

### A1. Split AdminDashboard.tsx into Components

The current 594-line monolith will be decomposed into:

| Component | File | Responsibility |
|-----------|------|----------------|
| `AdminDashboard` | `admin/AdminDashboard.tsx` | Shell: state management, section switching, layout |
| `AdminSidebar` | `admin/AdminSidebar.tsx` | Navigation sidebar with section switching |
| `AdminHeader` | `admin/AdminHeader.tsx` | Top header bar with search, notifications, avatar |
| `AdminStatsGrid` | `admin/AdminStatsGrid.tsx` | Revenue, orders, inventory stats cards |
| `AdminOrdersTable` | `admin/AdminOrdersTable.tsx` | Recent orders table with status filtering |
| `AdminProductsTable` | `admin/AdminProductsTable.tsx` | Product listing with status, stock, actions |
| `AdminInventorySection` | `admin/AdminInventorySection.tsx` | Low-stock alerts and inventory items |
| `AdminBannerManager` | `admin/AdminBannerManager.tsx` | Hero banner editing and upload |

Each component will:
- Use proper semantic HTML landmarks (`<nav>`, `<aside>`, `<header>`, `<section>`, `<main>`)
- Include ARIA attributes (`aria-label`, `aria-selected`, `role`)
- Use design tokens exclusively
- Meet 44px touch targets
- Follow 8pt grid spacing

### A2. AdminLoginForm.tsx

Keep as a single component but fix:
- Replace hardcoded colors with tokens
- Fix spacing to 8pt grid
- Fix touch targets
- Add proper ARIA

---

## B) Design Token Enforcement

### B1. Add Admin Status Colors to Tailwind Config

Add to `tailwind.config.ts` under `colors`:

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
}
```

This replaces: `emerald-*` → `admin-success`, `amber-*` → `admin-warning`, `red-*` → `admin-error` (for non-brand contexts), `sky-*` → `admin-info`, `zinc-*` → `admin-neutral`.

### B2. Replace All Hardcoded Colors

| Current | Replacement | Files |
|---------|-------------|-------|
| `bg-emerald-50`, `text-emerald-700`, `ring-emerald-100` | `bg-admin-success-light`, `text-admin-success`, `ring-admin-success/20` | AdminDashboard, AdminLoginForm |
| `bg-amber-50`, `text-amber-700`, `ring-amber-100` | `bg-admin-warning-light`, `text-admin-warning`, `ring-admin-warning/20` | AdminDashboard |
| `bg-red-50`, `text-red-700`, `ring-red-100`, `text-red-600` | `bg-admin-error-light`, `text-admin-error`, `ring-admin-error/20` | AdminDashboard |
| `bg-sky-50`, `text-sky-700`, `ring-sky-100` | `bg-admin-info-light`, `text-admin-info`, `ring-admin-info/20` | AdminDashboard |
| `bg-violet-50`, `text-violet-700`, `ring-violet-100` | Keep as `violet` — this is for order status variety, not semantic | AdminDashboard |
| `bg-blue-50`, `text-blue-700`, `ring-blue-100` | `bg-admin-info-light`, `text-admin-info`, `ring-admin-info/20` | AdminDashboard |
| `bg-zinc-100`, `text-zinc-600`, `ring-zinc-200` | `bg-admin-neutral-light`, `text-admin-neutral`, `ring-admin-neutral/20` | AdminDashboard |
| `bg-[#f8eef5]` | `bg-brand-primary-light` | AdminLoginForm |
| `shadow-[0_35px_120px_-55px_rgba(26,10,30,0.85)]` | `shadow-editorial` | AdminLoginForm |
| `shadow-[0_25px_80px_-45px_rgba(139,58,143,0.6)]` | `shadow-soft` (with opacity adjustment) | AdminLoginForm |
| `border-red-100`, `bg-red-50`, `text-red-700` | `border-admin-error/20`, `bg-admin-error-light`, `text-admin-error` | AdminLoginForm |
| `bg-white/92` | `bg-white/95 soft-overlay-xl` | AdminDashboard |

### B3. Spacing — 8pt Grid

All `py-3`, `px-2.5`, `p-5`, `p-2.5`, `space-y-5`, `text-[11px]` etc. will be rounded to nearest 8pt value:
- `py-3` → `py-4` or `py-2`
- `px-2.5` → `px-3` or `px-2`
- `p-5` → `p-6` or `p-4`
- `p-2.5` → `p-3` or `p-2`
- `space-y-5` → `space-y-6` or `space-y-4`
- `text-[11px]` → `text-xs`
- `py-2.5` → `py-3` or `py-2`
- `px-3.5` → `px-4`
- `p-3.5` → `p-4`

### B4. Border Radius Consistency

Standardize:
- Cards: `rounded-2xl` (1rem)
- Inner elements (inputs, small cards, nav items): `rounded-xl` (0.75rem)
- Buttons/CTAs: `rounded-full`
- Status pills: `rounded-full`

This matches the storefront's brand pattern.

---

## C) Z-Index & Layout Safety

### C1. Fix Z-Index

| Current | Named Token | File |
|---------|-------------|------|
| `z-50` | `z-navbar` | AdminDashboard sidebar |
| `z-40` | `z-announcement` (semantically wrong) — add `z-admin-overlay: 45` | AdminDashboard overlay |
| `z-30` | Not in scale — add `z-admin-header: 30` | AdminDashboard header |

Add to `tailwind.config.ts` zIndex:
```ts
'admin-overlay': '45',
'admin-header': '30',
```

### C2. Mobile Bottom Nav Overlap

The admin panel doesn't show `MobileBottomNav` (it's excluded in `AppShell.tsx` for admin routes). No overlap issue.

---

## D) Accessibility Fixes

### D1. Landmark Roles

- Wrap sidebar in `<aside role="navigation" aria-label="Admin navigation">`
- Wrap header in `<header role="banner">`
- Wrap main content in `<main id="admin-content" aria-label="Admin dashboard">`
- Add `<nav aria-label="Section navigation">` around section switching buttons

### D2. ARIA on Section Navigation

- Add `role="tablist"` on section nav button group
- Add `role="tab"` and `aria-selected={isActive}` on each section button
- Add `role="tabpanel"` on each content section

### D3. Table Accessibility

- Add `<caption className="sr-only">` to all tables
- Add `scope="col"` on `<th>` headers
- Add `scope="row"` on row header cells

### D4. Form Accessibility

- Add `aria-label="Search orders and products"` on search input
- Add `aria-live="polite"` region for error/success messages
- Add explicit `<label htmlFor>` or `aria-label` on all form inputs

### D5. Touch Targets

All interactive elements ≥ 44px:
- Icon-only buttons: `h-11 w-11`
- Nav buttons: `min-h-[44px]`
- Table action buttons: `h-11 w-11`
- "View all" links: `min-h-[44px]` with `py-2`

---

## E) Interaction Polish

### E1. Micro-interactions

- Add `btn-press` class to all buttons
- Add `card-hover` class to stat cards
- Add `transition-colors duration-200` to all interactive elements

### E2. Non-Functional Buttons

Add `disabled` and `title="Coming soon"` to all buttons without handlers:
- Filter button
- Add product button
- View, Edit, Delete product action buttons
- Restock button
- Create manual order button
- Search input (disable or add placeholder-only behavior)

Style: `disabled:opacity-50 disabled:cursor-not-allowed`

### E3. Reduced Motion

Already supported via globals.css `prefers-reduced-motion` rule.

---

## F) Security Fixes

### F1. Layout-Level Auth Guard

In `src/app/admin/layout.tsx`, add a server-side redirect:
```tsx
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/admin-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Client component handles the auth check
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
```

Create `src/components/admin/AdminAuthGuard.tsx` that checks auth state and redirects to `/admin/login` if not authenticated.

### F2. SVG Upload Sanitization

In `AdminBannerManager.tsx`, when processing uploaded SVGs:
- Strip `<script>` tags
- Remove `on*` event attributes (onclick, onload, etc.)
- Remove `javascript:` URLs in href/xlink:href attributes
- Or better: convert SVG uploads to rasterized PNG before storing

### F3. Remove Default Credentials Fallback

In `src/lib/admin-auth.ts`:
- Remove the default email/password fallback values
- Replace with `throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD env vars required")` when env vars are missing
- Add a startup warning in `ADMIN_PANEL_GUIDE.md`

### F4. Remove Pre-filled Email

In `AdminLoginForm.tsx`:
- Remove `defaultValue="admin@glamonepal.com"` from the email input
- Add `placeholder="admin@glamonepal.com"` instead (shows format without revealing email)

---

## G) AdminLoginForm Specific Fixes

| Issue | Fix |
|-------|-----|
| `bg-[#f8eef5]` | → `bg-brand-primary-light` |
| `shadow-[0_35px_120px...]` | → `shadow-editorial` |
| `shadow-[0_25px_80px...]` | → `shadow-soft` |
| `rgba(212,160,215,0.35)` gradient | → `bg-brand-secondary/35` |
| `rgba(201,168,76,0.24)` gradient | → `bg-brand-gold/24` |
| `border-red-100`, `bg-red-50`, `text-red-700` | → `border-admin-error/20`, `bg-admin-error-light`, `text-admin-error` |
| `py-3` (multiple) | → `py-4` or `py-2` |
| Password toggle touch target | → `h-11 w-11` |
| `text-white/72` | → `text-white/70` (standard opacity) |
| `text-white/58` | → `text-white/60` (standard opacity) |
| `leading-[0.95]` | → `leading-tight` |
| Pre-filled email | → Remove `defaultValue`, add `placeholder` |

---

## H) Deliverables

1. **UI/UX Fix Report** listing all issues, causes, fixes, files changed
2. **Consistency Checklist** showing what was verified
3. **Remaining Risks** list

---

## Implementation Order

1. **Add admin color tokens** to tailwind.config.ts
2. **Add admin z-index tokens** to tailwind.config.ts
3. **Security fixes** — auth guard, SVG sanitization, remove default creds
4. **Decompose AdminDashboard** into 7 smaller components
5. **Fix AdminLoginForm** — tokens, spacing, touch targets, ARIA
6. **Apply design tokens** to all admin components (colors, spacing, radius)
7. **Add accessibility** — landmarks, ARIA, table captions, form labels
8. **Fix touch targets** — all interactive elements ≥ 44px
9. **Disable non-functional buttons** — disabled + "Coming soon" tooltip
10. **Add micro-interactions** — btn-press, card-hover, transitions
11. **Final verification** — typecheck, lint, build
# Glamo Nepal — AI Assistant Prompt

You are helping rebuild the admin panel for **Glamo Nepal**, a beauty ecommerce store. The zip file contains the full codebase excluding node_modules and large binaries (~3 MB).

---

## Project Context

| Aspect | Details |
|--------|---------|
| **Stack** | Next.js 16 (App Router), Hono v4 backend (Cloudflare Workers), Turso/libSQL (SQLite), Firebase Auth + HMAC cookie sessions |
| **State** | Zustand stores |
| **Styling** | Tailwind CSS |
| **Validation** | Zod (backend schemas) |
| **Admin panel** | Currently broken SPA-style — all sections rendered in a single `AdminDashboard.tsx` component |
| **Current route** | `/admin` → renders everything via client-side `activeSection` state swapping |

---

## The Problem: Admin Structure

The admin panel currently works as a **single-page SPA** inside `src/components/admin/AdminDashboard.tsx`. Clicking sidebar items just swaps components via `activeSection` state — no proper URLs, no deep linking, everything in one bloated file.

**You need to restructure this** into proper URL-based routing:

```
CURRENT (bad):
  /admin  →  AdminDashboard.tsx (all sections inside, swapped via state)

TARGET (good):
  /admin              → admin layout (sidebar + header) + dashboard page
  /admin/products     → products module page
  /admin/orders       → orders module page
  /admin/customers    → customers module page
  /admin/inventory    → inventory module page
  /admin/promotions   → promotions module page
  /admin/returns      → returns module page
  /admin/reviews      → reviews module page
  /admin/analytics    → analytics page
  /admin/settings     → settings page
  /admin/audit        → audit log page
  /admin/content      → content management page
  /admin/compliance   → compliance & security page
```

Use `src/app/admin/layout.tsx` for the shared layout (sidebar + header + session verification), and individual pages for each module.

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `backend/src/utils/admin-panel.txt` | **Authoritative spec** (910 lines) — the complete admin panel requirements for a beauty business owner |
| `.opencode/plans/glamo-rebuild-plan.md` | Master rebuild plan with all 6 phases |
| `docs/phase4-admin-rebuild.md` | Phase 4 standalone — admin rebuild implementation guide |
| `src/components/admin/AdminDashboard.tsx` | **The problem file** — single-file orchestrator that needs to be broken into proper pages |
| `src/components/admin/AdminSidebar.tsx` | Sidebar component (will need URL path updates) |
| `src/components/admin/shared/` | Shared components: DataTable, StatusPill, SearchInput, Pagination, EmptyState, ConfirmDialog |
| `src/lib/api/admin.ts` | All admin API client functions |
| `backend/src/modules/` | Backend modules organized by domain |

---

## Skills (Use These!)

The zip includes skill definition files in `.agents/skills/` and `.opencode/skills/`. **Read and follow these skills** as they apply to your work:

1. **`.agents/skills/storefront-best-practices/SKILL.md`** — Ecommerce storefront patterns for cart, checkout, products
2. **`.agents/skills/frontend-design/SKILL.md`** — Distinctive, non-generic frontend design principles
3. **`.agents/skills/design-expert/SKILL.md`** — UI/UX design system selection and responsive layout
4. **`.agents/skills/web-design-reviewer/SKILL.md`** — Visual inspection and fix workflow
5. **`.opencode/skills/ui-ux-pro-max/SKILL.md`** — UI/UX design intelligence with 67 styles, 96 color palettes, 57 font pairings

Also apply these universal principles:
- **Karpathy guidelines**: Think before coding, simplicity first, surgical changes
- **Anti-slop**: Detect and eliminate generic AI design/code patterns — no "delve into", no purple gradients on white, no cookie-cutter layouts
- **Design anti-slop**: No generic "AI startup" look — the admin panel should look professional and distinctive

---

## What to Build

Follow `backend/src/utils/admin-panel.txt` as the single source of truth. The key requirements:

### P0 (must-work for daily operations):
1. **Dashboard** — Business action dashboard with "Today" section, sales snapshot, product alerts, risks. Every card has an action button. Plain language (not "fulfillment_queue: 5" but "5 orders need shipping")
2. **Products** — Beauty-specific fields (skin type, concern, shade, undertone, finish, coverage, ingredients/INCI, claims). Category templates (Makeup→shade, Skincare→ingredients). Draft/publish workflow
3. **Orders** — Status-driven, saved views (Unfulfilled, Paid & Ready, High-risk), timeline visualization, fraud flags, communication log
4. **Customers** — Profile with order history, returns, loyalty, CLV, preferences
5. **Promotions** — Discount codes, auto-discounts, gift-with-purchase, bundles, campaign calendar
6. **Returns** — New module with hygiene workflow, quarantine default for returned beauty products
7. **Reviews** — Skin-type/shade tagging, pattern detection, Q&A moderation
8. **Settings** — Working save (verify payload format: `{ settings: [{ key, value }] }`)
9. **Audit Log** — Filterable, exportable, human-readable

### UX Rules (non-negotiable):
- **No technical labels** — no "variant object", "PIM validation state", "fulfillment_queue"
- **Smart search** — across products, orders, customers, SKUs, shades, ingredients
- **Saved views** per module (pre-built filters)
- **Tooltips + examples** on every complex field
- **Bulk actions** with safety confirmations
- **Plain-language validation** — "Shade 'Warm Beige 240' is missing a swatch image"
- **WCAG 2.2** — clear labels, keyboard nav, focus states, contrast, mobile-responsive

---

## Verification

After each module:
- `npx tsc --noEmit` — no type errors
- `npm run build` — builds successfully
- Test CRUD operations end-to-end
- Admin panel usable on mobile
- Non-technical owner can complete each workflow without confusion

---

**Start by reading the layout structure, then progressively rebuild each admin module with proper URL routing and beauty-specific functionality.**

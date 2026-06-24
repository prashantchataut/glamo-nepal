# Phase 4: Admin Panel Rebuild — Glamo Nepal

## Goal
Rebuild the admin panel into a daily operations dashboard for a non-technical beauty business owner.

## Source of Truth
The authoritative spec is `backend/src/utils/admin-panel.txt` — read it before starting.

## Architecture Rules
- Admin components in `src/components/admin/<domain>/` with existing shared components (`DataTable`, `StatusPill`, `SearchInput`, `Pagination`, `EmptyState`, `ConfirmDialog`)
- Zustand stores, `useAdminData` for fetching, `useAdminMutation` for mutations
- API calls through `src/lib/api/admin.ts`
- Backend follows existing Hono pattern: controller → service → schema
- All backend work in `backend/src/`

## P0 Modules (daily operations)

### Dashboard (`src/components/admin/dashboard/DashboardView.tsx`)
Replace generic stats with 4-section business action dashboard:
1. **Today** — orders to ship, returns to approve, refunds pending, low-stock alerts, complaints. Plain language: "5 orders need shipping." Every card has an action button.
2. **Sales snapshot** — today/yesterday/week/month revenue, orders, AOV with sparklines (recharts already installed)
3. **Product alerts** — best sellers, out-of-stock, missing images/ingredients, expiring stock
4. **Risks** — high-risk orders, poor reviews, campaigns ending soon

### Products (`src/components/admin/products/ProductForm.tsx`)
- Add beauty fields: skin type, skin concern, hair type, shade, undertone, finish, coverage, fragrance family, ingredients/INCI, allergens, claims, usage instructions, benefits, warnings, product type
- Category-specific templates: Makeup → shade/undertone/coverage/finish, Skincare → skin type/concern/ingredients, Fragrance → notes/family/concentration, Haircare → hair type/ingredients
- Product completeness score (progress bar of required fields)
- Draft/publish/archive/hidden workflow
- Store beauty attributes in `beauty_attributes TEXT` JSON column for flexibility

### Orders (`src/components/admin/orders/OrdersView.tsx`)
- Saved views: Unfulfilled, Paid & Ready, High-risk, Delayed, Return requested, Refund pending, VIP orders
- Order timeline in detail modal (vertical timeline with dates, status changes, staff notes)
- Fraud/risk flags (multiple orders same address, high-value first order, address issues)
- Communication log (internal notes + customer history)

### Customers (`src/components/admin/customers/CustomersView.tsx`)
- List filters: role, status, date range, order count
- Detail: order history, refund/return history, loyalty status, product preferences, marketing consent, support notes
- CLV display, VIP tagging, last purchase date

### Promotions (`src/components/admin/coupons/`)
- Auto-discounts, gift-with-purchase, buy X get Y, free shipping thresholds
- Customer segment targeting, usage stats
- Campaign calendar, banner scheduling
- Bundle builder: select products, set price, auto-calculate margin, show stock

### Returns (new module)
- Create `src/components/admin/returns/ReturnsView.tsx` + `ReturnDetailModal.tsx`
- Create `backend/src/modules/returns/` (controller, service, schema, routes)
- DB table: id, order_id, user_id, status (PENDING/APPROVED/REJECTED/AWAITING_ITEM/ITEM_RECEIVED/REFUNDED/EXCHANGED/STORE_CREDIT), reason (wrong_shade/allergic_reaction/damaged/leaked/changed_mind/duplicate/expired/irritation/scent_disliked/color_not_expected), opened_status, hygiene_status, refund_method, refund_amount, evidence_photos, staff_notes, timestamps
- Hygiene workflow: force staff to select sealed/opened/used/damaged before inventory update
- Returned beauty products default to quarantine, never auto-restock
- Refund/exchange/store credit options

### Reviews (`src/components/admin/reviews/ReviewsView.tsx`)
- Skin-type, shade, age-range tagging on reviews
- Verified buyer badge logic
- Low-rating alerts, pattern detection ("many with oily skin report pilling")
- Feature review capability
- Q&A moderation tab

### Settings (`backend/src/modules/settings/`)
- Working settings save (payload: `{ settings: [{ key, value }] }`) — verify after Phase 1 fix
- Role requirement: ADMIN (not SUPER_ADMIN)

### Audit Log (`src/components/admin/audit/AuditLogView.tsx`)
- Filter by action type, date range, user
- Human-readable change descriptions
- Export capability
- Include IP address

## P1 Modules (high-value after P0)

### Inventory & Batch (`src/components/admin/inventory/`, new backend module)
- Stock by SKU/variant, stock by location
- Low-stock alerts with reorder points
- Supplier/vendor records
- Purchase orders (DRAFT/SENT/CONFIRMED/RECEIVED/CANCELLED)
- Stock adjustments with reason codes
- Batch tracking: batch_number, manufacture_date, expiry_date, PAO, quantity, status (ACTIVE/QUARANTINED/RECALLED/EXPIRED/DEPLETED)
- "Expiry Risk" view: products expiring in 30/60/90 days
- Recall lookup by batch
- DB tables: `product_batches`, `suppliers`, `purchase_orders`, `purchase_order_items`

### Content Management (`src/components/admin/content/`, plus blog/gallery existing)
- Homepage section builder (drag-and-drop ordering, section types: hero, featured, category grid, blog, testimonials)
- Media library (upload, folders, alt text, usage tracking)
- Beauty content: ingredient glossary, routine guide builder, brand pages, "how to" guides
- Preview before publishing, scheduled publishing, draft mode, version history

### Analytics (`src/components/admin/analytics/AnalyticsView.tsx`)
- Daily metrics: revenue, orders, AOV, conversion, gross margin, refunds, return rate
- Product metrics: best sellers, slow movers, high-return, high/low margin, frequently-bought-together
- Beauty metrics: shade return rate, skin concern demand, expiring stock value, replenishment intervals
- CSV/PDF export per report

### Compliance & Security
- Role presets: Owner, Store Manager, Fulfillment, Support, Marketing, Accountant, Developer — each with granular permissions
- 2FA (TOTP + backup codes)
- Approval workflows: price changes, product deletions, refunds > threshold, staff access changes
- Enhanced audit log with human-readable diffs
- GDPR/privacy: data export, account deletion, consent management

## UX Requirements (non-negotiable)
- **No technical labels**: no "variant object", "fulfillment_queue", "PIM validation state"
- **Smart search** across: products, orders, customers, SKUs, barcodes, brands, shades, ingredients, batches, returns, tickets
- **Saved views** per module (pre-built filters the owner can save)
- **Tooltips + examples** on every complex field (e.g., INCI field: "Enter ingredients as shown on packaging. Example: Aqua, Glycerin, Niacinamide...")
- **Bulk actions** with safety confirmations: "You are about to update 54 variants" with preview, undo, and change log
- **Plain-language validation**: not "Variant metafield value is invalid" but "Shade 'Warm Beige 240' is missing a swatch image"
- **WCAG 2.2**: clear labels, keyboard nav, focus states, contrast, error messages, mobile-responsive

## Build Order
1. Dashboard rebuild
2. Products (beauty fields + templates)
3. Orders (saved views + timeline + fraud flags)
4. Customers (detail page enhancements)
5. Promotions (bundles + campaign calendar)
6. Returns (new module)
7. Reviews (tagging + pattern detection)
8. Settings + Audit Log (verify existing)
9. Inventory & Batch (new module)
10. Content Management (enhance existing)
11. Analytics (enhance existing)
12. Compliance & Security (roles + 2FA + workflows)

## Verification Per Sprint
- `npx tsc --noEmit` — no type errors
- `npm run build` — builds successfully
- CRUD operations work end-to-end
- Admin panel usable on mobile
- Non-technical owner can complete each workflow without confusion

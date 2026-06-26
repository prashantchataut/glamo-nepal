# GLAMO Nepal — Critical Bug Fixes

## How to apply these changes

### Option A: Manual (recommended)
1. Extract this zip into the ROOT of your `glamo-nepal` repo (folder structure matches exactly — files will overwrite existing ones).
2. **Delete these two files** (setup wizard was removed):
   - `src/app/admin/setup/page.tsx`
   - `src/components/admin/setup/SetupWizardView.tsx`
3. Run `bun install` (or `npm install`).
4. Run `bun run typecheck` — should show 0 errors.
5. Run `bun run lint` — should show 0 errors.
6. Commit and push to deploy.

### Option B: Using the apply script (macOS/Linux)
```bash
# From your glamo-nepal repo root:
bash /path/to/extracted/zip/apply-changes.sh
```

---

## Files changed (15 files modified, 2 files deleted)

### Frontend (`src/`)

| File | Fix |
|------|-----|
| `src/app/admin/page.tsx` | Admin home now renders **DashboardView** (was SettingsView → "admin redirects to settings" bug) |
| `src/app/api/v1/[[...slug]]/route.ts` | Proxy preserves **real client IP** from cf-connecting-ip/x-real-ip (was overwriting with "unknown" → audit log IP=NULL) |
| `src/components/admin/coupons/CouponListView.tsx` | CouponForm gets `key` prop to reset on open; `onSaved` resets to page 1 (new coupons now visible immediately) |
| `src/components/admin/inventory/InventoryView.tsx` | Uses backend `summary.totalRetailValue` (full catalog, not just current page of 20) |
| `src/components/checkout/OrderSummarySidebar.tsx` | Cart items now show **price + shade info** |
| `src/components/checkout/steps/PaymentStep.tsx` | COD shows **"3% service fee applies"** note |
| `src/components/product/ProductCard.tsx` | Uses `toArray()` for concernTags/shadeOptions (defensive — fixes `.map is not a function` crash) |
| `src/components/reviews/ReviewSection.tsx` | Handles **3 response shapes** defensively (fixes `.map` crash on product page) |
| `src/lib/data/faq.ts` | Trimmed redundant COD FAQ entry |
| `src/lib/server/backend.ts` | Forwards **all IP headers** + user-agent to backend (audit log IP capture) |
| `src/lib/utils.ts` | **Deterministic `formatNPR`** — no `Intl.NumberFormat` (fixes React #418 hydration error) |

### Backend (`backend/`)

| File | Fix |
|------|-----|
| `backend/src/modules/coupons/coupon.controller.ts` | Uses shared `extractClientInfo` (was missing `cf-connecting-ip`) |
| `backend/src/modules/inventory/inventory.service.ts` | Retail value uses `salePrice/basePrice` not `cost_price`; summary includes `totalRetailValue`, `totalCostValue`, `potentialMargin` |
| `backend/src/modules/orders/order.service.ts` | Fixed SQL crash in `findOrCreateCustomer` (deleted_at column check — was causing checkout 500) |

### Config

| File | Fix |
|------|-----|
| `.eslintrc.json` | Ignores `dist/` directory (pre-built worker.js was causing false lint errors) |

---

## Deleted files (do this manually after extracting)

- `src/app/admin/setup/page.tsx`
- `src/components/admin/setup/SetupWizardView.tsx`
- (and the empty `src/app/admin/setup/` + `src/components/admin/setup/` folders)

---

## Summary of 9 critical bugs fixed

1. **Admin dashboard routing** — showed settings instead of dashboard
2. **Product page `.map is not a function` crash** — defensive array handling
3. **React #418 hydration error** — deterministic NPR formatter
4. **Checkout 500 error** — SQL crash on users without deleted_at column
5. **Inventory retail value** — was using cost_price instead of retail price; now full catalog
6. **Audit log IP capture** — proxy was overwriting IP with "unknown"
7. **Setup wizard removed** — deleted entirely from codebase
8. **COD cleanup** — no longer promoted on every page; 3% fee shown only at checkout
9. **Coupon list refresh** — form reset + page reset after creation

---

## Verification

- `bun run typecheck` → **0 errors**
- `bun run lint` → **0 errors** (3 pre-existing warnings unrelated to these changes)
- Homepage, Shop, Checkout, Admin, Account, FAQ all return correct HTTP codes
- Agent Browser confirms all pages render with **zero console errors**

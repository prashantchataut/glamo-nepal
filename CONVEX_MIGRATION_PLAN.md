# Convex → Hono API Migration Plan

## Current State

The frontend has **two competing data layers**:

1. **Convex** (legacy) — used by 15+ components for real-time queries via `useConvexQueries.ts`
2. **Hono API** (current) — used by the new admin dashboard views via `useAdminData.ts` / `useAdminMutation.ts`

The backend (Hono on Cloudflare Workers) already has **125 API routes** covering every data operation. Supabase is the database — it stays.

## Convex Usage Map → Hono API Equivalents

### Already Migrated (using Hono API)
| Component | Convex Hook | Hono API Endpoint | Status |
|-----------|------------|-------------------|--------|
| ProductsView | `useProducts`, `useCreateProduct`, etc. | `GET/POST/PATCH/DELETE /api/v1/products` | ✅ Done |
| OrdersView | `useOrders`, `useUpdateOrderStatus` | `GET /api/v1/orders`, `PATCH /api/v1/orders/:id/status` | ✅ Done |
| CustomersView | `useUsers`, `useUpdateUserStatus` | `GET /api/v1/admin/users` | ✅ Done |
| InventoryView | `useInventoryReport`, `useLowStockAlerts` | `GET /api/v1/inventory/report`, `/low-stock` | ✅ Done |
| DashboardView | `useDashboardStats` | `GET /api/v1/admin/dashboard` | ✅ Done |
| BannersView | `useBanners` | `GET/POST/PATCH/DELETE /api/v1/banners` | ✅ Done |
| AnalyticsView | `useSalesReport` | `GET /api/v1/admin/sales-report` | ✅ Done |
| AuditLogView | `useAuditLogs` | `GET /api/v1/admin/audit-logs` | ✅ Done |
| SettingsView | N/A (was direct Supabase) | `GET/PATCH /api/v1/settings` | ✅ Done |
| AdminNotifications | `useNotifications` | `GET/PATCH /api/v1/admin/notifications` | ✅ Done |
| AdminLoginForm | `useAuthActions` | `POST /api/v1/auth/login` | ✅ Done |
| AdminDashboard | `useAuthActions` | `POST /api/v1/auth/logout` | ✅ Done |

### Still Using Convex (Need Migration)
| Component | Convex Hook | Hono API Equivalent | Migration Complexity |
|-----------|------------|-------------------|---------------------|
| `ProductForm.tsx` | `useCreateProduct`, `useUpdateProduct`, `useAdjustStock` | `POST /api/v1/products`, `PATCH /api/v1/products/:id`, `PATCH /api/v1/products/:id/variants/:variantId/stock` | Medium |
| `RestockModal.tsx` | `useAdjustStock` | `PATCH /api/v1/products/:id/variants/:variantId/stock` | Low |
| `AccountShell.tsx` | `useAuthActions` (login/logout) | `POST /api/v1/auth/login`, `/logout` | Medium |
| `AuthForm.tsx` | `useAuthActions` (register/login) | `POST /api/v1/auth/register`, `/login` | Medium |
| `ForgotPasswordClient.tsx` | `useAuthActions` | `POST /api/v1/auth/forgot-password` | Low |
| `ResetPasswordClient.tsx` | `useAuthActions` | `POST /api/v1/auth/reset-password` | Low |

### Public-Facing Components Still Using Convex
| Component | Convex Hook | Hono API Equivalent | Migration Complexity |
|-----------|------------|-------------------|---------------------|
| Catalog pages (shop, search, product detail) | `useProducts`, `useProductBySlug`, `useCategories`, `useBrands` | `GET /api/v1/products`, `/categories`, `/brands` | Medium |
| Cart | `useCart`, `useAddToCart`, `useUpdateCartItem`, `useRemoveFromCart`, `useClearCart` | `GET/POST/PATCH/DELETE /api/v1/cart` | Medium |
| Wishlist | `useWishlist`, `useAddToWishlist`, `useRemoveFromWishlist` | `GET/POST/DELETE /api/v1/wishlist` | Medium |
| Checkout | `useCreateOrder` | `POST /api/v1/checkout/orders` | Low |
| Contact form | `useSubmitContact` | `POST /api/v1/events` (or new endpoint) | Low |
| Newsletter | `useSubscribeNewsletter` | `POST /api/v1/newsletter/subscribe` | Low |

## What You Need To Do

### Phase 1: Remove Convex from Admin (2-3 hours)

1. **Migrate `ProductForm.tsx`** — Replace `useCreateProduct`, `useUpdateProduct` with `useAdminMutation` calling the Hono products API
2. **Migrate `RestockModal.tsx`** — Replace `useAdjustStock` with `useAdminMutation` calling `PATCH /api/v1/products/:id/variants/:variantId/stock`
3. **Migrate `AccountShell.tsx`** — Replace Convex auth with Hono auth API calls
4. **Migrate `AuthForm.tsx`** — Replace Convex auth actions with Hono auth endpoints
5. **Migrate `ForgotPasswordClient.tsx`** and `ResetPasswordClient.tsx`** — Use Hono auth endpoints
6. **Delete `ConvexClientProvider.tsx`** and remove Convex from `layout.tsx`
7. **Delete `useConvexQueries.ts`**
8. **Remove Convex dependencies from `package.json`**: `convex`, `@convex-dev/auth`
9. **Remove Convex env var** `NEXT_PUBLIC_CONVEX_URL` from `.env.local`
10. **Delete the `convex/` directory**

### Phase 2: Remove Convex from Public Pages (3-4 hours)

1. **Migrate catalog pages** — Replace Convex queries with Hono API calls (or keep using the Hono API directly since these are already public endpoints)
2. **Migrate cart** — Replace Convex mutations with Hono API calls
3. **Migrate wishlist** — Replace Convex hooks with Hono API calls

### Phase 3: Cleanup (30 min)

1. **Remove `convex/` directory entirely**
2. **Remove `@convex-dev/auth` and `convex` from `package.json`**
3. **Remove `NEXT_PUBLIC_CONVEX_URL` from `.env.local` and `src/lib/env.ts`**
4. **Remove Convex types from `tsconfig.json`** (already done — `include` only has `src/**/*.ts`)
5. **Run `npm install` to clean up**
6. **Verify: `npm run typecheck && npm run lint && npm test`**

## What You DON'T Need To Do

- **Don't touch Supabase** — it's the database layer, not the frontend layer
- **Don't rewrite backend services** — they're already Hono → Supabase, working correctly
- **Don't change any Hono API endpoints** — the API is complete and stable

## Quick Start Commands

```bash
# After migrating all components, run:
rm -rf convex/
npm uninstall convex @convex-dev/auth
# Remove NEXT_PUBLIC_CONVEX_URL from .env.local
npm install  # clean install
npm run typecheck && npm run lint && npm test  # verify
```
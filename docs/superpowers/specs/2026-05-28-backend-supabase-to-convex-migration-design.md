# Design: Migrate Backend from Supabase to Convex

**Date:** 2026-05-28
**Status:** Approved
**Scope:** Replace Supabase client in `backend/` with Convex HTTP API calls

## Overview

The backend (`backend/`) is a Hono API running on Cloudflare Workers that currently uses Supabase for auth, database, and storage. The frontend (`src/`) already uses Convex exclusively. This migration replaces Supabase with Convex as the backend's data layer, eliminating the dual-backend complexity and ensuring all data lives in one place.

## Current State

### Frontend (Next.js + Convex)
- Products, brands, collections, orders, contact, newsletter, settings — all in Convex
- Auth via `@convex-dev/auth` (phone OTP)
- No references to the backend API or Supabase

### Backend (Hono + Supabase on Cloudflare Workers)
- 20 modules, all using Supabase client
- Auth via Supabase Auth (email/password)
- Rate limiting via Cloudflare KV
- 863 references to Supabase across service files

### Overlap
| Feature | Convex | Backend (Supabase) |
|---------|--------|-------------------|
| Products | Yes (full CRUD) | Yes (full CRUD) |
| Brands | Yes (full CRUD) | Yes (full CRUD) |
| Collections | Yes | Yes (categories) |
| Orders | Yes (create, status) | Yes (full CRUD + payment) |
| Contact | Yes | Yes (with sanitization) |
| Newsletter | Yes | Yes (with rate limiting) |
| Settings | Yes | Yes (admin CRUD) |
| Auth | Phone OTP | Email/password + JWT |
| Account | No | Yes (profile, addresses, avatar) |
| Admin | No | Yes (dashboard, users, audit) |
| Reviews | No | Yes (full CRUD) |
| Blog | No | Yes (full CRUD) |
| Banners | No | Yes (full CRUD) |
| Cart | No | Yes (full CRUD) |
| Coupons | No | Yes (CRUD + validate/apply) |
| Events | No | Yes (tracking) |
| Gallery | No | Yes (full CRUD) |
| Inventory | No | Yes (reports, logs) |
| Popups | No | Yes (full CRUD) |
| Recommendations | No | Yes (query) |
| Team | No | Yes (full CRUD) |
| Wishlist | No | Yes (full CRUD) |

## Target Architecture

```
Frontend (Next.js) ──► Convex ◄── Hono API (Workers)
                              │
                    Single source of truth
```

The Hono API becomes a **thin HTTP layer** over Convex. It provides:
- RESTful endpoints for external consumers (mobile apps, third-party integrations)
- Rate limiting via Cloudflare KV
- Request validation via Zod schemas
- JWT authentication via Convex tokens

All data operations go through Convex HTTP API (`/api/query` and `/api/mutation`).

## Key Design Decisions

### 1. Backend calls Convex via HTTP, not Convex client

The Cloudflare Workers environment can't use the Convex npm client directly (it requires Node.js APIs). Instead, the backend will call Convex's HTTP API using `fetch()`:

```typescript
// Query example
const result = await convexQuery('products:getProducts', { category: 'skincare' })

// Mutation example
const result = await convexMutation('products:createProduct', { name: 'New Product', ... })
```

This requires adding Convex HTTP API endpoints in `convex/http.ts` for all operations the backend needs.

### 2. Auth: Replace Supabase Auth with Convex JWT validation

The current `authMiddleware` validates Supabase JWTs. After migration, it will validate Convex JWTs using the `jose` library (already a dependency):

```typescript
// Before: supabase.auth.getUser(token)
// After: jose.jwtVerify(token, CONVEX_JWT_PUBLIC_KEY)
```

The backend extracts `userId`, `email`, and `role` from the Convex JWT. The `requireRole` middleware stays unchanged.

### 3. Rate limiting stays on KV

Cloudflare KV rate limiting works well and is already implemented. No changes needed to the rate limiting middleware.

### 4. File uploads move to Convex storage

Supabase Storage for images → Convex file storage. The backend will proxy file uploads to Convex.

### 5. Convex schema additions

The following tables need to be added to `convex/schema.ts`:

- `reviews` — product reviews with rating, approval workflow
- `blogs` — blog posts with publish/unpublish
- `banners` — homepage banners with position and ordering
- `cartItems` — shopping cart per user
- `wishlistItems` — wishlist per user
- `coupons` — discount codes with validation rules
- `events` — analytics event tracking
- `galleryItems` — gallery images with ordering
- `inventoryLogs` — stock adjustment history
- `popups` — popup configuration
- `teamMembers` — team page members
- `categories` — product categories (separate from collections)
- `userAddresses` — shipping addresses per user
- `userProfiles` — extended profile data

### 6. Convex HTTP API endpoints

New endpoints in `convex/http.ts` to serve the backend:

```
POST /api/query     → Convex query
POST /api/mutation  → Convex mutation
```

These endpoints will use Convex's internal HTTP API with the service role key for admin operations.

## What Changes Per Module

### High Complexity (auth rewrite)
- **auth** — Complete rewrite. Supabase Auth → Convex JWT validation via `jose`.

### Medium Complexity (service rewrite)
- **account** — Profile/addresses → Convex mutations
- **admin** — Dashboard stats → Convex aggregation queries
- **products** — Extend Convex schema with variants, images
- **orders** — Extend Convex schema with payment fields

### Low Complexity (new Convex tables + simple CRUD)
- **cart, wishlist, coupons, reviews, blog, banners, categories, gallery, popups, team, events, inventory, recommendations, settings, newsletter**

## What Gets Removed

- `@supabase/supabase-js` dependency from `backend/package.json`
- `backend/src/middleware/supabase.ts` — Supabase client middleware
- `backend/src/utils/supabase.ts` — Error handling utilities
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `wrangler.toml` bindings
- All `supabase.from('table').*` calls across all service files
- All `supabase.auth.*` calls from auth middleware

## What Stays Unchanged

- Hono framework and all route definitions
- All Zod validation schemas
- All rate limiting middleware (KV-backed)
- `requireRole` middleware (unchanged)
- CORS configuration
- Security headers
- Error handling patterns
- All controller logic (rewritten to call Convex instead of Supabase)

## Migration Order (Phases)

### Phase 1: Foundation
1. Add Convex HTTP API helper to backend (convexQuery, convexMutation)
2. Rewrite authMiddleware to validate Convex JWTs
3. Replace supabaseMiddleware with Convex HTTP client middleware
4. Remove Supabase dependencies

### Phase 2: Schema — Add missing tables to Convex
5. Add reviews, blogs, banners, categories, cart, wishlist, coupons, events, gallery, inventory, popups, team, userAddresses, userProfiles to Convex schema
6. Add Convex query/mutation functions for each new table

### Phase 3: Service rewrite — Port all modules
7. Rewrite each service file to use Convex HTTP API instead of Supabase
8. Port data migration scripts if needed

### Phase 4: Testing & cleanup
9. Update all tests to mock Convex HTTP API instead of Supabase
10. Remove Supabase environment variables and bindings
11. Verify all endpoints work end-to-end

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Convex HTTP API latency | Medium | Convex has edge deployment; latency should be comparable to Supabase |
| Data migration | High | Run both backends during transition; migrate data with scripts |
| Auth token incompatibility | Medium | Frontend already uses Convex Auth; backend just needs to validate the same JWTs |
| Cloudflare Workers fetch limits | Low | Use connection pooling and batch queries where possible |
| Missing Convex features | Low | Convex supports file storage, scheduled functions, and HTTP API — covers all backend needs |

## Open Questions

- None — design approved by user on 2026-05-28
# GLAMO Nepal — Cloudflare Workers Backend Design

**Date:** 2026-05-01  
**Status:** Approved  
**Approach:** Replace existing Express/PostgreSQL backend entirely with Hono.js/Cloudflare Workers/D1/R2/KV

---

## 1. Architecture Overview

**Runtime:** Cloudflare Workers (V8 isolates, not Node.js)  
**Framework:** Hono.js — typed, lightweight, Express-like API built for edge  
**Database:** Cloudflare D1 (SQLite at the edge) via Prisma + `@prisma/adapter-d1`  
**Object Storage:** Cloudflare R2 (S3-compatible) for file uploads  
**Cache:** Cloudflare KV for response caching and rate limiting  
**Email:** Resend API (fetch-based, edge-compatible)  
**Auth:** JWT RS256 via `jose` library, HTTP-only cookies  
**Passwords:** `bcryptjs` (edge-compatible, not `bcrypt`)  
**Validation:** Zod (works in edge runtime)

### Request Flow

```
Client → Cloudflare CDN → Worker (Hono)
  → Auth middleware (JWT from cookie/header)
  → Rate limit check (KV)
  → Route handler
  → Service layer (business logic)
  → Repository layer (D1 queries via Prisma adapter)
  → Cache check/update (KV)
  → Response
```

### Directory Structure

```
glamo-backend/
├── prisma/
│   └── schema.prisma          # SQLite-compatible schema
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── 0002_seed_data.sql
├── src/
│   ├── index.ts                # Hono app entry, route registration
│   ├── config/
│   │   └── env.ts              # Zod-validated env bindings
│   ├── types/
│   │   └── bindings.ts         # CloudflareBindings interface
│   ├── middleware/
│   │   ├── auth.ts             # JWT extraction + user verification
│   │   ├── requireRole.ts     # Role-based access control
│   │   ├── validate.ts         # Zod validation wrapper for Hono
│   │   └── rateLimit.ts        # KV-based rate limiting
│   ├── utils/
│   │   ├── response.ts         # Standardized JSON responses
│   │   ├── pagination.ts       # Page/limit parsing
│   │   ├── jwt.ts              # RS256 token generation/verification
│   │   ├── password.ts         # bcryptjs hash/compare
│   │   ├── slug.ts             # URL slug generation
│   │   ├── orderNumber.ts     # GLM-YYYY-XXXXXX format
│   │   ├── cache.ts            # KV cache wrapper with TTL
│   │   ├── price.ts            # Paisa integer storage/display
│   │   ├── email.ts            # Resend API transactional emails
│   │   ├── storage.ts           # R2 upload/delete/URL
│   │   ├── upload.ts           # Cloudinary via fetch API
│   │   └── audit.ts            # Audit log creation (non-blocking)
│   └── modules/
│       ├── auth/
│       │   ├── auth.service.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.routes.ts
│       │   └── auth.schema.ts
│       ├── categories/
│       │   ├── category.service.ts
│       │   ├── category.controller.ts
│       │   ├── category.routes.ts
│       │   └── category.schema.ts
│       ├── brands/
│       │   ├── brand.service.ts
│       │   ├── brand.controller.ts
│       │   ├── brand.routes.ts
│       │   └── brand.schema.ts
│       ├── products/
│       │   ├── product.service.ts
│       │   ├── product.controller.ts
│       │   ├── product.routes.ts
│       │   └── product.schema.ts
│       └── inventory/
│           ├── inventory.service.ts
│           ├── inventory.controller.ts
│           ├── inventory.routes.ts
│           └── inventory.schema.ts
├── wrangler.toml
├── .dev.vars.example
├── package.json
├── tsconfig.json
├── DEPLOYMENT.md
└── PRODUCTION_CHECKLIST.md
```

---

## 2. Database Schema — SQLite/D1 Adaptations

All models from the existing PostgreSQL schema are adapted for SQLite:

| PostgreSQL Feature | SQLite/D1 Adaptation |
|---|---|
| `@db.Uuid` | `TEXT` with `@default(uuid())` using Prisma's `uuid()` or `cuid()` |
| `@db.Decimal(10,2)` | `INT` — prices stored as paisa (NPR × 100) |
| `String[]` (arrays) | `TEXT` storing JSON (`JSON.stringify`) |
| `enum` types | `TEXT` with application-level validation via Zod |
| `@db.Text` | Not needed in SQLite, just `String` |
| `Boolean` | Stored as `INTEGER` (0/1) in SQLite |
| `DateTime` | Stored as `TEXT` (ISO 8601) in SQLite |
| `Json` | `TEXT` storing JSON strings |

### Price Storage Strategy

All monetary values stored as integers (paisa):
- NPR 1,299.00 → stored as `129900`
- NPR 250.50 → stored as `25050`

Utility functions:
```
toStoredPrice(npr: number): number  → npr * 100
toDisplayPrice(stored: number): number  → stored / 100
formatNPR(stored: number): string  → "NPR 1,299"
```

### Key Schema Models (SQLite-adapted)

**User** — id (TEXT/uuid), email (TEXT/unique), phone (TEXT/nullable), passwordHash (TEXT/nullable), firstName, lastName, avatarUrl, role (TEXT: CUSTOMER|STAFF|ADMIN|SUPER_ADMIN), isActive (INT/boolean), emailVerified (INT/boolean), phoneVerified (INT/boolean), googleId (TEXT/unique/nullable), createdAt, updatedAt, deletedAt

**Product** — id (TEXT/uuid), name, slug (unique), description, shortDescription, sku (unique/nullable), categoryId, brandId (nullable), basePrice (INT/paisa), salePrice (INT/nullable/paisa), costPrice (INT/nullable/paisa), currency (TEXT/default "NPR"), isActive (INT), isFeatured (INT), isDigital (INT), trackInventory (INT), stockQuantity (INT), lowStockThreshold (INT/default 5), weight (INT/nullable), dimensions (TEXT/JSON/nullable), metaTitle, metaDescription, tags (TEXT/JSON), createdAt, updatedAt, deletedAt

**ProductVariant** — id, productId, name, sku (unique/nullable), price (INT/paisa), salePrice (INT/nullable/paisa), stockQuantity (INT), attributes (TEXT/JSON), isActive (INT), createdAt, updatedAt, deletedAt

All other models follow the same pattern: UUIDs as TEXT, prices as INT, arrays as TEXT/JSON, enums as TEXT with Zod validation, booleans as INT, dates as TEXT (ISO 8601).

---

## 3. Authentication & Security

### JWT RS256 with `jose`

- **Access token:** 15-minute expiry, RS256 signed with private key
- **Refresh token:** 7-day expiry, stored in D1 `refresh_tokens` table
- **Token rotation:** New refresh token issued on each refresh, old one revoked
- **Storage:** Access token in HTTP-only cookie (`__Host-access_token`), refresh token in HTTP-only cookie (`__Host-refresh_token`)
- **Fallback:** Also accept `Authorization: Bearer <token>` header

### Password Security

- `bcryptjs` with 12 rounds
- Verification/reset tokens: `crypto.randomUUID()` hashed with SHA-256 before storage
- Email verification token expiry: 24 hours
- Password reset token expiry: 1 hour

### Rate Limiting (KV-based)

| Endpoint | Limit | Window | Key |
|---|---|---|---|
| Login/Register | 5 | 15 min | IP |
| Password reset | 3 | 1 hour | email |
| Coupon validate | 10 | 1 min | IP |
| Payment | 5 | 1 min | user ID |
| General | 100 | 1 min | IP |

Implementation: Store `ratelimit:{ip}:{route}` in KV with TTL matching the window. Check count → increment → return 429 if exceeded.

### Google OAuth (Edge-compatible)

No passport.js. Manual flow:
1. `GET /auth/google` → redirect to Google OAuth URL with client_id, redirect_uri, scope, state
2. `GET /auth/google/callback` → exchange code for tokens (fetch to Google), get user profile, find or create user in D1, set auth cookies, redirect to frontend

---

## 4. Caching Strategy (KV)

### Cache-Aside Pattern

**Read:** Check KV → if miss, query D1 → store in KV → return  
**Write:** Update D1 → invalidate related KV keys

### TTL Constants

| Data | KV Key Pattern | TTL |
|---|---|---|
| Banners | `banners:{position}` | 600s (10 min) |
| Categories | `categories:tree`, `categories:slug:{slug}` | 1800s (30 min) |
| Settings | `settings:{key}` | 1800s (30 min) |
| Popup | `popup:active` | 600s (10 min) |
| Product | `product:slug:{slug}` | 300s (5 min) |
| Product list | `products:{hash-of-filters}` | 300s (5 min) |
| Brands | `brands:all`, `brands:slug:{slug}` | 1800s (30 min) |

### Cache Invalidation

- On any mutation (create/update/delete), delete specific KV keys and any list keys that might contain the changed entity
- Product mutations bust: `product:slug:{slug}`, `products:*` (list caches), `categories:tree` (if category changed)
- Category mutations bust: `categories:tree`, `categories:slug:{slug}`
- Brand mutations bust: `brands:all`, `brands:slug:{slug}`
- Never serve stale data for inventory/prices — product detail cache is short (5 min) and always busted on stock changes

---

## 5. File Upload Strategy

### Cloudinary (Primary — for images)

Use Cloudinary REST Upload API via `fetch` (no Node.js SDK needed):

```
POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
Content-Type: multipart/form-data
Body: file=<binary>, upload_preset=<preset>, folder=<folder>
```

- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Max size: 5MB
- Auto-convert to WebP via Cloudinary transformation
- Auto-quality optimization
- Returns `{ url, public_id }`
- Delete via `POST https://api.cloudinary.com/v1_1/{cloud_name}/image/destroy` with signature

### R2 (Secondary — for general file storage)

- Upload buffer to R2 bucket binding
- Generate public URL via R2.dev subdomain or custom domain
- Used for: exports, documents, non-image assets

---

## 6. Product Filtering — Specification Pattern

Build WHERE clause programmatically from validated query params. Never concatenate strings. Always use parameterized queries via Prisma or D1 prepared statements.

### Supported Filters (all combinable)

```
?category=skincare
&brand=loreal
&search=vitamin c serum
&minPrice=500          (converted to paisa: 50000)
&maxPrice=3000         (converted to paisa: 300000)
&skinType=oily,dry     (comma-separated, stored as JSON array in tags/attributes)
&rating=4              (minimum average rating)
&inStock=true
&featured=true
&sort=newest|price-asc|price-desc|best-seller|most-reviewed|rating
&page=1
&limit=24
```

### Search Implementation (D1/SQLite)

- Split search terms by space
- Each term must appear in at least one of: name, shortDescription, tags, brand name
- AND logic across terms, OR logic across fields per term
- Use `LIKE '%term%'` for each term (D1 doesn't support full-text search natively in the same way PostgreSQL does)
- Consider pre-computing a `searchVector` TEXT column that concatenates name + description + tags for simpler LIKE queries

### Cache Key Strategy for Filtered Lists

Create deterministic cache key from sorted filter params:
```
products:hash(sortedParams) → KV key
```

---

## 7. Module APIs

### Auth Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/v1/auth/register | Public | Register new user |
| POST | /api/v1/auth/login | Public | Login with email/password |
| POST | /api/v1/auth/logout | Public | Clear auth cookies |
| POST | /api/v1/auth/refresh-token | Public | Rotate refresh token |
| GET | /api/v1/auth/verify-email/:token | Public | Verify email address |
| POST | /api/v1/auth/forgot-password | Public | Send reset email |
| POST | /api/v1/auth/reset-password | Public | Reset password with token |
| GET | /api/v1/auth/google | Public | Redirect to Google OAuth |
| GET | /api/v1/auth/google/callback | Public | Google OAuth callback |
| GET | /api/v1/auth/me | Protected | Get current user |
| POST | /api/v1/auth/change-password | Protected | Change password |

### Category Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/v1/categories | Public | Get category tree (cached) |
| GET | /api/v1/categories/:slug | Public | Get category with children + product count |
| POST | /api/v1/categories | Admin+ | Create category |
| PATCH | /api/v1/categories/:id | Admin | Update category |
| DELETE | /api/v1/categories/:id | Admin | Delete category (soft) |
| POST | /api/v1/categories/:id/image | Admin | Upload category image |

### Brand Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/v1/brands | Public | List all active brands (cached) |
| GET | /api/v1/brands/:slug | Public | Get brand detail |
| POST | /api/v1/brands | Admin | Create brand |
| PATCH | /api/v1/brands/:id | Admin | Update brand |
| DELETE | /api/v1/brands/:id | Admin | Delete brand (soft) |

### Product Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/v1/products | Public | List products with filters |
| GET | /api/v1/products/search | Public | Search products |
| GET | /api/v1/products/:slug | Public | Product detail with images, variants, reviews |
| POST | /api/v1/products | Admin | Create product |
| PATCH | /api/v1/products/:id | Admin | Update product |
| DELETE | /api/v1/products/:id | Admin | Soft delete product |
| PATCH | /api/v1/products/:id/toggle-hidden | Admin | Toggle isActive |
| PATCH | /api/v1/products/:id/toggle-featured | Admin | Toggle isFeatured |
| POST | /api/v1/products/:id/images | Admin | Upload product images |
| DELETE | /api/v1/products/:id/images/:imgId | Admin | Delete product image |
| GET | /api/v1/products/:id/variants | Admin | List variants |
| POST | /api/v1/products/:id/variants | Admin | Add variant |
| PATCH | /api/v1/products/:id/variants/:vid | Admin | Update variant |
| DELETE | /api/v1/products/:id/variants/:vid | Admin | Delete variant |
| PATCH | /api/v1/products/:id/variants/:vid/stock | Admin | Adjust variant stock |

### Inventory Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/v1/inventory/report | Admin | Stock report with values |
| GET | /api/v1/inventory/low-stock | Admin | Products at or below threshold |
| GET | /api/v1/inventory/logs | Admin | Paginated inventory change log |

---

## 8. Service Layer Pattern

Every module follows the same layered architecture:

```
Route (input validation, call service, return response)
  ↓
Service (business logic, orchestration, cache management)
  ↓
Repository (D1/Prisma queries, raw SQL if needed)
  ↓
Database (D1)
```

**Rules:**
- Routes contain NO business logic — only validate input, call service, return response
- Services contain ALL business logic — validation beyond schema, cache management, orchestration
- Repositories contain ONLY database queries — reusable across services
- No DB queries in route handlers
- No business logic in repository functions

---

## 9. Audit Logging

Every admin mutation creates an audit log:

```
createAuditLog(db, {
  userId: adminId,
  action: 'UPDATE',
  entity: 'Product',
  entityId: productId,
  changes: { field: 'price', old: 129900, new: 149900 },
  ipAddress: request.ip,
  userAgent: request.headers.get('user-agent')
})
```

Audit logging is async and non-blocking — failures are logged but never cause request failures.

---

## 10. Email Templates (Resend)

Six transactional email templates, all generating HTML strings (no template engine needed at edge):

1. **verifyEmail(name, url)** — Email verification with link
2. **passwordReset(name, url)** — Password reset with link
3. **orderConfirmation(order)** — Order confirmation details
4. **orderStatusUpdate(order, status)** — Status change notification
5. **welcome(name)** — Post-registration welcome
6. **lowStockAlert(products)** — Admin-only low stock warning

All emails sent via Resend API (`POST https://api.resend.com/emails` with fetch).

---

## 11. Environment Configuration

### wrangler.toml (non-secret)

```toml
name = "glamo-nepal-api"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "glamo-nepal-db"
database_id = "<from-dashboard>"

[[kv_namespaces]]
binding = "KV"
id = "<from-dashboard>"

[[r2_buckets]]
binding = "R2"
bucket_name = "glamo-nepal-assets"

[vars]
FRONTEND_URL = "https://glamonepal.com"
FREE_SHIPPING_THRESHOLD = "2500"
COD_FEE = "50"
ADMIN_EMAIL = "admin@glamonepal.com"
```

### Secrets (via `wrangler secret put`)

- `JWT_PRIVATE_KEY` — RSA private key PEM
- `JWT_PUBLIC_KEY` — RSA public key PEM
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`
- `R2_PUBLIC_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `KHALTI_SECRET_KEY`
- `ESEWA_SECRET_KEY`
- `ESEWA_MERCHANT_CODE`

---

## 12. Migration Strategy

### SQL Migrations (wrangler d1)

D1 uses wrangler for migrations, not `prisma migrate`. The Prisma schema is for type generation only.

**0001_initial_schema.sql** — All CREATE TABLE and CREATE INDEX statements adapted for SQLite:
- `PRAGMA foreign_keys = ON;` at the top
- UUIDs generated as TEXT with `DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))` for auto-generated UUIDs
- All timestamps as `TEXT DEFAULT (datetime('now'))`
- Prices as INTEGER

**0002_seed_data.sql** — INSERT statements for:
- 1 super admin user (password hashed with bcryptjs)
- 5 categories with subcategories (Skincare, Makeup, Haircare, Body Care, Fragrance)
- 6 brands (Maybelline, L'Oreal, Lakme, Himalaya, Biotique, The Ordinary)
- 20 products with Nepal-appropriate NPR prices (stored as paisa integers)
- Default site settings
- 2 hero banners
- 1 welcome popup
- 3 team members

---

## 13. Error Handling

Hono's `HTTPException` for expected errors. Custom error handler wraps all responses in the standard format:

```typescript
{
  success: false,
  message: "Human-readable message",
  errors: ["field: detail"]  // optional, for validation
}
```

Success responses:
```typescript
{
  success: true,
  message: "Operation description",
  data: T,
  pagination: { page, limit, total, totalPages }  // optional
}
```

---

## 14. Phase Plan

### Phase 1: Foundation (Steps 1-7 from original spec)
- Project initialization (package.json, wrangler.toml, tsconfig)
- Environment configuration (Zod-validated bindings)
- Prisma schema for D1/SQLite
- Hono app with all middleware
- Core utilities (response, pagination, JWT, password, slug, orderNumber, cache, price, email, storage, audit)
- Security middleware (auth, requireRole, validate, rateLimit)
- Auth module (all 11 routes)

### Phase 2: Catalog & Inventory (this prompt)
- Categories module (nested tree, CRUD, image upload, caching)
- Brands module (CRUD with logo upload)
- Products module (full CRUD, filtering, search, images, variants, stock)
- File upload utility (Cloudinary + R2)
- Inventory module (stock report, low stock alerts, logs)

### Phase 3: Orders, Payments, CMS (future)
- Orders, coupons, payments (Khalti, eSewa, COD)
- Banners, popups, blog, gallery
- Reviews, wishlist, cart, notifications
- Newsletter, site settings

All routes marked "Admin" require ADMIN or SUPER_ADMIN role. The `requireRole` middleware accepts an array of allowed roles, e.g., `requireRole(['ADMIN', 'SUPER_ADMIN'])`.

---

## 15. Non-Goals (YAGNI)

- Admin dashboard UI (separate project)
- WebSocket/real-time features
- Full-text search engine (Meilisearch/Algolia) — LIKE queries suffice for MVP
- Image CDN transformation beyond Cloudinary
- Multi-tenancy
- Internationalization (Nepal market only for MVP)
- Order management beyond basic CRUD
- Payment integration (Phase 3)
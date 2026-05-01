# GLAMO Nepal Cloudflare Workers Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing Express/PostgreSQL backend with a Hono.js/Cloudflare Workers/D1/R2/KV backend, completing Phase 1 (Foundation) and Phase 2 (Catalog & Inventory).

**Architecture:** Hono.js on Cloudflare Workers, D1 (SQLite) via Prisma adapter, KV for caching/rate-limiting, R2 for file storage, Resend for email, jose for JWT RS256, bcryptjs for passwords. Service/Repository layered pattern.

**Tech Stack:** Hono, @cloudflare/workers-types, @prisma/adapter-d1, wrangler, @aws-sdk/client-s3 (R2), zod, jose, bcryptjs, typescript

---

## File Structure

```
backend/
├── prisma/
│   └── schema.prisma
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── 0002_seed_data.sql
├── src/
│   ├── index.ts
│   ├── config/
│   │   └── env.ts
│   ├── types/
│   │   └── bindings.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── requireRole.ts
│   │   ├── validate.ts
│   │   └── rateLimit.ts
│   ├── utils/
│   │   ├── response.ts
│   │   ├── pagination.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── slug.ts
│   │   ├── orderNumber.ts
│   │   ├── cache.ts
│   │   ├── price.ts
│   │   ├── email.ts
│   │   ├── storage.ts
│   │   ├── upload.ts
│   │   └── audit.ts
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

## Task 1: Project Initialization

**Files:**
- Replace: `backend/package.json`
- Replace: `backend/tsconfig.json`
- Create: `backend/wrangler.toml`
- Create: `backend/.dev.vars.example`
- Replace: `backend/.gitignore`

- [ ] **Step 1: Delete existing backend files and create fresh package.json**

Delete all files in `backend/` except `.env.example`. Create new `package.json`:

```json
{
  "name": "glamo-nepal-backend",
  "version": "1.0.0",
  "private": true,
  "description": "GLAMO Nepal - Beauty Ecommerce API on Cloudflare Workers",
  "main": "src/index.ts",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "db:migrate:local": "wrangler d1 migrations apply glamo-nepal-db --local",
    "db:migrate:prod": "wrangler d1 migrations apply glamo-nepal-db --remote",
    "db:seed:local": "wrangler d1 execute glamo-nepal-db --local --file=migrations/0002_seed_data.sql",
    "db:seed:prod": "wrangler d1 execute glamo-nepal-db --remote --file=migrations/0002_seed_data.sql",
    "prisma:generate": "prisma generate",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.700.0",
    "@prisma/adapter-d1": "^6.6.0",
    "@prisma/client": "^6.6.0",
    "bcryptjs": "^3.0.3",
    "hono": "^4.7.0",
    "jose": "^6.0.0",
    "zod": "^3.24.3"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20250109.0",
    "@types/bcryptjs": "^2.4.6",
    "prisma": "^6.6.0",
    "typescript": "^5.8.3",
    "wrangler": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create wrangler.toml**

```toml
name = "glamo-nepal-api"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "glamo-nepal-db"
database_id = "placeholder-replace-after-creating-database"

[[kv_namespaces]]
binding = "KV"
id = "placeholder-replace-after-creating-namespace"

[[r2_buckets]]
binding = "R2"
bucket_name = "glamo-nepal-assets"

[vars]
FRONTEND_URL = "http://localhost:3000"
FREE_SHIPPING_THRESHOLD = "2500"
COD_FEE = "50"
ADMIN_EMAIL = "admin@glamonepal.com"
```

- [ ] **Step 4: Create .dev.vars.example**

```
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
R2_PUBLIC_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
KHALTI_SECRET_KEY=
ESEWA_SECRET_KEY=
ESEWA_MERCHANT_CODE=
```

- [ ] **Step 5: Update .gitignore**

```
node_modules/
dist/
.env
.dev.vars
*.log
.wrangler/
.DS_Store
*.pem
```

- [ ] **Step 6: Install dependencies**

Run: `cd backend && npm install`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: initialize Cloudflare Workers project with Hono.js"
```

---

## Task 2: Types & Configuration

**Files:**
- Create: `src/types/bindings.ts`
- Create: `src/config/env.ts`

- [ ] **Step 1: Create CloudflareBindings type**

Create `src/types/bindings.ts`:

```typescript
export interface CloudflareBindings {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
  JWT_PRIVATE_KEY: string
  JWT_PUBLIC_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  RESEND_API_KEY: string
  R2_PUBLIC_URL: string
  CLOUDINARY_CLOUD_NAME: string
  CLOUDINARY_API_KEY: string
  CLOUDINARY_API_SECRET: string
  KHALTI_SECRET_KEY: string
  ESEWA_SECRET_KEY: string
  ESEWA_MERCHANT_CODE: string
  FRONTEND_URL: string
  FREE_SHIPPING_THRESHOLD: string
  COD_FEE: string
  ADMIN_EMAIL: string
}

export type AppEnv = {
  Bindings: CloudflareBindings
  Variables: {
    user: {
      id: string
      email: string
      role: string
      isActive: boolean
    }
  }
}
```

- [ ] **Step 2: Create env.ts with Zod validation**

Create `src/config/env.ts`:

```typescript
import { z } from 'zod'

const envSchema = z.object({
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  RESEND_API_KEY: z.string().optional().default(''),
  R2_PUBLIC_URL: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  KHALTI_SECRET_KEY: z.string().optional().default(''),
  ESEWA_SECRET_KEY: z.string().optional().default(''),
  ESEWA_MERCHANT_CODE: z.string().optional().default(''),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  FREE_SHIPPING_THRESHOLD: z.string().default('2500'),
  COD_FEE: z.string().default('50'),
  ADMIN_EMAIL: z.string().default('admin@glamonepal.com'),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(env: Record<string, unknown>): Env {
  return envSchema.parse(env)
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add CloudflareBindings type and Zod env validation"
```

---

## Task 3: Prisma Schema for D1/SQLite

**Files:**
- Replace: `prisma/schema.prisma`

- [ ] **Step 1: Create SQLite-compatible Prisma schema**

Replace `prisma/schema.prisma` with the full SQLite-adapted schema. All UUIDs as TEXT, prices as INT, enums as TEXT, arrays as TEXT, booleans as INT, dates as TEXT.

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  phone         String?
  passwordHash  String?  @map("password_hash")
  firstName     String?  @map("first_name")
  lastName      String?  @map("last_name")
  avatarUrl     String?  @map("avatar_url")
  role          String   @default("CUSTOMER")
  isActive      Int      @default(1) @map("is_active")
  emailVerified Int      @default(0) @map("email_verified")
  phoneVerified Int      @default(0) @map("phone_verified")
  googleId      String?  @unique @map("google_id")
  createdAt     String   @default("now()") @map("created_at")
  updatedAt     String   @updatedAt @map("updated_at")
  deletedAt     String?  @map("deleted_at")

  addresses          UserAddress[]
  emailVerifications EmailVerification[]
  passwordResets     PasswordReset[]
  orders             Order[]
  reviews            Review[]
  wishlistItems      WishlistItem[]
  cartItems          CartItem[]
  notifications      Notification[]
  refreshTokens      RefreshToken[]

  @@index([email])
  @@index([googleId])
  @@map("users")
}

model UserAddress {
  id         String  @id @default(uuid())
  userId     String  @map("user_id")
  label      String?
  fullName   String  @map("full_name")
  phone      String
  address1   String  @map("address_1")
  address2   String? @map("address_2")
  city       String
  district   String?
  province   String?
  postalCode String? @map("postal_code")
  country    String  @default("Nepal")
  isDefault  Int     @default(0) @map("is_default")
  createdAt  String  @default("now()") @map("created_at")
  updatedAt  String  @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_addresses")
}

model EmailVerification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt String   @map("expires_at")
  usedAt    String?  @map("used_at")
  createdAt String   @default("now()") @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@map("email_verifications")
}

model PasswordReset {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt String   @map("expires_at")
  usedAt    String?  @map("used_at")
  createdAt String   @default("now()") @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@map("password_resets")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  userAgent String?  @map("user_agent")
  ipAddress String?  @map("ip_address")
  expiresAt String   @map("expires_at")
  revokedAt String?  @map("revoked_at")
  createdAt String   @default("now()") @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@map("refresh_tokens")
}

model Category {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  imageUrl    String?   @map("image_url")
  parentId    String?   @map("parent_id")
  sortOrder   Int       @default(0) @map("sort_order")
  isActive    Int       @default(1) @map("is_active")
  createdAt   String    @default("now()") @map("created_at")
  updatedAt   String    @updatedAt @map("updated_at")
  deletedAt   String?   @map("deleted_at")

  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]

  @@index([slug])
  @@index([parentId])
  @@map("categories")
}

model Brand {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  logoUrl     String?  @map("logo_url")
  website     String?
  isActive    Int      @default(1) @map("is_active")
  createdAt   String   @default("now()") @map("created_at")
  updatedAt   String   @updatedAt @map("updated_at")
  deletedAt   String?  @map("deleted_at")

  products Product[]

  @@index([slug])
  @@map("brands")
}

model Product {
  id               String   @id @default(uuid())
  name             String
  slug             String   @unique
  description      String?
  shortDescription String?  @map("short_description")
  sku              String?  @unique
  categoryId       String   @map("category_id")
  brandId          String?  @map("brand_id")
  basePrice       Int      @map("base_price")
  salePrice        Int?     @map("sale_price")
  costPrice        Int?     @map("cost_price")
  currency         String   @default("NPR")
  isActive         Int      @default(1) @map("is_active")
  isFeatured       Int      @default(0) @map("is_featured")
  isDigital        Int      @default(0) @map("is_digital")
  trackInventory   Int      @default(1) @map("track_inventory")
  stockQuantity    Int      @default(0) @map("stock_quantity")
  lowStockThreshold Int    @default(5) @map("low_stock_threshold")
  weight           Int?
  dimensions       String?
  metaTitle        String?  @map("meta_title")
  metaDescription  String? @map("meta_description")
  tags             String?
  searchVector     String? @map("search_vector")
  createdAt        String   @default("now()") @map("created_at")
  updatedAt        String   @updatedAt @map("updated_at")
  deletedAt        String?  @map("deleted_at")

  category      Category        @relation(fields: [categoryId], references: [id])
  brand         Brand?          @relation(fields: [brandId], references: [id])
  variants     ProductVariant[]
  images       ProductImage[]
  inventoryLogs InventoryLog[]
  orderItems   OrderItem[]
  reviews      Review[]
  wishlistItems WishlistItem[]
  cartItems    CartItem[]

  @@index([slug])
  @@index([categoryId])
  @@index([brandId])
  @@index([isActive])
  @@index([isFeatured])
  @@map("products")
}

model ProductVariant {
  id            String   @id @default(uuid())
  productId     String   @map("product_id")
  name          String
  sku           String?  @unique
  price         Int
  salePrice     Int?     @map("sale_price")
  stockQuantity Int      @default(0) @map("stock_quantity")
  attributes   String?
  isActive     Int      @default(1) @map("is_active")
  createdAt    String   @default("now()") @map("created_at")
  updatedAt    String   @updatedAt @map("updated_at")
  deletedAt    String?  @map("deleted_at")

  product    Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItems OrderItem[]

  @@index([productId])
  @@map("product_variants")
}

model ProductImage {
  id        String  @id @default(uuid())
  productId String  @map("product_id")
  url       String
  publicId  String? @map("public_id")
  altText   String? @map("alt_text")
  sortOrder Int     @default(0) @map("sort_order")
  isPrimary Int     @default(0) @map("is_primary")
  createdAt String  @default("now()") @map("created_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@map("product_images")
}

model InventoryLog {
  id            String  @id @default(uuid())
  productId     String  @map("product_id")
  variantId     String? @map("variant_id")
  changeType    String  @map("change_type")
  quantity      Int
  previousStock Int     @map("previous_stock")
  newStock      Int     @map("new_stock")
  reason        String?
  performedBy   String? @map("performed_by")
  createdAt     String  @default("now()") @map("created_at")

  product Product @relation(fields: [productId], references: [id])

  @@index([productId])
  @@index([changeType])
  @@index([createdAt])
  @@map("inventory_logs")
}

model Coupon {
  id             String  @id @default(uuid())
  code           String  @unique
  description    String?
  type           String
  value          Int
  minOrderAmount Int?    @map("min_order_amount")
  maxDiscount    Int?    @map("max_discount")
  usageLimit     Int?    @map("usage_limit")
  usageCount     Int     @default(0) @map("usage_count")
  perUserLimit   Int?    @map("per_user_limit")
  startsAt       String  @map("starts_at")
  expiresAt      String  @map("expires_at")
  isActive       Int     @default(1) @map("is_active")
  createdAt      String  @default("now()") @map("created_at")
  updatedAt      String  @updatedAt @map("updated_at")

  orders Order[]

  @@index([code])
  @@index([isActive])
  @@map("coupons")
}

model Order {
  id              String  @id @default(uuid())
  orderNumber     String  @unique @map("order_number")
  userId          String  @map("user_id")
  status          String  @default("PENDING")
  paymentStatus   String  @default("PENDING") @map("payment_status")
  paymentMethod   String  @map("payment_method")
  paymentId       String? @map("payment_id")
  subtotal        Int
  shippingCharge  Int     @default(0) @map("shipping_charge")
  discountAmount  Int     @default(0) @map("discount_amount")
  totalAmount     Int     @map("total_amount")
  couponId        String? @map("coupon_id")
  shippingAddress String  @map("shipping_address")
  billingAddress  String? @map("billing_address")
  notes           String?
  cancelledAt     String? @map("cancelled_at")
  cancelReason    String? @map("cancel_reason")
  createdAt       String  @default("now()") @map("created_at")
  updatedAt       String  @updatedAt @map("updated_at")

  user          User               @relation(fields: [userId], references: [id])
  coupon        Coupon?            @relation(fields: [couponId], references: [id])
  items         OrderItem[]
  statusHistory OrderStatusHistory[]

  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@index([paymentStatus])
  @@index([createdAt])
  @@map("orders")
}

model OrderItem {
  id          String  @id @default(uuid())
  orderId     String  @map("order_id")
  productId   String  @map("product_id")
  variantId   String? @map("variant_id")
  productName String  @map("product_name")
  variantName String? @map("variant_name")
  sku         String?
  quantity    Int
  unitPrice   Int     @map("unit_price")
  totalPrice  Int     @map("total_price")
  imageUrl    String? @map("image_url")
  createdAt   String  @default("now()") @map("created_at")

  order   Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product        @relation(fields: [productId], references: [id])
  variant ProductVariant? @relation(fields: [variantId], references: [id])

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

model OrderStatusHistory {
  id        String  @id @default(uuid())
  orderId   String  @map("order_id")
  status    String
  comment   String?
  changedBy String? @map("changed_by")
  createdAt String  @default("now()") @map("created_at")

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("order_status_histories")
}

model Review {
  id         String  @id @default(uuid())
  userId     String  @map("user_id")
  productId  String  @map("product_id")
  rating     Int
  title      String?
  comment    String?
  isApproved Int     @default(0) @map("is_approved")
  createdAt  String  @default("now()") @map("created_at")
  updatedAt  String  @updatedAt @map("updated_at")
  deletedAt  String? @map("deleted_at")

  user    User    @relation(fields: [userId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@unique([userId, productId])
  @@index([productId])
  @@index([userId])
  @@index([isApproved])
  @@map("reviews")
}

model WishlistItem {
  id        String @id @default(uuid())
  userId    String @map("user_id")
  productId String @map("product_id")
  createdAt String @default("now()") @map("created_at")

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@index([userId])
  @@map("wishlist_items")
}

model CartItem {
  id        String @id @default(uuid())
  userId    String @map("user_id")
  productId String @map("product_id")
  variantId String? @map("variant_id")
  quantity  Int     @default(1)
  createdAt String @default("now()") @map("created_at")
  updatedAt String @updatedAt @map("updated_at")

  user    User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  variant ProductVariant? @relation(fields: [variantId], references: [id], onDelete: Cascade)

  @@unique([userId, productId, variantId])
  @@index([userId])
  @@map("cart_items")
}

model Banner {
  id        String  @id @default(uuid())
  title     String
  subtitle  String?
  imageUrl  String  @map("image_url")
  linkUrl   String? @map("link_url")
  position  String  @default("HERO")
  sortOrder Int     @default(0) @map("sort_order")
  isActive  Int     @default(1) @map("is_active")
  startsAt  String? @map("starts_at")
  expiresAt String? @map("expires_at")
  createdAt String  @default("now()") @map("created_at")
  updatedAt String  @updatedAt @map("updated_at")

  @@index([position])
  @@index([isActive])
  @@map("banners")
}

model Popup {
  id        String  @id @default(uuid())
  title     String
  content   String
  imageUrl  String? @map("image_url")
  linkUrl   String? @map("link_url")
  trigger   String  @default("ON_LOAD")
  delayMs   Int     @default(0) @map("delay_ms")
  isActive  Int     @default(1) @map("is_active")
  startsAt  String? @map("starts_at")
  expiresAt String? @map("expires_at")
  createdAt String  @default("now()") @map("created_at")
  updatedAt String  @updatedAt @map("updated_at")

  @@index([isActive])
  @@map("popups")
}

model Blog {
  id              String  @id @default(uuid())
  title           String
  slug            String  @unique
  excerpt         String?
  content         String
  coverImageUrl   String? @map("cover_image_url")
  metaTitle       String? @map("meta_title")
  metaDescription String? @map("meta_description")
  tags            String?
  isPublished     Int     @default(0) @map("is_published")
  publishedAt     String? @map("published_at")
  authorId        String? @map("author_id")
  createdAt       String  @default("now()") @map("created_at")
  updatedAt       String  @updatedAt @map("updated_at")
  deletedAt       String? @map("deleted_at")

  @@index([slug])
  @@index([isPublished])
  @@index([publishedAt])
  @@map("blogs")
}

model GalleryItem {
  id          String  @id @default(uuid())
  title       String
  description String?
  imageUrl    String  @map("image_url")
  category    String?
  sortOrder   Int     @default(0) @map("sort_order")
  isActive    Int     @default(1) @map("is_active")
  createdAt   String  @default("now()") @map("created_at")
  updatedAt   String  @updatedAt @map("updated_at")

  @@index([category])
  @@map("gallery_items")
}

model TeamMember {
  id        String  @id @default(uuid())
  name      String
  role      String
  bio       String?
  imageUrl  String? @map("image_url")
  sortOrder Int     @default(0) @map("sort_order")
  isActive  Int     @default(1) @map("is_active")
  createdAt String  @default("now()") @map("created_at")
  updatedAt String  @updatedAt @map("updated_at")

  @@map("team_members")
}

model NewsletterSubscriber {
  id        String @id @default(uuid())
  email     String @unique
  isActive  Int    @default(1) @map("is_active")
  createdAt String @default("now()") @map("created_at")
  updatedAt String @updatedAt @map("updated_at")

  @@index([email])
  @@map("newsletter_subscribers")
}

model Notification {
  id        String  @id @default(uuid())
  userId    String? @map("user_id")
  type      String
  title     String
  message   String
  data      String?
  isRead    Int     @default(0) @map("is_read")
  createdAt String  @default("now()") @map("created_at")

  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

model SiteSetting {
  id    String @id @default(uuid())
  key   String @unique
  value String
  group String @default("general")

  @@index([group])
  @@map("site_settings")
}

model AuditLog {
  id        String  @id @default(uuid())
  userId    String? @map("user_id")
  action    String
  entity    String
  entityId  String? @map("entity_id")
  changes   String?
  ipAddress String? @map("ip_address")
  userAgent String? @map("user_agent")
  createdAt String  @default("now()") @map("created_at")

  @@index([entity, entityId])
  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

- [ ] **Step 2: Generate Prisma client**

Run: `cd backend && npx prisma generate`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add SQLite-compatible Prisma schema for D1"
```

---

## Task 4: SQL Migrations

**Files:**
- Create: `migrations/0001_initial_schema.sql`
- Create: `migrations/0002_seed_data.sql`

- [ ] **Step 1: Create initial schema migration**

Create `migrations/0001_initial_schema.sql` with all CREATE TABLE and CREATE INDEX statements for SQLite, including `PRAGMA foreign_keys = ON;` at top. All UUIDs as TEXT, prices as INTEGER, booleans as INTEGER, dates as TEXT, JSON fields as TEXT.

- [ ] **Step 2: Create seed data migration**

Create `migrations/0002_seed_data.sql` with INSERT statements for: 1 super admin (bcryptjs-hashed password), 8 categories, 6 brands, 20 products with paisa prices, default site settings, 2 hero banners, 1 welcome popup, 3 team members.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add D1 SQL migrations for initial schema and seed data"
```

---

## Task 5: Core Utilities

**Files:**
- Create: `src/utils/response.ts`
- Create: `src/utils/pagination.ts`
- Create: `src/utils/jwt.ts`
- Create: `src/utils/password.ts`
- Create: `src/utils/slug.ts`
- Create: `src/utils/orderNumber.ts`
- Create: `src/utils/cache.ts`
- Create: `src/utils/price.ts`
- Create: `src/utils/email.ts`
- Create: `src/utils/storage.ts`
- Create: `src/utils/upload.ts`
- Create: `src/utils/audit.ts`

- [ ] **Step 1: Create response.ts** — Standardized JSON response helpers for Hono context with success(), error(), paginated() functions matching `{ success, message, data, pagination, errors }` shape.

- [ ] **Step 2: Create pagination.ts** — Parse page/limit from Hono query params, return skip/take for D1 queries, buildPaginationResult helper.

- [ ] **Step 3: Create jwt.ts** — Using `jose` library: generateAccessToken (RS256, 15min), generateRefreshToken (RS256, 7d), verifyToken, setAuthCookies, clearAuthCookies. Import private/public keys from env bindings.

- [ ] **Step 4: Create password.ts** — bcryptjs hash and compare functions for edge runtime.

- [ ] **Step 5: Create slug.ts** — slugify and generateUniqueSlug functions (pure JS, no external deps).

- [ ] **Step 6: Create orderNumber.ts** — Generate GLM-YYYY-XXXXXX format using D1 COUNT query for sequence.

- [ ] **Step 7: Create cache.ts** — KV wrapper: get, set, delete, with JSON serialization/deserialization. TTL constants: BANNERS=600, CATEGORIES=1800, SETTINGS=1800, POPUP=600, PRODUCT=300, PRODUCT_LIST=300, BRANDS=1800.

- [ ] **Step 8: Create price.ts** — toStoredPrice(npr * 100), toDisplayPrice(stored / 100), formatNPR(stored) returning "NPR X,XXX".

- [ ] **Step 9: Create email.ts** — Resend API integration via fetch. Six template functions returning HTML strings: verifyEmail, passwordReset, orderConfirmation, orderStatusUpdate, welcome, lowStockAlert. sendEmail function that calls Resend API.

- [ ] **Step 10: Create storage.ts** — R2 upload wrapper: uploadFile(bucket, key, file, contentType), deleteFile(bucket, key), getPublicUrl(key) returning CDN URL.

- [ ] **Step 11: Create upload.ts** — Cloudinary upload via fetch API: uploadImageToCloudinary(file, folder, options) returning { url, publicId }, deleteFromCloudinary(publicId). Validate file type (jpeg/png/webp) and size (5MB max).

- [ ] **Step 12: Create audit.ts** — createAuditLog function that inserts into audit_logs table. Async, never throws (catches and logs errors).

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add all core utilities for Cloudflare Workers"
```

---

## Task 6: Middleware

**Files:**
- Create: `src/middleware/auth.ts`
- Create: `src/middleware/requireRole.ts`
- Create: `src/middleware/validate.ts`
- Create: `src/middleware/rateLimit.ts`

- [ ] **Step 1: Create auth.ts** — Hono middleware: extract JWT from `__Host-access_token` cookie or Authorization header, verify with jose, query D1 to confirm user exists and isActive, set `c.set('user', user)` for downstream. Return 401 if invalid.

- [ ] **Step 2: Create requireRole.ts** — Hono middleware: check `c.get('user').role` against allowed roles array. Return 403 if insufficient. Usage: `requireRole(['ADMIN', 'SUPER_ADMIN'])`.

- [ ] **Step 3: Create validate.ts** — Hono zValidator wrapper that validates body, query, or params using Zod schemas. Returns validated data or 400 with validation errors.

- [ ] **Step 4: Create rateLimit.ts** — KV-based rate limiting: store `ratelimit:{key}:{route}` with TTL. Check count, increment, return 429 if exceeded. Rate limit configs: auth (5/15min per IP), passwordReset (3/hr per email), coupon (10/min per IP), payment (5/min per user), general (100/min per IP).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add auth, role, validation, and rate limit middleware"
```

---

## Task 7: Hono App Entry Point

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create the main Hono app**

Create `src/index.ts` with:
- Import Hono and all middleware
- Define `const app = new Hono<AppEnv>()`
- Apply global middleware: CORS (allow FRONTEND_URL origin, credentials), logger, secure headers
- Apply custom error handler wrapping all errors in standard response format
- Mount all route groups under `/api/v1`
- Health check route at `/api/v1/health`
- 404 handler
- Export `export default app`

- [ ] **Step 2: Verify `wrangler dev` starts**

Run: `cd backend && npx wrangler dev --local` (should start without errors, health check should respond)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Hono app entry point with all middleware"
```

---

## Task 8: Auth Module

**Files:**
- Create: `src/modules/auth/auth.schema.ts`
- Create: `src/modules/auth/auth.service.ts`
- Create: `src/modules/auth/auth.controller.ts`
- Create: `src/modules/auth/auth.routes.ts`

- [ ] **Step 1: Create auth.schema.ts** — Zod schemas for: registerSchema (name, email, phone Nepal format, password min 8 with uppercase+number, confirmPassword), loginSchema (email, password, rememberMe), forgotPasswordSchema (email), resetPasswordSchema (token, password, confirmPassword), changePasswordSchema (currentPassword, newPassword, confirmPassword).

- [ ] **Step 2: Create auth.service.ts** — All auth business logic: register (hash password, create user, generate email verification token, send email), login (verify password, generate tokens, set cookies), logout (clear cookies, revoke refresh token), refreshToken (verify, rotate, set new cookie), verifyEmail (find token, mark verified), forgotPassword (generate reset token, send email), resetPassword (verify token, hash new password), changePassword (verify current, hash new), googleOAuth (redirect URL generation, callback handling with code exchange and user upsert), getMe (return current user from DB).

- [ ] **Step 3: Create auth.controller.ts** — Route handlers that call service methods and return responses using the response utility. Each handler extracts validated input, calls service, returns ApiResponse.

- [ ] **Step 4: Create auth.routes.ts** — Hono route group `/api/v1/auth` with all 11 routes. Apply rate limiting to login/register and forgot-password routes. Apply auth middleware to /me and /change-password routes.

- [ ] **Step 5: Register auth routes in index.ts**

- [ ] **Step 6: Test auth endpoints locally**

Run: `npx wrangler dev --local` and verify register/login/token endpoints work.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add complete auth module with all 11 routes"
```

---

## Task 9: Categories Module

**Files:**
- Create: `src/modules/categories/category.schema.ts`
- Create: `src/modules/categories/category.service.ts`
- Create: `src/modules/categories/category.controller.ts`
- Create: `src/modules/categories/category.routes.ts`

- [ ] **Step 1: Create category.schema.ts** — Zod schemas: createCategorySchema (name, description?, parentId?, imageUrl?, sortOrder?), updateCategorySchema (partial), slugParamSchema.

- [ ] **Step 2: Create category.service.ts** — getCategoryTree (query all active categories, build nested tree in app code, cache in KV 30min), getCategoryBySlug (with children and product count), createCategory (generate slug, upload image to Cloudinary if provided, invalidate KV cache, audit log), updateCategory (regenerate slug if name changes, update image, invalidate cache, audit), deleteCategory (check no products, check no children, soft delete, invalidate cache).

- [ ] **Step 3: Create category.controller.ts** — Handlers for all 6 category endpoints.

- [ ] **Step 4: Create category.routes.ts** — Hono route group with public GET routes and admin-protected mutation routes.

- [ ] **Step 5: Register category routes in index.ts**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add categories module with nested tree, CRUD, caching"
```

---

## Task 10: Brands Module

**Files:**
- Create: `src/modules/brands/brand.schema.ts`
- Create: `src/modules/brands/brand.service.ts`
- Create: `src/modules/brands/brand.controller.ts`
- Create: `src/modules/brands/brand.routes.ts`

- [ ] **Step 1: Create brand.schema.ts** — Zod schemas: createBrandSchema (name, description?, logoUrl?, website?), updateBrandSchema (partial), slugParamSchema.

- [ ] **Step 2: Create brand.service.ts** — getAllBrands (cached 30min), getBrandBySlug (with product count), createBrand (generate slug, upload logo to Cloudinary, invalidate cache, audit), updateBrand, deleteBrand (soft delete, invalidate cache).

- [ ] **Step 3: Create brand.controller.ts** — Handlers for all 5 brand endpoints.

- [ ] **Step 4: Create brand.routes.ts** — Hono route group with public GET and admin mutation routes.

- [ ] **Step 5: Register brand routes in index.ts**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add brands module with CRUD and logo upload"
```

---

## Task 11: Products Module

**Files:**
- Create: `src/modules/products/product.schema.ts`
- Create: `src/modules/products/product.service.ts`
- Create: `src/modules/products/product.controller.ts`
- Create: `src/modules/products/product.routes.ts`

- [ ] **Step 1: Create product.schema.ts** — Zod schemas: createProductSchema (name, description?, shortDescription?, sku?, categoryId, brandId?, basePrice as NPR converted to paisa internally, salePrice?, costPrice?, isActive?, isFeatured?, isDigital?, trackInventory?, stockQuantity?, lowStockThreshold?, weight?, dimensions?, metaTitle?, metaDescription?, tags as comma-separated string converted to JSON array), updateProductSchema (partial), productFilterSchema (all filter query params), imageUploadSchema, variantSchema.

- [ ] **Step 2: Create product.service.ts** — getProducts (build WHERE clause from filters, parameterized queries, KV caching with deterministic key from sorted params), getProductBySlug (include images, variants, category, brand, approved reviews with rating summary), createProduct (generate slug with collision handling, create with optional initial variant, bust cache), updateProduct (partial update, bust product+list caches, audit), toggleHidden, toggleFeatured, uploadProductImages (upload to Cloudinary, create ProductImage records, first=primary), deleteProductImage (delete from Cloudinary, delete DB record, reassign primary), variant CRUD, adjustStock (D1 transaction: get current stock, validate not negative, update, create InventoryLog, check threshold alert).

- [ ] **Step 3: Create product.controller.ts** — Handlers for all 15 product endpoints.

- [ ] **Step 4: Create product.routes.ts** — Hono route group with public GET routes and admin-protected mutation routes. Image upload routes use multipart/form-data parsing.

- [ ] **Step 5: Register product routes in index.ts**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add products module with filtering, search, images, variants"
```

---

## Task 12: Inventory Module

**Files:**
- Create: `src/modules/inventory/inventory.schema.ts`
- Create: `src/modules/inventory/inventory.service.ts`
- Create: `src/modules/inventory/inventory.controller.ts`
- Create: `src/modules/inventory/inventory.routes.ts`

- [ ] **Step 1: Create inventory.schema.ts** — Zod schemas: stockAdjustSchema (change quantity, reason?), inventoryLogFilterSchema (productId?, variantId?, changeType?, dateFrom?, dateTo?, page?, limit?).

- [ ] **Step 2: Create inventory.service.ts** — getStockReport (all products with total stock across variants, categorize in/low/out of stock, calculate stock value as costPrice×stockQuantity, group by category, NOT cached), getLowStockAlerts (products where any variant stock <= threshold, order by urgency), getInventoryLogs (paginated, filterable).

- [ ] **Step 3: Create inventory.controller.ts** — Handlers for all 3 inventory endpoints.

- [ ] **Step 4: Create inventory.routes.ts** — Hono route group, all admin-protected.

- [ ] **Step 5: Register inventory routes in index.ts**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add inventory module with stock reports and low-stock alerts"
```

---

## Task 13: Final Integration & Verification

**Files:**
- Update: `src/index.ts` (ensure all routes registered)
- Create: `DEPLOYMENT.md`
- Create: `PRODUCTION_CHECKLIST.md`

- [ ] **Step 1: Verify all routes are registered in index.ts**

Ensure all module routes are mounted: auth, categories, brands, products, inventory.

- [ ] **Step 2: Run TypeScript type check**

Run: `cd backend && npx tsc --noEmit` — fix any errors.

- [ ] **Step 3: Create DEPLOYMENT.md** — Step-by-step Cloudflare deployment instructions: create D1 database, run migrations, create KV namespace, create R2 bucket, set secrets, deploy with wrangler.

- [ ] **Step 4: Create PRODUCTION_CHECKLIST.md** — Generate RSA keys, set all wrangler secrets, create D1 database, run migrations, create KV namespace, create R2 bucket with public access, configure custom domain, set FRONTEND_URL, test payment flows, verify email delivery.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1+2 backend with deployment docs"
```
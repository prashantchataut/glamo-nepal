# Production-Ready Backend — Phase 2: Shared Utilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create all shared utility modules under `supabase/functions/_shared/` that every Edge Function will depend on — auth, CORS, response helpers, validation, types, and email.

**Architecture:** Supabase Edge Functions run on Deno. Each function imports shared utilities via relative paths from `_shared/`. Hono runs inside each Edge Function for routing. Supabase clients are created per-request using the user's JWT (for RLS-enforced queries) or the service role key (for admin operations). All npm packages are imported from `https://esm.sh/`.

**Tech Stack:** Deno runtime, Hono, Zod, @supabase/supabase-js, Resend API, TypeScript

**Prerequisite:** Phase 1 (database migration `0004_foundation.sql`) is complete.

---

## File Structure

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/types.ts` | Shared TypeScript types — database entities, API request/response, role enum |
| `supabase/functions/_shared/cors.ts` | CORS headers helper for Edge Functions |
| `supabase/functions/_shared/response.ts` | API response helpers — success, error, paginated, validationError |
| `supabase/functions/_shared/auth.ts` | Supabase Auth helpers — JWT verification, role checking, client creation, middleware |
| `supabase/functions/_shared/validation.ts` | Zod schemas for all entities + validation middleware |
| `supabase/functions/_shared/email.ts` | Resend API helper — sendEmail, email config, error handling, base template |

---

### Task 1: Create `types.ts` — Shared TypeScript Types

**Files:**
- Create: `supabase/functions/_shared/types.ts`

This is the foundation file — all other shared modules import from it. It defines TypeScript types matching the database schema and API contracts.

- [ ] **Step 1: Create the types file**

```typescript
// supabase/functions/_shared/types.ts

// ============================================
// ROLE ENUM
// ============================================

export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  CUSTOMER: 0,
  STAFF: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

// ============================================
// DATABASE ENTITY TYPES
// ============================================

export interface Profile {
  id: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string;
  phone: string;
  address_1: string;
  address_2: string | null;
  city: string;
  district: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  sku: string | null;
  category_id: string;
  brand_id: string | null;
  base_price: number;
  sale_price: number | null;
  cost_price: number | null;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  is_digital: boolean;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  weight: number | null;
  dimensions: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  search_vector: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  attributes: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  public_id: string | null;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductTag {
  id: string;
  product_id: string;
  tag: string;
  created_at: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  variant_id: string | null;
  change_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  min_order_amount: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number | null;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_id: string | null;
  subtotal: number;
  shipping_charge: number;
  discount_amount: number;
  total_amount: number;
  coupon_id: string | null;
  shipping_address: Record<string, unknown>;
  billing_address: Record<string, unknown> | null;
  notes: string | null;
  idempotency_key: string | null;
  shipping_phone: string | null;
  billing_phone: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string | null;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  comment: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  provider: 'KHALTI' | 'ESEWA' | 'COD';
  provider_transaction_id: string | null;
  idempotency_key: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
  provider_payload: Record<string, unknown> | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductReviewsMedia {
  id: string;
  review_id: string;
  url: string;
  public_id: string | null;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: 'HERO' | 'MID_PAGE' | 'SIDEBAR' | 'POPUP';
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Popup {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  trigger_type: 'ON_LOAD' | 'EXIT_INTENT' | 'SCROLL_50' | 'TIME_DELAY';
  delay_ms: number;
  cookie_days: number | null;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  view_count: number;
  read_time_minutes: number | null;
  is_published: boolean;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: 'instagram' | 'store' | 'products' | 'team' | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  unsubscribe_token: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  group_name: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface LowStockAlert {
  id: string;
  product_id: string;
  variant_id: string | null;
  email: string;
  phone: string | null;
  notified_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Event {
  id: number;
  user_id: string | null;
  session_id: string;
  event_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserProductAffinity {
  id: string;
  user_id: string | null;
  session_id: string;
  product_id: string;
  score: number;
  last_viewed_at: string | null;
  updated_at: string;
}

// ============================================
// STRING ENUMS
// ============================================

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'KHALTI' | 'ESEWA' | 'BANK_TRANSFER';
export type PaymentProvider = 'KHALTI' | 'ESEWA' | 'COD';
export type PaymentTransactionStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
export type BannerPosition = 'HERO' | 'MID_PAGE' | 'SIDEBAR' | 'POPUP';
export type PopupTriggerType = 'ON_LOAD' | 'EXIT_INTENT' | 'SCROLL_50' | 'TIME_DELAY';
export type GalleryCategory = 'instagram' | 'store' | 'products' | 'team';
export type CouponType = 'PERCENTAGE' | 'FIXED';
export type EventType = 'product_view' | 'add_to_cart' | 'wishlist_toggle' | 'purchase_success' | 'page_view' | 'search' | 'share';

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedResponse<T> {
  success: true;
  message: string;
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  pagination: null;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
}

// ============================================
// EDGE FUNCTION ENVIRONMENT
// ============================================

export interface EdgeFunctionEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  FRONTEND_URL?: string;
  KHALTI_SECRET_KEY?: string;
  ESEWA_SECRET_KEY?: string;
  ESEWA_MERCHANT_CODE?: string;
}

// ============================================
// HONO APP ENVIRONMENT TYPE
// ============================================

export type AppEnv = {
  Bindings: EdgeFunctionEnv;
  Variables: {
    user: AuthenticatedUser;
    validatedBody: unknown;
    validatedQuery: unknown;
    validatedParams: unknown;
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/types.ts
git commit -m "feat(shared): add TypeScript types for all database entities and API contracts"
```

---

### Task 2: Create `cors.ts` — CORS Headers Helper

**Files:**
- Create: `supabase/functions/_shared/cors.ts`

- [ ] **Step 1: Create the CORS helper**

```typescript
// supabase/functions/_shared/cors.ts

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://glamonepal.com',
  'https://www.glamonepal.com',
];

const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With, X-Idempotency-Key';
const EXPOSED_HEADERS = 'X-Total-Count';
const MAX_AGE = '86400';

export function corsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Expose-Headers': EXPOSED_HEADERS,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': MAX_AGE,
  };
}

export function handleCorsPreflightRequest(request: Request): Response {
  const origin = request.headers.get('Origin') || undefined;
  const headers = corsHeaders(origin);
  return new Response(null, { status: 204, headers });
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/cors.ts
git commit -m "feat(shared): add CORS headers helper for Edge Functions"
```

---

### Task 3: Create `response.ts` — API Response Helpers

**Files:**
- Create: `supabase/functions/_shared/response.ts`

These helpers standardize all API responses. They return `Response` objects directly (no Hono `Context` dependency) so they work in any Deno Edge Function context, including Hono routes.

- [ ] **Step 1: Create the response helpers**

```typescript
// supabase/functions/_shared/response.ts

import { corsHeaders } from './cors.ts';
import type { ErrorResponse, PaginatedResponse, SuccessResponse } from './types.ts';

export function success<T>(data: T, status = 200, message = 'Success'): Response {
  const origin: string | undefined = undefined;
  const headers = corsHeaders(origin);
  const body: SuccessResponse<T> = {
    success: true,
    message,
    data,
    pagination: null,
  };
  return Response.json(body, { status, headers });
}

export function error(message: string, status = 500, errors: string[] = []): Response {
  const headers = corsHeaders(undefined);
  const body: ErrorResponse = {
    success: false,
    message,
    errors,
  };
  return Response.json(body, { status, headers });
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
  message = 'Success'
): Response {
  const headers = corsHeaders(undefined);
  const totalPages = Math.ceil(total / perPage);
  const body: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
    },
  };
  return Response.json(body, { status: 200, headers });
}

export function validationError(zodError: { errors: { path: (string | number)[]; message: string }[] }): Response {
  const formattedErrors = zodError.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return error('Validation failed', 400, formattedErrors);
}

export function notFound(entity: string): Response {
  return error(`${entity} not found`, 404);
}

export function unauthorized(message = 'Unauthorized'): Response {
  return error(message, 401);
}

export function forbidden(message = 'Forbidden: insufficient permissions'): Response {
  return error(message, 403);
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/response.ts
git commit -m "feat(shared): add API response helpers — success, error, paginated, validationError"
```

---

### Task 4: Create `auth.ts` — Supabase Auth Helpers

**Files:**
- Create: `supabase/functions/_shared/auth.ts`

This is the most critical shared module. It provides JWT verification, Supabase client creation (user-scoped and admin), role checking, and Hono middleware for auth gating.

- [ ] **Step 1: Create the auth helpers**

```typescript
// supabase/functions/_shared/auth.ts

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Context, Next } from 'https://esm.sh/hono@4';
import type { AppEnv, AuthenticatedUser, Role, ROLE_HIERARCHY } from './types.ts';
import { ROLES } from './types.ts';
import { unauthorized, forbidden } from './response.ts';

// ============================================
// SUPABASE CLIENT CREATION
// ============================================

export function createSupabaseClient(url: string, anonKey: string, token: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseAdminClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================
// JWT EXTRACTION & VERIFICATION
// ============================================

export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export function extractTokenFromCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)__Host-access_token=([^;]+)/);
  return match?.[1] ?? null;
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  const fromAuth = extractTokenFromHeader(authHeader);
  if (fromAuth) return fromAuth;

  const cookieHeader = request.headers.get('Cookie');
  return extractTokenFromCookie(cookieHeader);
}

// ============================================
// USER VERIFICATION
// ============================================

export async function verifyUser(
  supabaseUrl: string,
  supabaseAnonKey: string,
  token: string
): Promise<AuthenticatedUser | null> {
  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_active) return null;

  return {
    id: profile.id,
    email: user.email ?? '',
    role: profile.role as Role,
    isActive: profile.is_active,
  };
}

// ============================================
// ROLE CHECKING
// ============================================

export function hasRole(user: AuthenticatedUser, minimumRole: Role): boolean {
  const hierarchy: Record<Role, number> = {
    CUSTOMER: 0,
    STAFF: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  };
  return (hierarchy[user.role] ?? -1) >= (hierarchy[minimumRole] ?? 0);
}

export function isStaff(user: AuthenticatedUser): boolean {
  return hasRole(user, ROLES.STAFF);
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return hasRole(user, ROLES.ADMIN);
}

export function isSuperAdmin(user: AuthenticatedUser): boolean {
  return hasRole(user, ROLES.SUPER_ADMIN);
}

// ============================================
// HONO MIDDLEWARE
// ============================================

export function requireAuth() {
  return async (c: Context<AppEnv>, next: Next) => {
    const token = extractToken(c.req.raw);
    if (!token) {
      return unauthorized('No token provided');
    }

    const supabaseUrl = c.env.SUPABASE_URL;
    const supabaseAnonKey = c.env.SUPABASE_ANON_KEY;
    const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);

    if (!user) {
      return unauthorized('Invalid or expired token');
    }

    c.set('user', user);
    await next();
  };
}

export function requireRole(minimumRole: Role) {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return unauthorized('Authentication required');
    }

    if (!hasRole(user, minimumRole)) {
      return forbidden(`Requires ${minimumRole} role or higher`);
    }

    await next();
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/auth.ts
git commit -m "feat(shared): add auth helpers — JWT verification, Supabase client creation, role middleware"
```

---

### Task 5: Create `validation.ts` — Zod Schemas & Validation Middleware

**Files:**
- Create: `supabase/functions/_shared/validation.ts`

This consolidates all Zod schemas from the existing backend modules into a single shared file, plus provides Hono middleware for request validation. Schemas are migrated from the Cloudflare Workers backend to Deno-compatible imports.

- [ ] **Step 1: Create the validation module**

```typescript
// supabase/functions/_shared/validation.ts

import { z } from 'https://esm.sh/zod@3';
import type { Context, Next } from 'https://esm.sh/hono@4';
import type { AppEnv } from './types.ts';
import { validationError } from './response.ts';

// ============================================
// COMMON SCHEMAS
// ============================================

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
});

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const productFilterSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  tags: z.string().optional(),
  inStock: z.string().optional().transform((v) => v === 'true' || v === '1'),
  featured: z.string().optional().transform((v) => v === 'true' || v === '1'),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'best-seller', 'most-reviewed', 'rating']).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
});

const tagsTransform = z.union([
  z.array(z.string()),
  z.string().transform((v: string) => v.split(',').map((t: string) => t.trim()).filter(Boolean)),
]);

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().optional(),
  categoryId: z.string().min(1),
  brandId: z.string().optional(),
  basePrice: z.number().positive(),
  salePrice: z.number().positive().optional(),
  costPrice: z.number().nonnegative().optional(),
  currency: z.string().default('NPR'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  stockQuantity: z.number().int().default(0),
  lowStockThreshold: z.number().int().default(5),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  tags: tagsTransform.optional().default([]),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  brandId: z.string().nullable().optional(),
  basePrice: z.number().positive().optional(),
  salePrice: z.number().positive().nullable().optional(),
  costPrice: z.number().nonnegative().nullable().optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isDigital: z.boolean().optional(),
  trackInventory: z.boolean().optional(),
  stockQuantity: z.number().int().optional(),
  lowStockThreshold: z.number().int().optional(),
  weight: z.number().positive().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  metaTitle: z.string().max(255).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  tags: tagsTransform.optional(),
});

const attributesTransform = z.union([
  z.record(z.string(), z.string()),
  z.string().transform((v: string) => JSON.parse(v)),
]);

export const variantSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().optional(),
  price: z.number().positive(),
  salePrice: z.number().positive().optional(),
  stockQuantity: z.number().int().default(0),
  attributes: attributesTransform.optional().default({}),
});

export const updateVariantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sku: z.string().optional(),
  price: z.number().positive().optional(),
  salePrice: z.number().positive().nullable().optional(),
  stockQuantity: z.number().int().optional(),
  attributes: attributesTransform.optional(),
  isActive: z.boolean().optional(),
});

export const stockAdjustSchema = z.object({
  change: z.number().int(),
  reason: z.string().max(500).optional(),
});

// ============================================
// CATEGORY SCHEMAS
// ============================================

export const categoryFilterSchema = z.object({
  parentId: z.string().uuid().optional().nullable(),
  isActive: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

export const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// BRAND SCHEMAS
// ============================================

export const brandFilterSchema = z.object({
  isActive: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  description: z.string().optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
  website: z.string().url('Invalid URL').optional(),
});

export const updateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name cannot be empty').optional(),
  description: z.string().nullable().optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
  website: z.string().url('Invalid URL').nullable().optional(),
});

// ============================================
// CART SCHEMAS
// ============================================

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});

// ============================================
// WISHLIST SCHEMAS
// ============================================

export const addToWishlistSchema = z.object({
  productId: z.string().uuid(),
});

// ============================================
// ORDER SCHEMAS
// ============================================

const addressSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  address1: z.string().min(1).max(200).optional(),
  addressLine1: z.string().min(1).max(200).optional(),
  address2: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  ward: z.string().max(20).optional(),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().default('Nepal'),
  landmark: z.string().max(120).optional(),
}).refine((value) => Boolean(value.address1 || value.addressLine1), 'Address line is required');

const customerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20),
});

const orderItemSchema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(99),
  selectedShade: z.string().max(80).optional(),
  product: z.object({
    id: z.string().optional(),
    sku: z.string().optional(),
    slug: z.string().optional(),
    name: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    image: z.string().optional(),
    price: z.coerce.number().nonnegative().optional(),
    originalPrice: z.coerce.number().nonnegative().optional(),
  }).passthrough().optional(),
}).refine((value) => Boolean(value.productId || value.product?.id || value.product?.sku || value.product?.slug), 'Product identifier is required');

export const createOrderSchema = z.object({
  customer: customerSchema.optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'KHALTI', 'ESEWA', 'BANK_TRANSFER', 'COD', 'khalti', 'esewa', 'card', 'cards', 'Cash on Delivery', 'Khalti', 'eSewa', 'Cards']),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  orderNotes: z.string().max(500).optional(),
  giftWrap: z.boolean().optional(),
  deliveryFee: z.coerce.number().nonnegative().optional(),
  subtotal: z.coerce.number().nonnegative().optional(),
  grandTotal: z.coerce.number().nonnegative().optional(),
  currency: z.literal('NPR').optional(),
  items: z.array(orderItemSchema).min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  comment: z.string().max(500).optional(),
});

export const orderFilterSchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  paymentMethod: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// COUPON SCHEMAS
// ============================================

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.string(),
  expiresAt: z.string(),
});

export const updateCouponSchema = z.object({
  code: z.string().min(3).max(50).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  value: z.number().positive().optional(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string(),
  cartTotal: z.number().nonnegative(),
});

export const couponFilterSchema = z.object({
  isActive: z.string().optional().transform((v) => v === 'true'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// REVIEW SCHEMAS
// ============================================

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

export const reviewFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  isApproved: z.string().optional().transform((v) => v === 'true'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// BANNER SCHEMAS
// ============================================

export const createBannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.enum(['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP']).default('HERO'),
  sortOrder: z.number().int().default(0),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const updateBannerSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(300).optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  position: z.enum(['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP']).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  })),
});

export const bannerFilterSchema = z.object({
  position: z.enum(['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// BLOG SCHEMAS
// ============================================

export const createBlogPostSchema = z.object({
  title: z.string().min(1).max(500),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  category: z.string().max(100).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  tags: z.union([
    z.array(z.string()),
    z.string().transform((v) => v.split(',').map((t) => t.trim()).filter(Boolean)),
  ]).optional(),
});

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  category: z.string().max(100).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  tags: z.union([
    z.array(z.string()),
    z.string().transform((v) => v.split(',').map((t) => t.trim()).filter(Boolean)),
  ]).optional(),
  isPublished: z.boolean().optional(),
});

export const blogFilterSchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// ADMIN SCHEMAS
// ============================================

export const salesReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN']),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const auditLogFilterSchema = z.object({
  entity: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const userFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN']).optional(),
  isActive: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const notificationFilterSchema = z.object({
  isRead: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// SETTINGS SCHEMAS
// ============================================

export const updateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.any(),
  })),
});

// ============================================
// ADDRESS SCHEMAS
// ============================================

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().default('Nepal'),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  address1: z.string().min(1).max(200).optional(),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  district: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// ============================================
// NEWSLETTER SCHEMAS
// ============================================

export const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ============================================
// EVENT SCHEMAS
// ============================================

export const trackEventSchema = z.object({
  eventType: z.enum(['product_view', 'add_to_cart', 'wishlist_toggle', 'purchase_success', 'page_view', 'search', 'share']),
  entityId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const trackEventsBatchSchema = z.object({
  events: z.array(trackEventSchema).min(1).max(100),
});

// ============================================
// VALIDATION MIDDLEWARE (HONO)
// ============================================

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (c: Context<AppEnv>, next: Next) => {
    const body = await c.req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return c.json(
        validationErrorBody(result.error),
        { status: 400 }
      );
    }
    c.set('validatedBody', result.data);
    await next();
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (c: Context<AppEnv>, next: Next) => {
    const query = c.req.query();
    const result = schema.safeParse(query);
    if (!result.success) {
      return c.json(
        validationErrorBody(result.error),
        { status: 400 }
      );
    }
    c.set('validatedQuery', result.data);
    await next();
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return async (c: Context<AppEnv>, next: Next) => {
    const params = c.req.param();
    const result = schema.safeParse(params);
    if (!result.success) {
      return c.json(
        validationErrorBody(result.error),
        { status: 400 }
      );
    }
    c.set('validatedParams', result.data);
    await next();
  };
}

function validationErrorBody(error: z.ZodError): { success: false; message: string; errors: string[] } {
  const formattedErrors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/validation.ts
git commit -m "feat(shared): add Zod schemas for all entities and Hono validation middleware"
```

---

### Task 6: Create `email.ts` — Resend API Helper

**Files:**
- Create: `supabase/functions/_shared/email.ts`

This module provides the `sendEmail` function and email templates migrated from the existing Cloudflare Workers backend. It uses the Resend API directly via `fetch` (no npm dependency needed).

- [ ] **Step 1: Create the email helper**

```typescript
// supabase/functions/_shared/email.ts

// ============================================
// EMAIL CONFIGURATION
// ============================================

const EMAIL_FROM = 'GLAMO Nepal <noreply@glamonepal.com>';
const EMAIL_REPLY_TO = 'support@glamonepal.com';

// ============================================
// SEND EMAIL (Resend API)
// ============================================

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(
  options: SendEmailOptions,
  resendApiKey: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo ?? EMAIL_REPLY_TO,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Resend API error (${response.status}):`, errorBody);
      return { success: false, error: `Resend API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error sending email';
    console.error('Failed to send email:', message);
    return { success: false, error: message };
  }
}

// ============================================
// BASE EMAIL TEMPLATE
// ============================================

export function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GLAMO Nepal</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f5f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f5f3;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#c4a882,#a08060);padding:30px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px;">GLAMO NEPAL</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:#faf7f5;padding:20px 40px;text-align:center;font-size:12px;color:#999;">
              <p style="margin:0;">&copy; ${new Date().getFullYear()} GLAMO Nepal. All rights reserved.</p>
              <p style="margin:4px 0 0;">Kathmandu, Nepal</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

export function verifyEmailTemplate(name: string, url: string): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Welcome, ${name}!</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
      Thank you for joining GLAMO Nepal. Please verify your email address to get started.
    </p>
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#c4a882,#a08060);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
      Verify Email Address
    </a>
    <p style="margin:24px 0 0;color:#999;font-size:13px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `);
}

export function passwordResetTemplate(name: string, url: string): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Hi ${name},</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#c4a882,#a08060);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
      Reset Password
    </a>
    <p style="margin:24px 0 0;color:#999;font-size:13px;">
      If you didn't request this, your account is safe — you can ignore this email.
    </p>
  `);
}

export function orderConfirmationTemplate(order: {
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  shippingAddress: string;
}): string {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;">${item.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;text-align:right;">NPR ${item.price.toLocaleString()}</td>
      </tr>`
    )
    .join('');

  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Order Confirmed!</h2>
    <p style="margin:0 0 8px;color:#666;font-size:15px;">Order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
    <p style="margin:0 0 24px;color:#666;font-size:13px;">Shipping to: ${order.shippingAddress}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <thead>
        <tr>
          <th style="padding:10px 0;border-bottom:2px solid #c4a882;text-align:left;font-size:13px;color:#999;font-weight:600;">Item</th>
          <th style="padding:10px 0;border-bottom:2px solid #c4a882;text-align:center;font-size:13px;color:#999;font-weight:600;">Qty</th>
          <th style="padding:10px 0;border-bottom:2px solid #c4a882;text-align:right;font-size:13px;color:#999;font-weight:600;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p style="margin:0;font-size:18px;font-weight:700;color:#333;text-align:right;">Total: NPR ${order.total.toLocaleString()}</p>
  `);
}

export function orderStatusUpdateTemplate(
  order: { orderNumber: string; items: { name: string }[] },
  status: string
): string {
  const itemsList = order.items.map((i) => i.name).join(', ');
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Order Update</h2>
    <p style="margin:0 0 8px;color:#666;font-size:15px;">Your order <strong>#${order.orderNumber}</strong> status has been updated.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="padding:16px;background:#faf7f5;border-radius:8px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:1px;">Current Status</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#c4a882;">${status}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#666;font-size:14px;">Items: ${itemsList}</p>
  `);
}

export function orderCancelledTemplate(orderNumber: string, reason: string | null): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Order Cancelled</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
      Your order <strong>#${orderNumber}</strong> has been cancelled.
      ${reason ? `<br>Reason: ${reason}` : ''}
    </p>
    <p style="margin:0;color:#666;font-size:14px;">
      If you have any questions, please contact our support team.
    </p>
  `);
}

export function welcomeTemplate(name: string): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Welcome to GLAMO Nepal, ${name}!</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
      We're thrilled to have you join our community. Discover premium beauty products curated just for you.
    </p>
    <a href="https://glamonepal.com" style="display:inline-block;background:linear-gradient(135deg,#c4a882,#a08060);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
      Start Shopping
    </a>
  `);
}

export function lowStockAlertTemplate(
  products: { name: string; sku: string; stock: number }[]
): string {
  const rows = products
    .map(
      (p) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-size:14px;">${p.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;font-size:14px;">${p.sku}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#e74c3c;font-size:14px;font-weight:600;text-align:center;">${p.stock}</td>
      </tr>`
    )
    .join('');

  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#333;font-size:22px;">Low Stock Alert</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;">The following products are running low on inventory:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:left;font-size:13px;color:#999;font-weight:600;">Product</th>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:left;font-size:13px;color:#999;font-weight:600;">SKU</th>
          <th style="padding:10px 0;border-bottom:2px solid #e74c3c;text-align:center;font-size:13px;color:#999;font-weight:600;">Stock</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `);
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/email.ts
git commit -m "feat(shared): add Resend email helper and all email templates"
```

---

### Task 7: Verify All Shared Modules

- [ ] **Step 1: Verify file structure exists**

```bash
ls supabase/functions/_shared/
```

Expected output: `auth.ts  cors.ts  email.ts  response.ts  types.ts  validation.ts`

- [ ] **Step 2: Verify Deno imports resolve**

Open each file and confirm that:
- `types.ts` has zero external imports (pure TypeScript types)
- `cors.ts` has zero external imports (pure logic)
- `response.ts` imports only from `./cors.ts` and `./types.ts`
- `auth.ts` imports from `https://esm.sh/@supabase/supabase-js@2`, `https://esm.sh/hono@4`, `./types.ts`, `./response.ts`
- `validation.ts` imports from `https://esm.sh/zod@3`, `https://esm.sh/hono@4`, `./types.ts`, `./response.ts`
- `email.ts` has zero external imports (uses `fetch` directly)

- [ ] **Step 3: Verify type consistency**

Cross-check that:
- `AuthenticatedUser` in `types.ts` matches the shape set by `auth.ts` `verifyUser()` return
- `Role` type in `types.ts` matches the `ROLES` const values
- `ROLE_HIERARCHY` in `types.ts` matches the `hierarchy` object in `auth.ts` `hasRole()`
- All Zod schema types in `validation.ts` are compatible with their corresponding TypeScript types in `types.ts`
- `ErrorResponse`, `SuccessResponse`, `PaginatedResponse` in `types.ts` match the shapes produced by `response.ts` helpers
- `EdgeFunctionEnv` in `types.ts` includes all environment variables referenced by `auth.ts` and `email.ts`

- [ ] **Step 4: Verify no missing exports**

Check that every function/type/schema exported is usable from an Edge Function's relative import path:
- `import { requireAuth, requireRole, createSupabaseClient, createSupabaseAdminClient, extractToken, verifyUser, hasRole, isStaff, isAdmin, isSuperAdmin } from '../_shared/auth.ts'`
- `import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'`
- `import { success, error, paginated, validationError, notFound, unauthorized, forbidden } from '../_shared/response.ts'`
- `import { ...schemas..., validateBody, validateQuery, validateParams } from '../_shared/validation.ts'`
- `import { ...types... } from '../_shared/types.ts'`
- `import { sendEmail, baseTemplate, verifyEmailTemplate, passwordResetTemplate, orderConfirmationTemplate, orderStatusUpdateTemplate, orderCancelledTemplate, welcomeTemplate, lowStockAlertTemplate } from '../_shared/email.ts'`

- [ ] **Step 5: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix(shared): resolve any type inconsistencies found during verification"
```

---

This is Phase 2 of 6. Phases 3-6 (Core API modules, Payments, Emails, Verification) will be written as separate plan documents once this phase is complete and verified.

The remaining phases are documented in the spec at `docs/superpowers/specs/2026-05-03-production-backend-design.md` and will each get their own implementation plan.
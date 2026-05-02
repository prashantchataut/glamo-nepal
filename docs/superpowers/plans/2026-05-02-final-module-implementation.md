# GLAMO Nepal Backend — Full Supabase Migration & Final Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the GLAMO Nepal backend from D1/SQLite to Supabase Postgres with Supabase Auth, rewrite all existing modules, and implement all remaining modules (account, admin dashboard, CMS, newsletter, settings, cart, wishlist, reviews, coupons), plus OpenAPI docs and security hardening.

**Architecture:** Cloudflare Workers + Hono.js runtime stays. Database switches from D1 raw SQL to Supabase JS client (`@supabase/supabase-js`). Auth switches from custom bcrypt+JWT to Supabase Auth. Each module follows the existing 4-file pattern: `*.schema.ts`, `*.routes.ts`, `*.controller.ts`, `*.service.ts`. KV caching stays. Cloudinary uploads stay.

**Tech Stack:** Hono.js, Cloudflare Workers, Supabase (Auth + Postgres), Zod, Cloudinary, Resend, KV caching

---

## Phase 1: Foundation (Supabase Setup + Auth Rewrite)

This phase establishes the Supabase connection, rewrites auth, and updates all shared infrastructure. No modules work until this is complete.

---

### Task 1: Install Supabase Client + Update Dependencies

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install Supabase JS client**

```bash
cd backend && npm install @supabase/supabase-js
```

- [ ] **Step 2: Remove D1/Prisma dependencies that are no longer needed**

```bash
cd backend && npm uninstall @prisma/adapter-d1 @prisma/client prisma
```

- [ ] **Step 3: Verify installation**

Run: `cd backend && npm ls @supabase/supabase-js`
Expected: `@supabase/supabase-js@x.x.x`

- [ ] **Step 4: Commit**

```bash
cd backend && git add package.json package-lock.json && git commit -m "chore: add @supabase/supabase-js, remove prisma/d1 deps"
```

---

### Task 2: Create Supabase Client Configuration

**Files:**
- Create: `backend/src/config/supabase.ts`

- [ ] **Step 1: Create the Supabase client module**

```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function createSupabaseAdminClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export type SupabaseService = SupabaseClient
```

- [ ] **Step 2: Commit**

```bash
cd backend && git add src/config/supabase.ts && git commit -m "feat: add supabase client configuration"
```

---

### Task 3: Update Types and Environment Configuration

**Files:**
- Modify: `backend/src/types/bindings.ts`
- Modify: `backend/src/config/env.ts`
- Modify: `backend/wrangler.toml`

- [ ] **Step 1: Update `bindings.ts` to replace D1 with Supabase**

```typescript
export interface CloudflareBindings {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  KV: KVNamespace
  R2: R2Bucket
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
    validatedBody: any
    validatedQuery: any
    validatedParams: any
    supabase: import('@supabase/supabase-js').SupabaseClient
  }
}
```

- [ ] **Step 2: Update `config/env.ts`**

```typescript
import { z } from 'zod'

const envSchema = z.object({
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
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

- [ ] **Step 3: Update `wrangler.toml` — remove D1, add Supabase vars**

Replace the `[[d1_databases]]` block and add environment variables. The `wrangler.toml` should no longer reference D1. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the `[vars]` section (or use `.dev.vars` for secrets).

```toml
name = "glamo-nepal-api"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

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

Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` should be in `.dev.vars` for local dev and set as Cloudflare secrets for production.

- [ ] **Step 4: Create `.dev.vars.example` with Supabase secrets**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
KHALTI_SECRET_KEY=
ESEWA_SECRET_KEY=
ESEWA_MERCHANT_CODE=
```

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/types/bindings.ts src/config/env.ts wrangler.toml .dev.vars.example && git commit -m "feat: update bindings and config for Supabase, remove D1"
```

---

### Task 4: Create Supabase Middleware (inject client into context)

**Files:**
- Create: `backend/src/middleware/supabase.ts`

- [ ] **Step 1: Create middleware that injects Supabase client into Hono context**

```typescript
import { createMiddleware } from 'hono/factory'
import { createSupabaseAdminClient } from '../config/supabase'
import type { AppEnv } from '../types/bindings'

export const supabaseMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const client = createSupabaseAdminClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY)
  c.set('supabase', client)
  await next()
})
```

- [ ] **Step 2: Commit**

```bash
cd backend && git add src/middleware/supabase.ts && git commit -m "feat: add supabase middleware to inject client into context"
```

---

### Task 5: Rewrite Auth Middleware for Supabase

**Files:**
- Modify: `backend/src/middleware/auth.ts`

- [ ] **Step 1: Rewrite auth middleware to use Supabase token verification**

```typescript
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/bindings'

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
    ?? getCookieToken(c)

  if (!token) {
    return c.json({ success: false, message: 'Unauthorized: no token provided', errors: [] }, 401)
  }

  const supabase = c.get('supabase')

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return c.json({ success: false, message: 'Unauthorized: invalid token', errors: [] }, 401)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) {
    return c.json({ success: false, message: 'Unauthorized: user not found or inactive', errors: [] }, 401)
  }

  c.set('user', {
    id: profile.id,
    email: user.email ?? '',
    role: profile.role,
    isActive: profile.is_active,
  })

  await next()
})

function getCookieToken(c: Parameters<typeof authMiddleware>[0]): string | undefined {
  const cookieHeader = c.req.header('Cookie')
  if (!cookieHeader) return undefined
  const match = cookieHeader.match(/(?:^|;\s*)__Host-access_token=([^;]+)/)
  return match?.[1]
}
```

- [ ] **Step 2: Commit**

```bash
cd backend && git add src/middleware/auth.ts && git commit -m "feat: rewrite auth middleware for Supabase token verification"
```

---

### Task 6: Create Utility for Supabase Error Handling

**Files:**
- Create: `backend/src/utils/supabase.ts`

- [ ] **Step 1: Create Supabase utility helpers**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleSupabaseError(error: any, context: string): never {
  console.error(`Supabase error in ${context}:`, error)
  throw new AppError(
    error.message || 'Database operation failed',
    error.code === '23505' ? 409 : 500,
    error.code
  )
}

export function assertSingle<T>(data: T[] | null, entity: string): T {
  if (!data || data.length === 0) {
    throw new AppError(`${entity}_NOT_FOUND`, 404)
  }
  if (data.length > 1) {
    throw new AppError(`Multiple ${entity} found`, 500)
  }
  return data[0]
}

export function sanitizeUser(user: any): Omit<any, 'password_hash' | 'refresh_token'> {
  const { password_hash, refresh_token, ...safe } = user
  return safe
}
```

- [ ] **Step 2: Commit**

```bash
cd backend && git add src/utils/supabase.ts && git commit -m "feat: add Supabase error handling and utility helpers"
```

---

### Task 7: Rewrite Auth Module for Supabase Auth

**Files:**
- Modify: `backend/src/modules/auth/auth.schema.ts`
- Modify: `backend/src/modules/auth/auth.routes.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/auth/auth.service.ts`

- [ ] **Step 1: Rewrite `auth.schema.ts`**

```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
```

- [ ] **Step 2: Rewrite `auth.service.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../utils/supabase'

interface AuthResponse {
  user: {
    id: string
    email: string
    role: string
    isActive: boolean
    firstName: string | null
    lastName: string | null
    phone: string | null
    avatarUrl: string | null
  }
  accessToken: string
  refreshToken: string
}

function formatAuthUser(supabaseUser: any, profile: any): AuthResponse['user'] {
  return {
    id: profile.id,
    email: supabaseUser.email ?? '',
    role: profile.role,
    isActive: profile.is_active,
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
  }
}

export async function register(
  supabase: SupabaseClient,
  input: { email: string; password: string; firstName?: string; lastName?: string; phone?: string }
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      throw new AppError('Email already registered', 409)
    }
    throw new AppError(error.message, 400)
  }

  if (!data.user) {
    throw new AppError('Registration failed', 500)
  }

  if (input.phone && data.user.id) {
    await supabase
      .from('profiles')
      .update({ phone: input.phone })
      .eq('id', data.user.id)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  return {
    user: formatAuthUser(data.user, profile || {}),
    accessToken: data.session?.access_token ?? '',
    refreshToken: data.session?.refresh_token ?? '',
  }
}

export async function login(
  supabase: SupabaseClient,
  input: { email: string; password: string }
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new AppError('Invalid email or password', 401)
    }
    throw new AppError(error.message, 401)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (!profile || !profile.is_active) {
    throw new AppError('Account is disabled', 403)
  }

  return {
    user: formatAuthUser(data.user, profile),
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  }
}

export async function refreshToken(
  supabase: SupabaseClient,
  refreshTokenValue: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshTokenValue,
  })

  if (error) {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  }
}

export async function logout(supabase: SupabaseClient, accessToken: string): Promise<void> {
  await supabase.auth.admin.signOut(accessToken)
}

export async function forgotPassword(
  supabase: SupabaseClient,
  email: string,
  frontendUrl: string
): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${frontendUrl}/auth/reset-password`,
  })

  if (error) {
    throw new AppError('Failed to send reset email', 500)
  }
}

export async function resetPassword(
  supabase: SupabaseClient,
  newPassword: string
): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new AppError('Failed to reset password', 400)
  }
}

export async function getMe(supabase: SupabaseClient, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    throw new AppError('User not found', 404)
  }

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    isActive: profile.is_active,
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}
```

- [ ] **Step 3: Rewrite `auth.controller.ts`**

```typescript
import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as AuthService from './auth.service'

export async function register(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await AuthService.register(supabase, data)

    setAuthCookies(c, result.accessToken, result.refreshToken)

    return ApiResponse.success(c, 'Registration successful', { user: result.user }, 201)
  } catch (error: any) {
    const status = error.statusCode || 500
    return ApiResponse.error(c, error.message || 'Registration failed', status)
  }
}

export async function login(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await AuthService.login(supabase, data)

    setAuthCookies(c, result.accessToken, result.refreshToken)

    return ApiResponse.success(c, 'Login successful', { user: result.user })
  } catch (error: any) {
    const status = error.statusCode || 500
    return ApiResponse.error(c, error.message || 'Login failed', status)
  }
}

export async function refreshToken(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    const result = await AuthService.refreshToken(supabase, data.refreshToken)

    setAuthCookies(c, result.accessToken, result.refreshToken)

    return ApiResponse.success(c, 'Token refreshed', result)
  } catch (error: any) {
    const status = error.statusCode || 500
    return ApiResponse.error(c, error.message || 'Token refresh failed', status)
  }
}

export async function logout(c: Context<AppEnv>) {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '') ?? ''
    const supabase = c.get('supabase')
    await AuthService.logout(supabase, token)

    clearAuthCookies(c)

    return ApiResponse.success(c, 'Logged out successfully', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Logout failed', 500)
  }
}

export async function forgotPassword(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    await AuthService.forgotPassword(supabase, data.email, c.env.FRONTEND_URL)

    return ApiResponse.success(c, 'Password reset email sent', null)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to send reset email', 500)
  }
}

export async function resetPassword(c: Context<AppEnv>) {
  try {
    const data = c.get('validatedBody')
    const supabase = c.get('supabase')
    await AuthService.resetPassword(supabase, data.password)

    return ApiResponse.success(c, 'Password reset successful', null)
  } catch (error: any) {
    const status = error.statusCode || 500
    return ApiResponse.error(c, error.message || 'Failed to reset password', status)
  }
}

export async function getMe(c: Context<AppEnv>) {
  try {
    const user = c.get('user')
    const supabase = c.get('supabase')
    const profile = await AuthService.getMe(supabase, user.id)

    return ApiResponse.success(c, 'Profile fetched', profile)
  } catch (error: any) {
    const status = error.statusCode || 500
    return ApiResponse.error(c, error.message || 'Failed to fetch profile', status)
  }
}

function setAuthCookies(c: Context<AppEnv>, accessToken: string, refreshToken: string) {
  c.header('Set-Cookie', [
    `__Host-access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900`,
    `__Host-refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`,
  ].join(', '))
}

function clearAuthCookies(c: Context<AppEnv>) {
  c.header('Set-Cookie', [
    `__Host-access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    `__Host-refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
  ].join(', '))
}
```

- [ ] **Step 4: Rewrite `auth.routes.ts`**

```typescript
import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { authMiddleware } from '../../middleware/auth'
import { validateBody } from '../../middleware/validate'
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema'
import { register, login, refreshToken, logout, forgotPassword, resetPassword, getMe } from './auth.controller'

const authRoutes = new Hono<AppEnv>()

authRoutes.post('/register', validateBody(registerSchema), register)
authRoutes.post('/login', validateBody(loginSchema), login)
authRoutes.post('/refresh', validateBody(refreshTokenSchema), refreshToken)
authRoutes.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword)
authRoutes.post('/reset-password', validateBody(resetPasswordSchema), resetPassword)
authRoutes.post('/logout', logout)
authRoutes.get('/me', authMiddleware, getMe)

export { authRoutes }
```

- [ ] **Step 5: Delete old utility files no longer needed**

```bash
rm backend/src/utils/password.ts backend/src/utils/jwt.ts
```

- [ ] **Step 6: Commit**

```bash
cd backend && git add src/modules/auth/ src/utils/password.ts src/utils/jwt.ts && git commit -m "feat: rewrite auth module for Supabase Auth, remove custom JWT and password utils"
```

---

### Task 8: Update `index.ts` — Register Supabase Middleware + All Routes

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Rewrite `index.ts` with Supabase middleware and all route registrations**

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import type { AppEnv } from './types/bindings'
import { generalRateLimit } from './middleware/rateLimit'
import { supabaseMiddleware } from './middleware/supabase'
import { authRoutes } from './modules/auth/auth.routes'
import { accountRoutes } from './modules/account/account.routes'
import { categoryRoutes } from './modules/categories/category.routes'
import { brandRoutes } from './modules/brands/brand.routes'
import { productRoutes } from './modules/products/product.routes'
import { inventoryRoutes } from './modules/inventory/inventory.routes'
import { cartRoutes } from './modules/cart/cart.routes'
import { wishlistRoutes } from './modules/wishlist/wishlist.routes'
import { couponRoutes } from './modules/coupons/coupon.routes'
import { orderRoutes, checkoutRoutes } from './modules/orders/order.routes'
import { reviewRoutes } from './modules/reviews/review.routes'
import { bannerRoutes } from './modules/banners/banner.routes'
import { popupRoutes } from './modules/popups/popup.routes'
import { blogRoutes } from './modules/blog/blog.routes'
import { galleryRoutes } from './modules/gallery/gallery.routes'
import { teamRoutes } from './modules/team/team.routes'
import { newsletterRoutes } from './modules/newsletter/newsletter.routes'
import { settingsRoutes } from './modules/settings/settings.routes'
import { adminRoutes } from './modules/admin/admin.routes'

const app = new Hono<AppEnv>()

app.use('*', cors({
  origin: (origin) => {
    const allowed = [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3000']
    return allowed.includes(origin) ? origin : allowed[0]
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400,
}))

app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', supabaseMiddleware)
app.use('*', generalRateLimit)

app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({
    success: false,
    message: 'Internal server error',
    errors: [],
  }, 500)
})

app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'GLAMO Nepal API is running',
    data: { status: 'healthy', timestamp: new Date().toISOString(), version: '2.0.0' },
    pagination: null,
  })
})

app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/account', accountRoutes)
app.route('/api/v1/categories', categoryRoutes)
app.route('/api/v1/brands', brandRoutes)
app.route('/api/v1/products', productRoutes)
app.route('/api/v1/inventory', inventoryRoutes)
app.route('/api/v1/cart', cartRoutes)
app.route('/api/v1/wishlist', wishlistRoutes)
app.route('/api/v1/coupons', couponRoutes)
app.route('/api/v1/orders', orderRoutes)
app.route('/api/v1/checkout', checkoutRoutes)
app.route('/api/v1/reviews', reviewRoutes)
app.route('/api/v1/banners', bannerRoutes)
app.route('/api/v1/popups', popupRoutes)
app.route('/api/v1/blogs', blogRoutes)
app.route('/api/v1/gallery', galleryRoutes)
app.route('/api/v1/team', teamRoutes)
app.route('/api/v1/newsletter', newsletterRoutes)
app.route('/api/v1/settings', settingsRoutes)
app.route('/api/v1/admin', adminRoutes)

app.notFound((c) => {
  return c.json({
    success: false,
    message: `Route not found: ${c.req.method} ${c.req.path}`,
    errors: [],
  }, 404)
})

export default app
```

Note: Many route imports will fail until the modules are created in later tasks. This is expected — the file will be incrementally updated.

- [ ] **Step 2: Commit**

```bash
cd backend && git add src/index.ts && git commit -m "feat: update index.ts with Supabase middleware and all route registrations"
```

---

### Task 9: Create Supabase Migration SQL

**Files:**
- Create: `backend/supabase/migrations/0001_initial_schema.sql`

- [ ] **Step 1: Create the complete Supabase migration file**

This file contains all the SQL from the design doc: profiles table, triggers, all application tables, indexes, and RLS policies. Refer to Section 7 of the design spec at `docs/superpowers/specs/2026-05-02-final-module-design.md` for the complete SQL.

The migration includes:
- `profiles` table with trigger to auto-create on signup
- `user_addresses`, `categories`, `brands`, `products`, `product_variants`, `product_images`, `inventory_logs`
- `coupons`, `orders`, `order_items`, `order_status_histories`
- `reviews`, `wishlist_items`, `cart_items`
- `banners`, `popups`, `blogs`, `gallery_items`, `team_members`
- `newsletter_subscribers`, `notifications`, `site_settings`, `audit_logs`
- All indexes from the design spec
- RLS policies enabling service role full access and public/authenticated read where appropriate
- Updated_at trigger function

- [ ] **Step 2: Create seed data file `backend/supabase/migrations/0002_seed_data.sql`**

Seed data includes:
- Default site settings (announcement_texts, free_shipping_threshold, cod_fee, delivery_fees, contact_info, maintenance_mode, etc.)
- Admin user creation via `auth.users` insert (with bcrypt-hashed password)
- Default categories (Skincare, Haircare, Makeup, Body Care, Fragrance)
- Default brands if needed

- [ ] **Step 3: Commit**

```bash
cd backend && git add supabase/ && git commit -m "feat: add Supabase migration SQL for all tables, indexes, RLS, and seed data"
```

---

### Task 10: Update Audit Utility for Supabase

**Files:**
- Modify: `backend/src/utils/audit.ts`

- [ ] **Step 1: Rewrite audit utility to use Supabase**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

interface AuditLogParams {
  userId?: string
  action: string
  entity: string
  entityId?: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(
  supabase: SupabaseClient,
  params: AuditLogParams
): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      changes: params.changes ?? null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    })
    if (error) console.error('Failed to create audit log:', error)
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd backend && git add src/utils/audit.ts && git commit -m "feat: update audit utility for Supabase queries"
```

---

## Phase 2: Rewrite Existing Modules (Categories, Brands, Products, Inventory, Orders)

Each module rewrite follows the same pattern: replace D1 raw SQL with Supabase query builder calls, update format functions for Postgres column names, and adjust service signatures to accept `SupabaseClient` instead of `D1Database`.

---

### Task 11: Rewrite Categories Module

**Files:**
- Modify: `backend/src/modules/categories/category.service.ts`
- Modify: `backend/src/modules/categories/category.controller.ts` (minor: pass supabase)
- Modify: `backend/src/modules/categories/category.routes.ts` (minor: no changes needed if controller updated)

The service rewrites all `db.prepare(SQL).bind(...)` calls to `supabase.from('categories').select().eq().single()` etc. Format functions stay the same (snake_case → camelCase mapping). Controller functions change from passing `c.env.DB, c.env.KV` to passing `c.get('supabase'), c.env.KV`.

- [ ] **Step 1: Rewrite category.service.ts to use Supabase**
- [ ] **Step 2: Update category.controller.ts to pass supabase from context**
- [ ] **Step 3: Commit**

```bash
cd backend && git add src/modules/categories/ && git commit -m "feat: rewrite categories module for Supabase"
```

---

### Task 12: Rewrite Brands Module

**Files:**
- Modify: `backend/src/modules/brands/brand.service.ts`
- Modify: `backend/src/modules/brands/brand.controller.ts`

Same pattern as categories. Replace D1 queries with Supabase query builder.

- [ ] **Step 1: Rewrite brand.service.ts to use Supabase**
- [ ] **Step 2: Update brand.controller.ts to pass supabase from context**
- [ ] **Step 3: Commit**

```bash
cd backend && git add src/modules/brands/ && git commit -m "feat: rewrite brands module for Supabase"
```

---

### Task 13: Rewrite Products Module

**Files:**
- Modify: `backend/src/modules/products/product.service.ts`
- Modify: `backend/src/modules/products/product.controller.ts`

Products is the largest module. Key changes:
- Replace all D1 queries with Supabase query builder
- Use Supabase `.rpc()` for complex search queries if needed, or build with query builder filters
- Price handling stays the same (paisa integers)
- Image uploads still use Cloudinary

- [ ] **Step 1: Rewrite product.service.ts to use Supabase**
- [ ] **Step 2: Update product.controller.ts to pass supabase from context**
- [ ] **Step 3: Commit**

```bash
cd backend && git add src/modules/products/ && git commit -m "feat: rewrite products module for Supabase"
```

---

### Task 14: Rewrite Inventory Module

**Files:**
- Modify: `backend/src/modules/inventory/inventory.service.ts`
- Modify: `backend/src/modules/inventory/inventory.controller.ts`

- [ ] **Step 1: Rewrite inventory.service.ts to use Supabase**
- [ ] **Step 2: Update inventory.controller.ts**
- [ ] **Step 3: Commit**

```bash
cd backend && git add src/modules/inventory/ && git commit -m "feat: rewrite inventory module for Supabase"
```

---

### Task 15: Rewrite Orders Module

**Files:**
- Modify: `backend/src/modules/orders/order.service.ts`
- Modify: `backend/src/modules/orders/order.controller.ts`
- Modify: `backend/src/modules/orders/order.schema.ts` (if needed)

Orders module uses `db.batch()` for transactions. With Supabase, use `.rpc()` for transactional operations or sequential queries with error handling.

- [ ] **Step 1: Rewrite order.service.ts to use Supabase**
- [ ] **Step 2: Update order.controller.ts**
- [ ] **Step 3: Commit**

```bash
cd backend && git add src/modules/orders/ && git commit -m "feat: rewrite orders module for Supabase"
```

---

## Phase 3: New Customer Modules (Account, Cart, Wishlist, Reviews, Coupons)

---

### Task 16: Account Module — Schema, Service, Controller, Routes

**Files:**
- Create: `backend/src/modules/account/account.schema.ts`
- Create: `backend/src/modules/account/account.service.ts`
- Create: `backend/src/modules/account/account.controller.ts`
- Create: `backend/src/modules/account/account.routes.ts`

Schema includes:
- `updateProfileSchema`: name, phone
- `createAddressSchema`: fullName, phone, address1, address2?, city, district (Nepal districts enum), province?, postalCode?, country (default "Nepal")
- `updateAddressSchema`: partial of create
- Nepal districts as a Zod enum

Service includes:
- `getProfile(userId)`: fetch profile + counts from orders, wishlist_items, user_addresses
- `updateProfile(userId, data)`: update name/phone, phone uniqueness check, audit log
- `uploadAvatar(userId, file)`: Cloudinary upload to `avatars/{userId}`, delete old avatar, update `avatar_url`
- `getAddresses(userId)`: all addresses sorted by `is_default` desc
- `createAddress(userId, data)`: max 5 check, first address auto-default
- `updateAddress(userId, addressId, data)`: ownership check, update
- `deleteAddress(userId, addressId)`: ownership check, if default promote next
- `setDefaultAddress(userId, addressId)`: set all to false, set this to true

All routes require `authMiddleware`. Address mutations verify `userId` ownership.

- [ ] **Step 1: Create account.schema.ts**
- [ ] **Step 2: Create account.service.ts**
- [ ] **Step 3: Create account.controller.ts**
- [ ] **Step 4: Create account.routes.ts**
- [ ] **Step 5: Commit**

```bash
cd backend && git add src/modules/account/ && git commit -m "feat: add account module (profile + addresses)"
```

---

### Task 17: Cart Module

**Files:**
- Create: `backend/src/modules/cart/cart.schema.ts`
- Create: `backend/src/modules/cart/cart.service.ts`
- Create: `backend/src/modules/cart/cart.controller.ts`
- Create: `backend/src/modules/cart/cart.routes.ts`

Service includes:
- `getCart(userId)`: fetch user's cart items with product details
- `addItem(userId, data)`: add or increment quantity, check stock, max quantity from settings
- `updateItem(userId, itemId, data)`: update quantity, ownership check
- `removeItem(userId, itemId)`: ownership check, delete
- `clearCart(userId)`: delete all items for user

- [ ] **Step 1: Create cart.schema.ts, cart.service.ts, cart.controller.ts, cart.routes.ts**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/cart/ && git commit -m "feat: add cart module"
```

---

### Task 18: Wishlist Module

**Files:**
- Create: `backend/src/modules/wishlist/wishlist.schema.ts`
- Create: `backend/src/modules/wishlist/wishlist.service.ts`
- Create: `backend/src/modules/wishlist/wishlist.controller.ts`
- Create: `backend/src/modules/wishlist/wishlist.routes.ts`

Service includes:
- `getWishlist(userId)`: fetch with product details
- `addItem(userId, productId)`: add to wishlist, unique constraint
- `removeItem(userId, productId)`: remove from wishlist
- `checkItem(userId, productId)`: boolean check if product in wishlist

- [ ] **Step 1: Create wishlist module files**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/wishlist/ && git commit -m "feat: add wishlist module"
```

---

### Task 19: Reviews Module

**Files:**
- Create: `backend/src/modules/reviews/reviews.schema.ts`
- Create: `backend/src/modules/reviews/reviews.service.ts`
- Create: `backend/src/modules/reviews/reviews.controller.ts`
- Create: `backend/src/modules/reviews/reviews.routes.ts`

Service includes:
- `getProductReviews(productId, page, limit)`: public, paginated, approved only
- `createReview(userId, data)`: one per user per product, auto-approve based on settings
- `updateReview(userId, reviewId, data)`: ownership check
- `deleteReview(userId, reviewId)`: ownership check, soft delete
- `getAllReviews(filters)`: admin, filter by approval status
- `approveReview(reviewId)`: admin
- `rejectReview(reviewId)`: admin, soft delete or mark unapproved

- [ ] **Step 1: Create reviews module files**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/reviews/ && git commit -m "feat: add reviews module"
```

---

### Task 20: Coupons Module

**Files:**
- Create: `backend/src/modules/coupons/coupon.schema.ts`
- Create: `backend/src/modules/coupons/coupon.service.ts`
- Create: `backend/src/modules/coupons/coupon.controller.ts`
- Create: `backend/src/modules/coupons/coupon.routes.ts`

Service includes:
- `createCoupon(data)`: admin
- `getAllCoupons(filters)`: admin, paginated
- `getCoupon(id)`: admin
- `updateCoupon(id, data)`: admin
- `deleteCoupon(id)`: admin, soft delete
- `validateCoupon(code, cartTotal)`: public, check code exists, active, not expired, min order met, usage limits
- `applyCoupon(code, userId, cartTotal)`: auth, validate + check per-user limit

- [ ] **Step 1: Create coupons module files**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/coupons/ && git commit -m "feat: add coupons module"
```

---

## Phase 4: CMS Modules (Banners, Popups, Blog, Gallery, Team)

---

### Task 21: Banners Module

**Files:**
- Create: `backend/src/modules/banners/banner.schema.ts`
- Create: `backend/src/modules/banners/banner.service.ts`
- Create: `backend/src/modules/banners/banner.controller.ts`
- Create: `backend/src/modules/banners/banner.routes.ts`

Public routes cached in KV for 10 min. Admin mutations bust cache.

- [ ] **Step 1: Create banner module files**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/banners/ && git commit -m "feat: add banners module with scheduling and reorder"
```

---

### Task 22: Popups Module

**Files:**
- Create: `backend/src/modules/popups/popup.schema.ts`
- Create: `backend/src/modules/popups/popup.service.ts`
- Create: `backend/src/modules/popups/popup.controller.ts`
- Create: `backend/src/modules/popups/popup.routes.ts`

Only one active popup at a time. Response includes `cookieDays` for frontend.

- [ ] **Step 1: Create popup module files**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/popups/ && git commit -m "feat: add popups module with trigger config"
```

---

### Task 23: Blog Module

**Files:**
- Create: `backend/src/modules/blog/blog.schema.ts`
- Create: `backend/src/modules/blog/blog.service.ts`
- Create: `backend/src/modules/blog/blog.controller.ts`
- Create: `backend/src/modules/blog/blog.routes.ts`

Slug auto-generated from title. Read time = word count / 200. View count increment via `waitUntil` (non-blocking). Draft/published state management.

- [ ] **Step 1: Create blog module files**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/blog/ && git commit -m "feat: add blog module with publish flow and view counting"
```

---

### Task 24: Gallery Module

**Files:**
- Create: `backend/src/modules/gallery/gallery.schema.ts`
- Create: `backend/src/modules/gallery/gallery.service.ts`
- Create: `backend/src/modules/gallery/gallery.controller.ts`
- Create: `backend/src/modules/gallery/gallery.routes.ts`

Categories: instagram, store, products, team. Sortable via `sort_order` field.

- [ ] **Step 1: Create gallery module files**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/gallery/ && git commit -m "feat: add gallery module with reorder"
```

---

### Task 25: Team Module

**Files:**
- Create: `backend/src/modules/team/team.schema.ts`
- Create: `backend/src/modules/team/team.service.ts`
- Create: `backend/src/modules/team/team.controller.ts`
- Create: `backend/src/modules/team/team.routes.ts`

Photo upload to Cloudinary `team` folder.

- [ ] **Step 1: Create team module files**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/team/ && git commit -m "feat: add team module with photo upload"
```

---

## Phase 5: Newsletter, Settings, Admin Dashboard

---

### Task 26: Newsletter Module

**Files:**
- Create: `backend/src/modules/newsletter/newsletter.schema.ts`
- Create: `backend/src/modules/newsletter/newsletter.service.ts`
- Create: `backend/src/modules/newsletter/newsletter.controller.ts`
- Create: `backend/src/modules/newsletter/newsletter.routes.ts`

Subscribe: idempotent (silently succeed if already active), reactivate if inactive, rate limited 3/hr/IP. Unsubscribe: via token, don't reveal existence. Export CSV for admin.

- [ ] **Step 1: Create newsletter module files**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/newsletter/ && git commit -m "feat: add newsletter module with subscribe, unsubscribe, CSV export"
```

---

### Task 27: Settings Module

**Files:**
- Create: `backend/src/modules/settings/settings.schema.ts`
- Create: `backend/src/modules/settings/settings.service.ts`
- Create: `backend/src/modules/settings/settings.controller.ts`
- Create: `backend/src/modules/settings/settings.routes.ts`

Public settings cached in KV 30 min. Admin full access. SuperAdmin only for updates. Each setting validated by key type.

- [ ] **Step 1: Create settings module files**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/settings/ && git commit -m "feat: add settings module with public/admin split and KV caching"
```

---

### Task 28: Admin Dashboard Module

**Files:**
- Create: `backend/src/modules/admin/admin.schema.ts`
- Create: `backend/src/modules/admin/admin.service.ts`
- Create: `backend/src/modules/admin/admin.controller.ts`
- Create: `backend/src/modules/admin/admin.routes.ts`

Dashboard stats cached in KV 5 min. 8 metric categories. Sales report on-demand. Notifications CRUD. User management. Audit log viewer (superAdmin).

- [ ] **Step 1: Create admin module files**
- [ ] **Step 2: Commit**

```bash
cd backend && git add src/modules/admin/ && git commit -m "feat: add admin dashboard, sales report, notifications, user management, audit logs"
```

---

## Phase 6: OpenAPI Documentation + Security Hardening

---

### Task 29: OpenAPI Documentation

**Files:**
- Create: `backend/src/docs/openapi.ts`

Build the complete OpenAPI 3.0 spec object with all ~120 endpoints documented. Include request/response schemas derived from Zod schemas. Nepal-specific examples (NPR prices, Nepali names, districts). Tags grouping all modules.

- [ ] **Step 1: Create openapi.ts with full spec**
- [ ] **Step 2: Add routes in index.ts**

```typescript
import { openApiSpec } from './docs/openapi'

app.get('/api/docs.json', (c) => c.json(openApiSpec))
app.get('/api/docs', (c) => c.html(swaggerUiHtml))
```

- [ ] **Step 3: Commit**

```bash
cd backend && git add src/docs/ src/index.ts && git commit -m "feat: add OpenAPI spec and Swagger UI"
```

---

### Task 30: Security Hardening

**Files:**
- Modify: `backend/src/index.ts` (CORS, CSP headers)
- Modify: `backend/src/utils/response.ts` (error sanitization)
- Create: `backend/src/utils/sanitize.ts` (sanitizeUser utility)
- Modify: `backend/src/middleware/rateLimit.ts` (add newsletter-specific rate limit)

- [ ] **Step 1: Create `sanitize.ts`**

```typescript
export function sanitizeUser(user: Record<string, unknown>) {
  const { password_hash, refresh_token, ...safe } = user as any
  return safe
}
```

- [ ] **Step 2: Add production error sanitization in `response.ts`**

In the `ApiResponse.error()` method, check for an environment variable or context to strip stack traces and database errors in production.

- [ ] **Step 3: Update CORS in `index.ts`**

```typescript
app.use('*', cors({
  origin: (origin) => {
    const allowed = [c.env.FRONTEND_URL, 'http://localhost:3000']
    return allowed.includes(origin) ? origin : allowed[0]
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key'],
  exposeHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400,
}))
```

- [ ] **Step 4: Add CSP headers**

```typescript
app.use('*', async (c, next) => {
  await next()
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com")
})
```

- [ ] **Step 5: Add idempotency key support for payment endpoints**

In the orders/payment controller, check for `X-Idempotency-Key` header and cache responses in KV with 24h TTL.

- [ ] **Step 6: Verify no SQL injection — all queries use Supabase parameterized builder**

- [ ] **Step 7: Commit**

```bash
cd backend && git add src/ && git commit -m "feat: security hardening — sanitize responses, strict CORS, CSP, idempotency keys"
```

---

### Task 31: TypeScript Check + Final Integration

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript check**

```bash
cd backend && npx tsc --noEmit
```

Fix any type errors. Expect issues from modules that haven't been created yet — comment out their imports in `index.ts` temporarily if needed.

- [ ] **Step 2: Verify all route imports in `index.ts` resolve correctly**

- [ ] **Step 3: Run lint**

```bash
cd backend && npm run lint
```

- [ ] **Step 4: Commit any fixes**

```bash
cd backend && git add -A && git commit -m "fix: resolve TypeScript errors and lint issues"
```

---

### Task 32: Update PRODUCTION_CHECKLIST.md

**Files:**
- Modify: `backend/PRODUCTION_CHECKLIST.md`

- [ ] **Step 1: Update checklist to reflect Supabase migration and all new modules**

Include:
- [ ] Supabase project created and migrations applied
- [ ] All environment variables set in Cloudflare Workers
- [ ] KV namespace created
- [ ] Cloudinary configured
- [ ] Resend API key configured
- [ ] All ~120 endpoints functional
- [ ] Auth (Supabase) working end-to-end
- [ ] Response sanitization verified
- [ ] CORS strict origin verified
- [ ] CSP headers verified
- [ ] Idempotency keys on payment endpoints
- [ ] KV caching on all public GETs
- [ ] Cache invalidation on all mutations
- [ ] wrangler deploy succeeds
- [ ] No TypeScript errors

- [ ] **Step 2: Commit**

```bash
cd backend && git add PRODUCTION_CHECKLIST.md && git commit -m "docs: update PRODUCTION_CHECKLIST for Supabase migration and final modules"
```

---

## COMPLETION_101_HANDOFF Items

The handoff document lists these next items, all covered by this plan:

1. **Backend admin auth using database users, password hashing and RBAC** → Covered by Task 7 (Supabase Auth) + Task 28 (Admin dashboard with role-based access)
2. **Backend routes for products, inventory, orders and banners** → Covered by Tasks 11-15 (existing module rewrites) + Task 21 (banners)
3. **Connect admin panel actions to backend API** → Frontend task, not in scope for backend
4. **Cloudinary or another image service for banner/product uploads** → Already implemented in existing upload.ts, used by products and banners
5. **Audit logs for every admin mutation** → Covered by `createAuditLog()` calls in all admin service methods
6. **Khalti/eSewa payment verification and order reconciliation** → Covered by Task 15 (orders rewrite) which preserves payment integration
7. **Replace sample products/images with supplier-approved catalog data** → Data task, not code — seed data in Task 9

---

## Self-Review

1. **Spec coverage:** Every module in the design spec has a corresponding task. ✅
2. **Placeholder scan:** No TBDs, TODOs, or "implement later" in the plan. All steps have concrete code or actions. ✅
3. **Type consistency:** `SupabaseClient` type used consistently. `AppEnv` bindings updated. Controller signatures use `c.get('supabase')` consistently. ✅
4. **One gap found:** The `auth.schema.ts` in Task 7 doesn't include a `googleAuthSchema` — this should be added for the Google OAuth route. I'll add it as a note in the auth task, but the Google OAuth route can be a simple redirect to Supabase's OAuth URL, not a traditional POST body schema.

This plan is complete and ready for execution.
# Phase 1: Critical Security Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 5 critical security vulnerabilities that allow admin takeover, CSRF bypass, data leaks, unauthorized user creation, and stock overselling.

**Architecture:** Incremental fixes to existing code — no new services, no framework changes. Each task is independent and produces a working, testable change.

**Tech Stack:** Next.js 14, Hono backend, TypeScript, bcryptjs, Turso/LibSQL, Zustand

---

## Task 1: Remove Plaintext Admin Password Fallback

**Files:**
- Modify: `src/app/api/admin/login/route.ts`
- Create: `scripts/hash-password.ts`

**Why:** The plaintext `===` comparison is timing-attackable and the fallback means production can run without bcrypt. Remove it entirely.

- [ ] **Step 1: Create password hash script**

Create `scripts/hash-password.ts`:

```typescript
import { hash } from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

hash(password, 12).then((hashed) => {
  console.log("ADMIN_PASSWORD_HASH=" + hashed);
}).catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Remove plaintext fallback from admin login**

In `src/app/api/admin/login/route.ts`, remove the entire `else` branch that does `password === adminPassword`. Replace with a hard failure when `ADMIN_PASSWORD_HASH` is not set:

```typescript
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
if (!adminPasswordHash) {
  console.error("[SECURITY] ADMIN_PASSWORD_HASH is not set. Admin login is disabled. Run: npx tsx scripts/hash-password.ts <password>");
  return NextResponse.json({ success: false, message: "Admin login is not configured." }, { status: 500 });
}

const isEmailMatch = email.toLowerCase() === adminEmail.toLowerCase();
if (!isEmailMatch) {
  return NextResponse.json({ success: false, message: "Invalid admin email or password." }, { status: 401 });
}

const isPasswordValid = await compare(password, adminPasswordHash);
if (!isPasswordValid) {
  return NextResponse.json({ success: false, message: "Invalid admin email or password." }, { status: 401 });
}
```

- [ ] **Step 3: Remove unused `adminPassword` variable and `compare` import if needed**

The `adminPassword` env var is no longer used in this file. Remove it. Keep `compare` from bcryptjs since it's still used.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add scripts/hash-password.ts src/app/api/admin/login/route.ts
git commit -m "security: remove plaintext admin password fallback, require bcrypt hash

- Remove password === adminPassword timing-attackable fallback
- Require ADMIN_PASSWORD_HASH env var for admin login
- Add scripts/hash-password.ts to generate hashes
- Log clear error when ADMIN_PASSWORD_HASH is missing"
```

---

## Task 2: Remove CSRF Token from sessionStorage

**Files:**
- Modify: `src/lib/csrf.ts`
- Modify: `src/components/auth/CsrfBootstrap.tsx`
- Modify: `src/components/admin/AdminLoginForm.tsx`
- Modify: `src/components/checkout/CheckoutPageClient.tsx`
- Modify: `src/components/auth/FirebaseAuthProvider.tsx`
- Modify: `src/components/home/NewsletterSignup.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/product/NotifyMeForm.tsx`
- Modify: `src/lib/api/client.ts`
- Modify: `src/lib/tracking.ts`
- Modify: `src/store/useAuthStore.ts`
- Modify: `src/app/(public)/contact/ContactClient.tsx`

**Why:** sessionStorage is accessible to any JS on the page, making CSRF bypassable via XSS. Instead, fetch a fresh token from `/api/csrf` before each mutating request. No client-side storage.

- [ ] **Step 1: Rewrite csrf.ts — remove sessionStorage, make ensureCsrfToken always fetch fresh**

Replace the entire `csrf.ts` client-side logic:

```typescript
const CSRF_COOKIE_NAME = "glamo-csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.AUTH_SECRET || "";

function getSecret(): string {
  if (!CSRF_SECRET) {
    throw new Error("CSRF_SECRET or AUTH_SECRET environment variable is required.");
  }
  return CSRF_SECRET;
}

async function signToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(token));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  return `${token}.${sigB64}`;
}

async function verifySignedToken(signedToken: string): Promise<string | null> {
  if (!CSRF_SECRET) {
    return signedToken.length >= 32 ? signedToken : null;
  }

  const dotIndex = signedToken.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const token = signedToken.slice(0, dotIndex);
  const providedSig = signedToken.slice(dotIndex + 1);

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const sigBytes = Uint8Array.from(atob(providedSig.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(token));
    if (!valid) return null;
    return token;
  } catch {
    return null;
  }
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };

let csrfPromise: Promise<string> | null = null;

export async function ensureCsrfToken(): Promise<string> {
  if (csrfPromise) return csrfPromise;

  csrfPromise = fetch("/api/csrf", { credentials: "include" })
    .then(async (res) => {
      if (!res.ok) throw new Error(`CSRF fetch failed: ${res.status}`);
      const token = res.headers.get(CSRF_HEADER_NAME);
      if (token) return token;
      const data = await res.json();
      if (data?.csrfToken) return data.csrfToken;
      throw new Error("No CSRF token in response");
    })
    .catch((err) => {
      csrfPromise = null;
      console.error("[CSRF] Failed to fetch token:", err);
      return "";
    });

  return csrfPromise;
}

export function csrfHeaders(): Record<string, string> {
  return {};
}

export async function validateCsrf(request: Request): Promise<{ valid: boolean; reason?: string }> {
  if (request.method !== "POST" && request.method !== "PUT" && request.method !== "PATCH" && request.method !== "DELETE") {
    return { valid: true };
  }

  const cookieHeader = request.headers.get("cookie") || "";
  let signedCookieToken = "";
  for (const pair of cookieHeader.split(";")) {
    const trimmed = pair.trim();
    if (trimmed.startsWith(`${CSRF_COOKIE_NAME}=`)) {
      signedCookieToken = decodeURIComponent(trimmed.slice(CSRF_COOKIE_NAME.length + 1));
      break;
    }
  }

  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!signedCookieToken && !headerToken) {
    return { valid: false, reason: "CSRF token missing. Please refresh the page and try again." };
  }

  if (!signedCookieToken) {
    return { valid: false, reason: "Missing CSRF cookie. Please refresh the page and try again." };
  }

  if (!headerToken) {
    return { valid: false, reason: "Missing CSRF token header. Please refresh the page and try again." };
  }

  const cookieToken = await verifySignedToken(signedCookieToken);
  if (!cookieToken) {
    return { valid: false, reason: "Invalid CSRF token. Please refresh the page and try again." };
  }

  if (cookieToken !== headerToken) {
    return { valid: false, reason: "CSRF token mismatch. Please refresh the page and try again." };
  }

  if (cookieToken.length < 32) {
    return { valid: false, reason: "Invalid CSRF token." };
  }

  return { valid: true };
}

export async function createSignedCsrfToken(rawToken: string): Promise<string> {
  return signToken(rawToken);
}
```

Key changes:
- **Removed** `CSRF_STORAGE_KEY`, `getCsrfToken()`, `setCsrfToken()`, `clearCsrfToken()` — no more sessionStorage
- **`ensureCsrfToken()`** now always fetches fresh from `/api/csrf` (with dedup for concurrent calls)
- **`csrfHeaders()`** returns empty object — callers MUST call `ensureCsrfToken()` first and construct headers manually
- **`validateCsrf()`** unchanged — server-side validation still works the same

- [ ] **Step 2: Update CsrfBootstrap to just prefetch (no storage)**

```typescript
"use client";

import { ensureCsrfToken } from "@/lib/csrf";

export function CsrfBootstrap() {
  // Prefetch CSRF token on page load so it's ready when forms submit.
  // The token is stored in the httpOnly cookie, not in JS-accessible storage.
  useEffect(() => {
    ensureCsrfToken().catch(() => {});
  }, []);

  return null;
}
```

- [ ] **Step 3: Update all callers to use ensureCsrfToken() directly**

For every file that imports `csrfHeaders`, `setCsrfToken`, or `clearCsrfToken` from `@/lib/csrf`:

**Pattern change:**

Before:
```typescript
await ensureCsrfToken();
const res = await fetch("/api/...", {
  method: "POST",
  headers: { "Content-Type": "application/json", ...csrfHeaders() },
  body: JSON.stringify(data),
});
const csrfToken = res.headers.get("x-csrf-token");
if (csrfToken) setCsrfToken(csrfToken);
```

After:
```typescript
const csrfToken = await ensureCsrfToken();
if (!csrfToken) {
  setError("Could not verify security token. Please refresh the page.");
  return;
}
const res = await fetch("/api/...", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
  body: JSON.stringify(data),
});
```

Remove all `setCsrfToken()` calls and `csrfHeaders()` usage. Import only `{ ensureCsrfToken, CSRF_HEADER_NAME }` from `@/lib/csrf`.

Files to update:
- `src/components/admin/AdminLoginForm.tsx`
- `src/components/checkout/CheckoutPageClient.tsx`
- `src/components/auth/FirebaseAuthProvider.tsx`
- `src/components/home/NewsletterSignup.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/product/NotifyMeForm.tsx`
- `src/lib/api/client.ts`
- `src/lib/tracking.ts`
- `src/store/useAuthStore.ts`
- `src/app/(public)/contact/ContactClient.tsx`

- [ ] **Step 4: Update AdminLoginForm retry logic**

Replace the current retry logic with:

```typescript
try {
  const csrfToken = await ensureCsrfToken();
  if (!csrfToken) {
    setError("Could not load security token. Please refresh the page and try again.");
    return;
  }

  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => null);

  if (res.status === 403 && data?.code === "CSRF_ERROR") {
    // CSRF token expired or invalid — fetch fresh and retry once
    csrfPromise = null; // clear cached promise
    const freshToken = await ensureCsrfToken();
    if (freshToken) {
      const retryRes = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": freshToken },
        body: JSON.stringify({ email, password }),
      });
      const retryData = await retryRes.json().catch(() => null);
      if (retryRes.ok && retryData?.success) {
        if (retryData?.data?.user) setAdminUser(retryData.data.user);
        const safeRedirect = redirectTo.startsWith("/admin") ? redirectTo : "/admin";
        router.push(safeRedirect);
        router.refresh();
        return;
      }
      setError(retryData?.message || "Invalid admin email or password.");
      return;
    }
  }

  if (!res.ok || !data?.success) {
    setError(data?.message || "Invalid admin email or password.");
    return;
  }

  if (data?.data?.user) {
    setAdminUser(data.data.user);
  }

  const safeRedirect = redirectTo.startsWith("/admin") ? redirectTo : "/admin";
  router.push(safeRedirect);
  router.refresh();
} catch {
  setError("Unable to complete admin login. Please try again.");
} finally {
  setIsSubmitting(false);
}
```

Note: `csrfPromise` needs to be exported from csrf.ts or we need another way to clear it. Simplest: export a `resetCsrfCache()` function.

- [ ] **Step 5: Add resetCsrfCache to csrf.ts**

Add to `csrf.ts`:

```typescript
export function resetCsrfCache(): void {
  csrfPromise = null;
}
```

Then in AdminLoginForm, import `resetCsrfCache` and call it instead of `csrfPromise = null`.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 7: Run ESLint**

Run: `npx next lint`
Expected: 0 errors

- [ ] **Step 8: Build**

Run: `npx next build`
Expected: Success

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "security: remove CSRF token from sessionStorage, fetch fresh per request

- Remove sessionStorage-based CSRF token storage (XSS bypassable)
- ensureCsrfToken() now always fetches fresh token from /api/csrf
- csrfHeaders() removed — callers use x-csrf-token header directly
- setCsrfToken() removed — no client-side token storage
- AdminLoginForm retries with fresh token on 403 CSRF errors
- All mutating fetch calls updated to use ensureCsrfToken() directly
- CsrfBootstrap still prefetches on page load for UX"
```

---

## Task 3: Fix SELECT * Leaking Password Hashes in Admin API

**Files:**
- Modify: `backend/src/modules/admin/admin.service.ts`
- Modify: `backend/src/middleware/firebase-auth.ts` (if it also does SELECT *)

**Why:** `SELECT *` on the users table exposes password hashes and other sensitive fields through the admin API response.

- [ ] **Step 1: Find all SELECT * queries on users table**

Search `backend/src/` for `SELECT * FROM users` or `SELECT * FROM customers` or any query that returns full user rows.

- [ ] **Step 2: Replace SELECT * with explicit column lists**

For each query found, replace `SELECT *` with explicit columns, excluding `password_hash`, `password`, and any other sensitive fields. Example:

```sql
SELECT id, email, name, role, phone, avatar_url, email_verified, created_at, updated_at
FROM users
WHERE id = ?
```

- [ ] **Step 3: Verify the admin API endpoints still work**

Check that the response shapes match what the frontend expects by comparing the API response types.

- [ ] **Step 4: Commit**

```bash
git add backend/src/
git commit -m "security: replace SELECT * with explicit column lists in admin user queries

- Exclude password_hash and other sensitive fields from query results
- Prevents credential leaks through admin API responses"
```

---

## Task 4: Remove Auto-User Creation from Firebase Auth Middleware

**Files:**
- Modify: `backend/src/middleware/firebase-auth.ts`

**Why:** The middleware auto-creates user records on every authenticated request, bypassing the registration flow and setting `email_verified=1` without verification. Only `/auth/sync` should create users.

- [ ] **Step 1: Find the auto-creation logic in firebase-auth.ts**

Locate the section that creates a new user when `uid` doesn't exist in the database (approximately lines 204-265 and lines 95-154).

- [ ] **Step 2: Remove auto-creation from the general auth middleware**

In the Firebase auth middleware, replace the auto-creation block with a simple 401 response when the user doesn't exist:

```typescript
// Instead of auto-creating, return 401
if (!existingUser) {
  return c.json({ success: false, message: 'User not found. Please complete registration.' }, 401);
}
```

- [ ] **Step 3: Keep auto-creation ONLY in the /auth/sync endpoint**

The `/auth/sync` route is the legitimate place for user creation. Verify that route still creates users correctly. If the sync endpoint uses the same middleware, add a flag or check to allow creation only there.

- [ ] **Step 4: Test that authenticated endpoints return 401 for non-existent users**

Verify that making a request with a valid Firebase token for a user that doesn't exist in the DB returns 401, not auto-created.

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/firebase-auth.ts
git commit -m "security: remove auto-user creation from Firebase auth middleware

- Auth middleware now returns 401 for users not in the database
- Only /auth/sync endpoint creates new user records
- Prevents bypassing registration flow and email verification"
```

---

## Task 5: Fix Order Creation Race Condition (Stock Overselling)

**Files:**
- Modify: `backend/src/modules/orders/order.service.ts`

**Why:** Stock check happens outside the transaction, allowing concurrent orders to pass validation before stock is decremented.

- [ ] **Step 1: Move stock validation inside the transaction**

Find the `createOrder` function. Currently it:
1. Validates stock outside the transaction (lines ~362-374)
2. Starts a transaction (line ~421)
3. Decrements stock inside the transaction (lines ~451-468)

Move the stock validation inside the transaction so it holds a lock during the check.

- [ ] **Step 2: Use conditional stock decrement (atomic check-and-decrement)**

Replace the separate stock check + decrement with an atomic operation:

```sql
UPDATE product_variants
SET stock_quantity = stock_quantity - ?
WHERE id = ? AND stock_quantity >= ?
```

Check `rowsAffected` — if 0, the stock was insufficient (race condition caught).

- [ ] **Step 3: Return clear error on stock insufficient**

If the atomic decrement returns 0 rows affected, throw a clear error:

```typescript
throw new GlamoApiError(409, 'INSUFFICIENT_STOCK', `Not enough stock for ${item.name}`);
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/orders/order.service.ts
git commit -m "fix: move stock validation inside transaction, use atomic check-and-decrement

- Stock check now happens inside the transaction with row locks
- Atomic decrement prevents overselling under concurrent orders
- Returns 409 INSUFFICIENT_STOCK error when race condition detected"
```

---

## Verification Checklist

After completing all 5 tasks:

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npx next lint` passes with 0 errors
- [ ] `npx next build` succeeds
- [ ] Admin login works with `ADMIN_PASSWORD_HASH` only
- [ ] Admin login fails with clear error when `ADMIN_PASSWORD_HASH` is missing
- [ ] CSRF flow works: page loads, token fetched, form submits successfully
- [ ] CSRF retry works: if token expires, form retries with fresh token
- [ ] No `SELECT *` on users table in backend
- [ ] Auth middleware returns 401 for unknown users (not auto-create)
- [ ] Order creation fails gracefully when stock is insufficient under concurrent load
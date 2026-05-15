# GLAMO NEPAL — Security Implementation & Threat Model

## 1. Security Headers (IMPLEMENTED)

All responses include the following security headers via `src/middleware.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'nonce-<per-request>' https://cdn.vercel-insights.com; style-src 'self' 'nonce-<per-request>' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://cdn.pixabay.com https://res.cloudinary.com https://img.freepik.com https://images.pexels.com; connect-src 'self' https://api.glamonepal.com https://khalti.com https://esewa.com.np https://pay.khalti.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests` | Prevents XSS, clickjacking, data exfiltration. No `unsafe-inline` in script-src. No `unsafe-eval`. |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restricts browser APIs |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS |
| `X-DNS-Prefetch-Control` | `on` | Enables DNS prefetching for performance |

## 2. Authentication Security (IMPLEMENTED)

### 2.1 Cookie Security
- Admin session cookie uses `__Host-` prefix (`__Host-glamo-admin-session`) — locked to exact domain, Secure-only, no path override
- All auth cookies are `HttpOnly; Secure; SameSite=Lax`
- Role cookie is URL-encoded to prevent injection
- Shared `auth-cookies.ts` utility eliminates duplication

### 2.2 Login Rate Limiting (SERVER-SIDE)
- In-memory rate limiting via `src/lib/rate-limit.ts`
- `/api/admin/login`: 5 attempts per IP per 15 minutes
- `/api/contact`: 3 submissions per IP per hour
- All other API routes: 60 requests per IP per minute (default)
- Periodic garbage collection of expired entries
- Returns `429` with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers

### 2.3 Timing-Safe Admin Authentication
- Admin login uses byte-by-byte constant-time comparison for both email and password
- Eliminates timing side-channel attacks on admin credentials

### 2.4 Open Redirect Prevention
- `sanitizeRedirect()` in `auth-cookies.ts` validates redirect URLs:
  - Must start with `/`
  - Rejects `//` (protocol-relative URLs)
  - Falls back to `/account` for invalid redirects

### 2.5 Hardcoded Credentials Removed
- AuthForm default values use empty strings
- Password fields use `autoComplete="new-password"` for new passwords

## 3. CSRF Protection (IMPLEMENTED)

### 3.1 Double-Submit Cookie Pattern
- `glamo-csrf-token` cookie set by middleware on every response (non-HttpOnly, readable by JS)
- Client-side utility `csrfHeaders()` in `src/lib/csrf.ts` reads cookie and sends as `x-csrf-token` header
- Validated on every POST/PUT/DELETE to:
  - `/api/admin/login`
  - `/api/admin/logout`
  - `/api/contact`
  - `/api/newsletter`
  - `/api/checkout`
- Returns `403 CSRF_INVALID` on mismatch

## 4. Input Validation (IMPLEMENTED)

### 4.1 Zod Schema Max-Length Constraints
All validation schemas include `max()` constraints:

| Schema | Field | Max Length |
|--------|-------|-----------|
| `loginSchema` | email | 254 |
| `loginSchema` | password | 128 |
| `registerSchema` | name | 100 |
| `registerSchema` | email | 254 |
| `registerSchema` | password | 128 |
| `checkoutSchema` | name | 100 |
| `checkoutSchema` | city | 100 |
| `checkoutSchema` | ward | 10 |
| `checkoutSchema` | address | 200 |
| `checkoutSchema` | notes | 500 |
| `contactSchema` | name | 100 |
| `contactSchema` | email | 254 |
| `contactSchema` | subject | 200 |
| `contactSchema` | message | 2000 |

## 5. SVG Sanitisation (IMPLEMENTED)

- `sanitizeSvg()` in `AdminDashboard.tsx` uses `DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })`
- Replaces previous regex/DOMParser approach which was bypassable
- Package: `dompurify` + `@types/dompurify`

## 6. Server-Side Order Numbers (IMPLEMENTED)

- `POST /api/checkout` generates order numbers server-side using `crypto.randomUUID()`
- Format: `GLM-{year}-{uuid8}` (e.g., `GLM-2026-A1B2C3D4`)
- Client-side `Math.random()` removed from checkout flow
- Fallback to client-side `crypto.randomUUID()` only if server unreachable

## 7. Newsletter Server Submission (IMPLEMENTED)

- `POST /api/newsletter` endpoint created
- Validates email with Zod schema
- Persists to Supabase `newsletter_subscribers` table with merge-duplicates
- `NewsletterSignup` component now calls server endpoint with CSRF header
- Removes localStorage-only saving

## 8. Accessibility Fixes (IMPLEMENTED)

### 8.1 Marquee Components
- **AnnouncementBar**: Replaced `role="marquee"` with paused-by-default auto-rotating region. Play/Pause toggle with `aria-pressed`. `aria-live="polite"`, `aria-atomic="true"`, `role="region"`. Respects `prefers-reduced-motion` (10s interval when reduced).
- **TrustBadgeMarquee**: Same pattern — paused-by-default, Play/Pause, `aria-live="polite"`, `prefers-reduced-motion`.
- **BrandsMarquee**: Same pattern — paused-by-default, Play/Pause, `aria-live="polite"`, `prefers-reduced-motion`.

### 8.2 Carousel (HeroBanner)
- `aria-roledescription="carousel"` and `aria-label` on section
- `role="tablist"` and `aria-selected` on pagination dots
- `role="group"` and `aria-roledescription="slide"` on each slide
- `aria-live` region for slide changes (respects reduced motion)
- Keyboard navigation (ArrowLeft/ArrowRight) via `onKeyDown`
- Pause/Play button for autoplay control (WCAG requirement)
- `useReducedMotion()` check adjusts autoplay delay

### 8.3 ProductCard Quick View
- `aria-hidden="true"` on decorative text

### 8.4 NewsletterSignup
- `<label htmlFor>` with `sr-only` class
- `aria-live="polite"` region for success/error state
- `role="alert"` for error messages
- `aria-invalid` and `aria-describedby` for validation
- `noValidate` on form
- Client-side email format validation
- Server-side submission with loading state

### 8.5 NotifyMeForm
- `<label>` element with `sr-only` class
- `aria-live="polite"` region for success state
- `role="status"` on success message

### 8.6 BeautyProfileQuiz
- AND logic with OR fallback for skin type + concern matching
- `aria-labelledby` on section
- `aria-live="polite"` on results container
- `htmlFor`/`id` associations on select labels
- `aria-hidden="true"` on decorative Sparkles icon

### 8.7 ShopByCategory
- Links fixed to `/shop?category=${slug}`
- `aria-hidden="true"` on decorative images
- `aria-labelledby` on section

### 8.8 TheGlowEdit
- `role="tablist"` on tab container
- `role="tab"` and `aria-selected` on tab buttons
- `role="tabpanel"` and `id` on product grid
- `aria-labelledby` on section

### 8.9 WhatsAppFloatingButton
- `aria-hidden="true"` on ping animation span

## 9. Component Error Boundaries (IMPLEMENTED)

Created `ComponentErrorBoundary` component wrapping:
- CartDrawer
- SearchModal
- CompareTray

## 10. Missing Route Error/Loading Pages (IMPLEMENTED)

Added error.tsx and loading.tsx for:
- `/collections/error.tsx` and `/collections/loading.tsx`
- `/routines/error.tsx` and `/routines/loading.tsx`

## 11. QA Sign-Off Checklist

- [x] Security headers (CSP with nonces, HSTS, X-Frame-Options, etc.) added to all responses
- [x] Auth cookies use `__Host-` prefix, `HttpOnly`, `Secure`, `SameSite=Lax`
- [x] Hardcoded credentials removed from AuthForm
- [x] Server-side rate limiting on login (5/15min) and contact (3/hr) endpoints
- [x] CSRF double-submit cookie protection on all state-changing endpoints
- [x] Open redirect vulnerability fixed with `sanitizeRedirect()`
- [x] Zod validation schemas include max-length constraints
- [x] SVG sanitisation uses DOMPurify (not regex)
- [x] Admin password comparison uses timing-safe equality
- [x] Order numbers generated server-side with `crypto.randomUUID()`
- [x] Newsletter form submits to server endpoint (not localStorage-only)
- [x] All marquee components use paused-by-default auto-rotating pattern with Play/Pause
- [x] Carousel has proper ARIA semantics and keyboard controls
- [x] Carousel has pause/play button for WCAG compliance
- [x] Newsletter has proper label, aria-live, and validation
- [x] NotifyMeForm has proper label and aria-live
- [x] BeautyProfileQuiz uses AND logic with fallback
- [x] ShopByCategory links to correct `/shop?category=` pattern
- [x] CATEGORY_PILLS links fixed
- [x] Product subCategory mismatches fixed (p022, p033)
- [x] Missing concern tags added to CONCERNS array
- [x] Collections page shows listing (not detail)
- [x] Routines page shows listing (not detail)
- [x] Error boundaries added around interactive components
- [x] Error and loading pages added for collections and routes
- [x] Auth cookie logic deduplicated into shared utility
- [x] WhatsApp ping animation has aria-hidden
- [x] `prefers-reduced-motion` respected in HeroBanner and all marquees
- [x] ProductCard Quick View marked as aria-hidden
- [x] Component error boundaries in layout
- [x] TypeScript type check passes
- [x] ESLint passes with no warnings or errors
- [x] Production build succeeds
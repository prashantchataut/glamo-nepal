# GLAMO Nepal — Security Implementation Guide & Threat Model

## 1. Security Headers (IMPLEMENTED)

All responses now include the following security headers via `src/middleware.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://cdn.pixabay.com https://res.cloudinary.com https://img.freepik.com https://images.pexels.com; connect-src 'self' https://api.glamonepal.com https://khalti.com https://esewa.com.np https://pay.khalti.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests` | Prevents XSS, clickjacking, data exfiltration |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restricts browser APIs |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS |
| `X-DNS-Prefetch-Control` | `on` | Enables DNS prefetching for performance |

## 2. Authentication Security (IMPLEMENTED)

### 2.1 Cookie Security
- Auth cookies now include `Secure` flag (HTTPS-only)
- `SameSite=Lax` prevents CSRF for non-GET requests
- Role cookie is URL-encoded to prevent injection
- Shared `auth-cookies.ts` utility eliminates duplication across LogoutButton, AccountShell, AuthForm

### 2.2 Login Rate Limiting (CLIENT-SIDE)
- `checkLoginRateLimit()` enforces max 5 attempts before 15-minute lockout
- `recordLoginAttempt(success)` clears count on success, increments on failure
- Stored in `localStorage` with key `glamo-login-attempts`
- **NOTE**: This is client-side throttling only. Backend rate limiting MUST be implemented before production.

### 2.3 Open Redirect Prevention
- `sanitizeRedirect()` in `auth-cookies.ts` validates redirect URLs:
  - Must start with `/`
  - Rejects `//` (protocol-relative URLs)
  - Falls back to `/account` for invalid redirects

### 2.4 Hardcoded Credentials Removed
- AuthForm default values now use empty strings instead of `customer@glamonepal.com` / `glamo-beauty-2026`
- Password fields use `autoComplete="new-password"` for new passwords

## 3. Input Validation (IMPLEMENTED)

### 3.1 Zod Schema Max-Length Constraints
All validation schemas now include `max()` constraints:

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

## 4. Accessibility Fixes (IMPLEMENTED)

### 4.1 Marquee Components
- `AnnouncementBar.tsx`: Added `role="marquee"` and `aria-label="Announcements"`, `aria-hidden="true"` on scrolling content
- `TrustBadgeMarquee.tsx`: Added `role="marquee"` and `aria-label="Trust badges"`, `aria-hidden="true"` on scrolling content
- `BrandsMarquee.tsx`: Added `aria-label="Trusted brands"`, `aria-hidden="true"` on scrolling content

### 4.2 Carousel (HeroBanner)
- Added `aria-roledescription="carousel"` and `aria-label` on section
- Added `role="tablist"` and `aria-selected` on pagination dots
- Added `role="group"` and `aria-roledescription="slide"` on each slide
- Added `aria-live` region for slide changes (respects reduced motion)
- Added keyboard navigation (ArrowLeft/ArrowRight) via `onKeyDown`
- Added Pause/Play button for autoplay control (WCAG requirement)
- `useReducedMotion()` check adjusts autoplay delay

### 4.3 ProductCard Quick View
- Changed `<span>` with `pointer-events-none` to `aria-hidden="true"` — decorative text is now properly hidden from screen readers
- The product card itself is already keyboard-accessible via the `<Link>` wrapper

### 4.4 NewsletterSignup
- Added `<label htmlFor="newsletter-email">` with `sr-only` class
- Added `aria-live="polite"` region for success/error state
- Added `role="alert"` for error messages
- Added `aria-invalid` and `aria-describedby` for validation
- Added `noValidate` to form for custom validation
- Added client-side email format validation

### 4.5 NotifyMeForm
- Added `<label>` element with `sr-only` class
- Added `aria-live="polite"` region for success state
- Added `role="status"` on success message

### 4.6 BeautyProfileQuiz
- Changed filter logic from OR (`||`) to AND (`&&`) for skin type + concern matching
- Added fallback: if AND yields 0 results, falls back to OR
- Added `aria-labelledby="beauty-quiz-heading"` on section
- Added `aria-live="polite"` on results container
- Added `htmlFor`/`id` associations on select labels
- Added `aria-hidden="true"` on decorative Sparkles icon

### 4.7 ShopByCategory
- Fixed links from `/category/${slug}` to `/shop?category=${slug}` (matches the actual route)
- Changed image `alt` to empty string with `aria-hidden="true"` (decorative, link text is the label)
- Added `aria-labelledby="shop-category-heading"` on section

### 4.8 TheGlowEdit
- Added `role="tablist"` on tab container
- Added `role="tab"` and `aria-selected` on tab buttons
- Added `role="tabpanel"` and `id="glow-edit-panel"` on product grid
- Added `aria-labelledby="glow-edit-heading"` on section

### 4.9 WhatsAppFloatingButton
- Added `aria-hidden="true"` on ping animation span

## 5. Functional Bug Fixes (IMPLEMENTED)

### 5.1 Collections Page
- Replaced duplicate detail page with proper listing page showing all collections with card grid

### 5.2 Routines Page
- Replaced duplicate detail page with proper listing page showing all bundles with card grid

### 5.3 CATEGORY_PILLS Links
- Fixed from `/category/${slug}` to `/shop?category=${slug}` in constants.ts

### 5.4 Product SubCategories
- Changed p022 "Kajal Definer Pencil" from `subCategory: "Concealer"` to `subCategory: "Kajal"`
- Changed p033 "SUGAR Cosmetics Kohl of Honour Kajal" from `subCategory: "Mascara"` to `subCategory: "Kajal"`
- Added "Kajal" to Makeup subCategories in CATEGORIES array

### 5.5 CONCERNS Array
- Added 7 missing concern tags: "Natural Finish", "Dewy Finish", "Humidity Resistant", "Smooth Skin", "Damage Care", "Dry Skin", "Shine"
- Removed unused "Color Care" (not used by any product)

## 6. Component Error Boundaries (IMPLEMENTED)

Created `ComponentErrorBoundary` component wrapping:
- CartDrawer
- SearchModal
- CompareTray

## 7. Missing Route Error/Loading Pages (IMPLEMENTED)

Added error.tsx and loading.tsx for:
- `/collections/error.tsx`
- `/collections/loading.tsx`
- `/routines/error.tsx`
- `/routines/loading.tsx`

## 8. Remaining Security Recommendations

### 8.1 CRITICAL — Backend Rate Limiting (NOT YET IMPLEMENTED)
The client-side rate limiting in `auth-cookies.ts` is trivially bypassed. Production MUST implement:
- Rate limiting on `/api/admin/login` (e.g., 5 attempts per IP per 15 minutes)
- Rate limiting on `/api/contact` (e.g., 3 submissions per IP per hour)
- Use Vercel Edge Middleware or server-side rate limiting

### 8.2 CRITICAL — CSRF Protection (NOT YET IMPLEMENTED)
All state-changing POST endpoints need CSRF tokens:
- Generate a random token per session
- Include as `<meta>` tag or custom header
- Validate on every POST/PUT/DELETE request

### 8.3 HIGH — SVG Sanitization (NOT YET IMPLEMENTED)
The `sanitizeSvg()` function in `AdminDashboard.tsx` uses regex which is bypassable.
- Install `dompurify` package: `npm install dompurify @types/dompurify`
- Replace regex sanitization with `DOMPurify.sanitize(svgString, { USE_PROFILES: { svg: true, svgFilters: true } })`

### 8.4 HIGH — Admin Auth Hardening (PARTIAL)
- Admin auth uses HMAC-SHA256 for token verification (good)
- BUT: admin login compares password with `!==` (timing attack vector)
- Recommendation: Use `crypto.timingSafeEqual` for password comparison in the admin login API route

### 8.5 MEDIUM — Checkout Order Number
- Currently generated client-side with `Math.random()`
- Recommendation: Generate server-side with a sequential counter or UUID

### 8.6 MEDIUM — Newsletter Server Submission
- Currently saves to localStorage only
- Recommendation: Connect to `/api/contact` or a newsletter API endpoint

## 9. QA Sign-Off Checklist

- [x] Security headers (CSP, HSTS, X-Frame-Options, etc.) added to all responses
- [x] Auth cookies use Secure flag and proper SameSite
- [x] Hardcoded credentials removed from AuthForm
- [x] Login rate limiting implemented (client-side)
- [x] Open redirect vulnerability fixed with sanitizeRedirect()
- [x] Zod validation schemas include max-length constraints
- [x] All marquee components have aria-hidden on duplicated content
- [x] Carousel has proper ARIA semantics and keyboard controls
- [x] Carousel has pause/play button for WCAG compliance
- [x] Newsletter has proper label, aria-live, and validation
- [x] NotifyMeForm has proper label and aria-live
- [x] BeautyProfileQuiz uses AND logic with fallback
- [x] ShopByCategory links to correct /shop?category= pattern
- [x] CATEGORY_PILLS links fixed
- [x] Product subCategory mismatches fixed (p022, p033)
- [x] Missing concern tags added to CONCERNS array
- [x] Collections page shows listing (not detail)
- [x] Routines page shows listing (not detail)
- [x] Error boundaries added around interactive components
- [x] Error and loading pages added for collections and routes
- [x] Auth cookie logic deduplicated into shared utility
- [x] WhatsApp ping animation has aria-hidden
- [x] prefers-reduced-motion respected in HeroBanner
- [x] ProductCard Quick View marked as aria-hidden
- [x] Component error boundaries in layout
- [x] TypeScript type check passes
- [x] ESLint passes with no warnings or errors
- [x] Production build succeeds
- [ ] Backend rate limiting on login and contact endpoints
- [ ] CSRF tokens for state-changing requests
- [ ] SVG sanitization using DOMPurify (replace regex)
- [ ] Newsletter server-side submission endpoint
- [ ] Checkout order number generated server-side
- [ ] Admin password comparison using timing-safe equality
- [ ] Client-side SVG upload sanitization in AdminDashboard
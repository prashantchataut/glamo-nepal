# GLAMO Nepal — Setup Guide

## Prerequisites

- Node.js 22+
- pnpm 9+
- [Turso](https://turso.tech) account (SQLite database)
- [Firebase](https://console.firebase.google.com) project (authentication)
- [Cloudinary](https://cloudinary.com) account (image uploads)
- [Resend](https://resend.com) account (email — optional)
- [Cloudflare](https://dash.cloudflare.com) account (Workers deployment)

## Quick Start

```bash
# 1. Install dependencies
pnpm install
cd backend && pnpm install && cd ..

# 2. Configure environment variables
cp .env.example .env.local
cp backend/.env.example backend/.env

# 3. Create Turso database and run schema
turso db create glamo-nepal
turso db shell glamo-nepal < backend/src/scripts/schema.sql

# 4. Seed the database
cd backend && pnpm db:seed && cd ..

# 5. Start backend (terminal 1)
cd backend
pnpm dev
# Backend runs on http://localhost:3001

# 6. Start frontend (terminal 2)
pnpm dev
# Frontend runs on http://localhost:3000

# 7. Create admin user
# Sign up via Firebase Auth, then update their role in the database:
# turso db shell glamo-nepal "UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'your@email.com';"
```

## Environment Variables

### .env.local (root — frontend)

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key | **Yes** |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | **Yes** |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | **Yes** |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | **Yes** |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | **Yes** |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | **Yes** |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:3001/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | `http://localhost:3000` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | **Yes** (for image uploads) |
| `NEXT_PUBLIC_KHALTI_PUBLIC_KEY` | Khalti public key | For payments |
| `NEXT_PUBLIC_ESEWA_MERCHANT_ID` | eSewa merchant ID | For payments |
| `ADMIN_EMAIL` | Admin login email | **Yes** |
| `ADMIN_PASSWORD` | Admin login password | **Yes** |
| `ADMIN_SESSION_SECRET` | HMAC signing key for admin cookies | **Yes** |
| `AUTH_SECRET` | Fallback auth secret | **Yes** |
| `KHALTI_SECRET_KEY` | Khalti secret key | For payments |
| `ESEWA_SECRET_KEY` | eSewa secret key | For payments |
| `ESEWA_MERCHANT_CODE` | eSewa merchant code | For payments |
| `CSRF_SECRET` | HMAC key for CSRF tokens | **Yes** |

> ### ⚠️ CRITICAL: `ADMIN_SESSION_SECRET` must be IDENTICAL on both sides
>
> The frontend signs the `glamo-admin-session` cookie with
> `ADMIN_SESSION_SECRET`; the backend verifies it with the
> same key. If the two values differ — or one side only sets `AUTH_SECRET`
> while the other sets `ADMIN_SESSION_SECRET` — **every admin endpoint returns
> 401 and the entire admin panel shows "Failed to load X"** with no obvious
> cause. Generate ONE value and set it on both:
>
> ```bash
> # Generate once:
> node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
>
> # Set the SAME value in both Cloudflare Workers:
> cd backend && npx wrangler secret put ADMIN_SESSION_SECRET
> npx wrangler secret put ADMIN_SESSION_SECRET
> ```
>
> After changing the secret, redeploy both and **re-login** at `/admin/login`
> (the old cookie was signed with the previous key).
>
> Verify end-to-end after every deploy:
> ```bash
> ADMIN_SESSION_SECRET=<same-value> \
> ADMIN_SMOKE_ORIGIN=https://www.glamonepal.com \
> pnpm smoke:admin-secret
> ```
> Or check the backend diagnostic: `GET /health/admin-session` returns
> `adminSecretReady` and `resolvedFrom`.

### backend/.env

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `TURSO_DB_URL` | Turso database URL | **Yes** |
| `TURSO_AUTH_TOKEN` | Turso auth token | **Yes** |
| `FIREBASE_PROJECT_ID` | Firebase project ID (for JWT verification) | **Yes** |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | For image uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | For image uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | For image uploads |
| `RESEND_API_KEY` | Resend API key | For emails |
| `KHALTI_SECRET_KEY` | Khalti secret key | For payments |
| `ESEWA_SECRET_KEY` | eSewa secret key | For payments |
| `ESEWA_MERCHANT_CODE` | eSewa merchant code | For payments |
| `ADMIN_SESSION_SECRET` | HMAC key to verify admin cookies — **must equal the frontend's value** | **Yes** |
| `AUTH_SECRET` | Fallback if `ADMIN_SESSION_SECRET` unset — **must equal the frontend's value** | **Yes** |
| `CSRF_SECRET` | HMAC key for CSRF tokens — must equal the frontend's value | **Yes** |
| `ADMIN_EMAIL` / `ADMIN_NAME` / `SUPER_ADMIN_EMAILS` | Admin identity & role mapping | **Yes** |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `FREE_SHIPPING_THRESHOLD` | Free shipping threshold in paisa | `250000` (2500 NPR) |
| `COD_FEE` | Cash on delivery fee in paisa | `5000` (50 NPR) |

## Database Setup

### 1. Create Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create glamo-nepal

# Get connection info
turso db show glamo-nepal
```

### 2. Run Schema (automated setup script)

```bash
cd backend
node setup-db.cjs
```

This script automatically:
1. Creates a database auth token via Turso Platform API
2. Connects to the database
3. Runs all CREATE TABLE statements (25 tables, dependency-ordered)
4. Runs all CREATE INDEX statements (28 indexes)
5. Updates `backend/.env` with the working auth token

Alternatively, run schema manually:
```bash
turso db shell glamo-nepal < backend/src/scripts/schema.sql
```

### 3. Seed Data

```bash
cd backend
TURSO_DB_URL=libsql://your-db-name-your-org.aws-ap-south-1.turso.io \
TURSO_AUTH_TOKEN=<your-token> \
npx tsx src/scripts/seed.ts
```

### 4. Create Admin User

```bash
# Sign up through the frontend first, then promote:
cd backend
TURSO_DB_URL=libsql://your-db-name-your-org.aws-ap-south-1.turso.io \
TURSO_AUTH_TOKEN=<your-token> \
ADMIN_EMAIL=your@email.com \
npx tsx src/scripts/promote-admin.ts
```

Or list all users (without promoting):
```bash
cd backend
TURSO_DB_URL=... TURSO_AUTH_TOKEN=... npx tsx src/scripts/promote-admin.ts
```

### 5. Get Credentials

- **TURSO_DB_URL**: `libsql://your-db-name-your-org.aws-ap-south-1.turso.io`
- **TURSO_AUTH_TOKEN**: Created automatically by `setup-db.cjs`, or from Turso Dashboard → Database → Settings → Tokens
- Paste both into `backend/.env`

## Firebase Auth Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com) → Create Project
2. Enable Authentication → Sign-in method → Enable Email/Password
3. Go to Project Settings → General → Add Web App
4. Copy the Firebase config values to `.env.local`

### 2. Get Service Account (for backend JWT verification)

1. Firebase Console → Project Settings → Service Accounts
2. The backend only needs `FIREBASE_PROJECT_ID` — it verifies JWTs using the project's public JWK set
3. No service account key file needed

### 3. Create Admin User

1. Sign up via the frontend app
2. Get the user's Firebase UID from Firebase Console → Authentication
3. Promote via script:

```bash
cd backend
ADMIN_EMAIL=your@email.com npx tsx src/scripts/promote-admin.ts
```

Or manually via Turso shell:
```bash
turso db shell glamo-nepal "UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'your@email.com';"
```

## Admin Login

The admin login uses HMAC-signed cookies. It does **not** require Firebase — it uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment variables.

### Credentials
- Email: set via `ADMIN_EMAIL` in `.env.local`
- Password: set via `ADMIN_PASSWORD` in `.env.local`

### Flow
1. Visit `/admin/login`
2. CSRF token cookie is set by middleware
3. Submit form → POST `/api/v1/admin/login`
4. Server verifies credentials, creates HMAC-signed session cookie
5. Redirect to `/admin`

### Cookie Behavior
- **Production**: Uses `__Host-` prefixed cookie (requires HTTPS)
- **Development**: Uses `glamo-admin-session` cookie (works on HTTP)

## Running the Backend

```bash
cd backend
pnpm dev
```

The backend starts on `http://localhost:3001`. All API routes are prefixed with `/api/v1/`.

### Backend Routes

| Module | Route |
|--------|-------|
| Admin | `/api/v1/admin/*` |
| Products | `/api/v1/products/*` |
| Orders | `/api/v1/orders/*` |
| Banners | `/api/v1/banners/*` |
| Settings | `/api/v1/settings/*` |
| Categories | `/api/v1/categories/*` |
| Brands | `/api/v1/brands/*` |
| Auth | `/api/v1/auth/*` |
| Cart | `/api/v1/cart/*` |
| Wishlist | `/api/v1/wishlist/*` |
| Coupons | `/api/v1/coupons/*` |
| Checkout | `/api/v1/checkout/*` |
| Reviews | `/api/v1/reviews/*` |
| Blog | `/api/v1/blogs/*` |
| Gallery | `/api/v1/gallery/*` |
| Team | `/api/v1/team/*` |
| Newsletter | `/api/v1/newsletter/*` |
| Health | `/api/v1/health` |

## Common Issues

### "API_BASE_URL_MISSING" error
`NEXT_PUBLIC_API_BASE_URL` is not set in `.env.local`. Restart Next.js dev server after adding it.

### "NETWORK_ERROR" or "Could not reach the API backend"
The Hono backend is not running. Start it with `pnpm dev` in the `backend/` directory.

### Admin login returns "Admin login is not configured"
`ADMIN_EMAIL` and `ADMIN_PASSWORD` are not set in `.env.local`.

### Admin login succeeds but dashboard shows errors
The backend is not running or `NEXT_PUBLIC_API_BASE_URL` is wrong. Admin login works independently, but all data operations need the backend.

### Cookies not setting / session not persisting
- In development, make sure you're on `http://localhost:3000` (not 127.0.0.1)
- Check browser dev tools → Application → Cookies
- The cookie name is `glamo-admin-session` in dev, `__Host-glamo-admin-session` in prod

### CORS errors
The backend allows `http://localhost:3000` by default. If using a different port, update `FRONTEND_URL` in `backend/.env`.

### Firebase auth token errors
- Verify `FIREBASE_PROJECT_ID` in `backend/.env` matches your Firebase project
- Check that the frontend Firebase config matches the same project
- Ensure the user signed up successfully in Firebase Console → Authentication

## Production Deployment

Both frontend and backend deploy to **Cloudflare Workers**. Pushing to `master` triggers GitHub Actions CI/CD.

### Manual deployment (if CI/CD is not set up)

```bash
# Frontend
pnpm deploy:cf

# Backend
cd backend && npx wrangler deploy --config wrangler.toml
```

Set secrets on both Workers:
```bash
npx wrangler secret put ADMIN_SESSION_SECRET
cd backend && npx wrangler secret put ADMIN_SESSION_SECRET
```

### Production URLs
- Frontend: `https://www.glamonepal.com`
- Backend: `https://api.glamonepal.com`
- Admin: `https://www.glamonepal.com/admin`

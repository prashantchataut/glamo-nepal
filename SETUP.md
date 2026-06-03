# GLAMO Nepal — Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm i -g wrangler`
- [Supabase](https://supabase.com) account (cloud-hosted database)
- [Cloudinary](https://cloudinary.com) account (image uploads)
- [Resend](https://resend.com) account (email)

## Quick Start

```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Configure environment variables
# Edit .env.local (root) — admin credentials already set
# Edit backend/.dev.vars — add your Supabase + Cloudinary keys

# 3. Start backend (terminal 1)
cd backend
wrangler dev
# Backend runs on http://localhost:8787

# 4. Start frontend (terminal 2)
npm run dev
# Frontend runs on http://localhost:3000

# 5. Open admin panel
# http://localhost:3000/admin/login
# Email: admin@glamonepal.com
# Password: ChangeMe@123
```

## Environment Variables

### .env.local (root)

| Variable | Purpose | Status |
|----------|---------|--------|
| `ADMIN_EMAIL` | Admin login email | Set |
| `ADMIN_PASSWORD` | Admin login password | Set |
| `ADMIN_SESSION_SECRET` | HMAC signing key for admin cookies | Set |
| `AUTH_SECRET` | Fallback auth secret | Set |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | Set to `http://localhost:8787/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | `http://localhost:3000` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Required for image uploads |
| `NEXT_PUBLIC_KHALTI_PUBLIC_KEY` | Khalti public key | For payments |
| `KHALTI_SECRET_KEY` | Khalti secret key | For payments |
| `ESEWA_SECRET_KEY` | eSewa secret key | For payments |
| `ESEWA_MERCHANT_CODE` | eSewa merchant code | For payments |

### backend/.dev.vars

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `SUPABASE_URL` | Supabase project URL | **REQUIRED** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | **REQUIRED** |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | For image uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | For image uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | For image uploads |
| `RESEND_API_KEY` | Resend API key | For emails |
| `KHALTI_SECRET_KEY` | Khalti secret key | For payments |
| `ESEWA_SECRET_KEY` | eSewa secret key | For payments |
| `ESEWA_MERCHANT_CODE` | eSewa merchant code | For payments |
| `JWT_PRIVATE_KEY` | RS256 private key (PEM) | For auth tokens |
| `JWT_PUBLIC_KEY` | RS256 public key (PEM) | For auth tokens |

## Database Setup

### 1. Create Supabase Project
Go to [supabase.com](https://supabase.com) → New Project → Note your project URL and service role key.

### 2. Run Migrations
```bash
# Option A: Run against Supabase SQL Editor
# Copy backend/supabase/migrations/*.sql and run in order

# Option B: Run locally with Supabase CLI
supabase start
supabase db push
```

### 3. Get Credentials
- **SUPABASE_URL**: Project Settings → API → Project URL
- **SUPABASE_SERVICE_ROLE_KEY**: Project Settings → API → service_role key
- Paste both into `backend/.dev.vars`

## Admin Login

The admin login uses HMAC-signed cookies. It does **not** require the backend to be running.

### Credentials
- Email: `admin@glamonepal.com`
- Password: `ChangeMe@123`

### Flow
1. Visit `/admin/login`
2. CSRF token cookie is set by middleware
3. Submit form → POST `/api/admin/login`
4. Server verifies credentials, creates HMAC-signed session cookie
5. Redirect to `/admin`

### Cookie Behavior
- **Production**: Uses `__Host-` prefixed cookie (requires HTTPS)
- **Development**: Uses `glamo-admin-session` cookie (works on HTTP)

## Running the Backend

```bash
cd backend
wrangler dev
```

The backend starts on `http://localhost:8787`. All API routes are prefixed with `/api/v1/`.

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

## Common Issues

### "API_BASE_URL_MISSING" error
`NEXT_PUBLIC_API_BASE_URL` is not set in `.env.local`. Restart Next.js dev server after adding it.

### "NETWORK_ERROR" or "Could not reach the API backend"
The Hono backend is not running. Start it with `wrangler dev` in the `backend/` directory.

### Admin login returns "Admin login is not configured"
`ADMIN_EMAIL` and `ADMIN_PASSWORD` are not set in `.env.local`.

### Admin login succeeds but dashboard shows errors
The backend is not running or `NEXT_PUBLIC_API_BASE_URL` is wrong. Admin login works independently, but all data operations need the backend.

### Cookies not setting / session not persisting
- In development, make sure you're on `http://localhost:3000` (not 127.0.0.1)
- Check browser dev tools → Application → Cookies
- The cookie name is `glamo-admin-session` in dev, `__Host-glamo-admin-session` in prod

### CORS errors
The backend allows `http://localhost:3000` by default. If using a different port, update `ALLOWED_ORIGINS` in `backend/src/index.ts`.

## Production Deployment

### Frontend (Netlify)
```bash
npm run build
# Deploy .next/ to Netlify
```
Set all environment variables in Netlify dashboard.

### Backend (Cloudflare Workers)
```bash
cd backend
wrangler deploy
```
Set secrets with `wrangler secret put SUPABASE_URL` etc.

### Production URLs
- Frontend: `https://glamonepal.com`
- Backend: `https://api.glamonepal.com`
- Admin: `https://glamonepal.com/admin`

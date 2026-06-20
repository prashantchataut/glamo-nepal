# GLAMO Nepal API — Deployment Guide

## Architecture

The **Hono backend on Cloudflare Worker** is the API server for GLAMO Nepal.

**Key components:**
- **Database**: Turso (libSQL/SQLite) — cloud-hosted, edge-compatible
- **Auth**: Firebase Auth — frontend handles sign-up/sign-in; backend verifies JWTs
- **Cache**: In-memory Map — simple, no external dependency, resets on redeploy
- **Images**: Cloudinary — upload and transformation
- **Email**: Resend — transactional emails
- **Payments**: Khalti + eSewa — Nepal payment gateways

## Cloudflare Worker Deployment

### Prerequisites

1. Node.js 22+ installed
2. Wrangler CLI installed (`npm install -g wrangler` or use `npx wrangler`)
3. Turso account with database created
4. Firebase project created

### Step 1: Create Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create glamo-nepal

# Run schema
turso db shell glamo-nepal < src/scripts/schema.sql

# Seed data
pnpm db:seed
```

### Step 2: Set Environment Variables in Cloudflare

In `wrangler.jsonc` or via Cloudflare Dashboard → Workers → glamo-nepal-api → Settings → Variables:

**Required:**
- `TURSO_DB_URL`
- `TURSO_AUTH_TOKEN`
- `FIREBASE_PROJECT_ID`

**For image uploads:**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**For email:**
- `RESEND_API_KEY`

**For payments:**
- `KHALTI_SECRET_KEY`
- `ESEWA_SECRET_KEY`
- `ESEWA_MERCHANT_CODE`

**For CORS:**
- `FRONTEND_URL`

**For pricing:**
- `FREE_SHIPPING_THRESHOLD` — in paisa (default: `250000` for 2500 NPR)
- `COD_FEE` — in paisa (default: `5000` for 50 NPR)

### Step 3: Create Admin User

1. Sign up via the frontend app
2. Get the user's email from Firebase Console → Authentication
3. Update their role in the database:

```bash
turso db shell glamo-nepal "UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'your@email.com';"
```

### Step 4: Deploy

```bash
cd backend
pnpm deploy
```

### Step 5: Verify Deployment

```bash
curl https://glamo-nepal-api.prashant1327.workers.dev/health
# Should return: {"status":"ok","timestamp":"..."}
```

## Local Development

```bash
# Install dependencies
pnpm install

# Create .env from example
cp .env.example .env
# Edit .env with your Turso and Firebase credentials

# Start development server
pnpm dev
```

The API will be available at `http://localhost:3001`

### Environment Variables for Local Dev

Create `backend/.env` from `backend/.env.example`:

```bash
cp .env.example .env
```

Required variables:
- `TURSO_DB_URL` — your Turso database URL
- `TURSO_AUTH_TOKEN` — your Turso auth token
- `FIREBASE_PROJECT_ID` — your Firebase project ID

## Monitoring

- **Cloudflare Dashboard**: Worker logs, metrics at dash.cloudflare.com
- **Turso Dashboard**: Database metrics, query performance at turso.tech/app
- **Firebase Console**: Auth users, sign-in logs

## Troubleshooting

- **"Database connection failed"**: Verify `TURSO_DB_URL` and `TURSO_AUTH_TOKEN` are correct.
- **"Firebase auth token verification failed"**: Verify `FIREBASE_PROJECT_ID` matches your Firebase project.
- **CORS errors**: Verify `FRONTEND_URL` in Cloudflare env vars matches your frontend domain exactly.
- **"Table not found" errors**: Run `schema.sql` against your Turso database.
- **Empty responses**: Run `pnpm db:seed` to populate the database with initial data.

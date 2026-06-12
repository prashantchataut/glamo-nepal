# GLAMO Nepal API — Deployment Guide

## Architecture

The **Hono backend on Netlify Functions** is the sole API server for GLAMO Nepal. All application routes (auth, products, orders, admin, etc.) are served through Netlify Functions.

**Key components:**
- **Database**: Turso (libSQL/SQLite) — cloud-hosted, edge-compatible
- **Auth**: Firebase Auth — frontend handles sign-up/sign-in; backend verifies JWTs
- **Cache**: In-memory Map — simple, no external dependency, resets on redeploy
- **Images**: Cloudinary — upload and transformation
- **Email**: Resend — transactional emails
- **Payments**: Khalti + eSewa — Nepal payment gateways

## Netlify Functions Deployment

### Prerequisites

1. Node.js 22+ installed
2. Netlify CLI installed (`npm install -g netlify-cli`)
3. Turso account with database created
4. Firebase project created
5. Netlify account linked to your git repo

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

### Step 2: Set Environment Variables in Netlify

In Netlify Dashboard → Site → Settings → Environment variables, set:

**Required:**
- `TURSO_DB_URL` — from `turso db show glamo-nepal`
- `TURSO_AUTH_TOKEN` — from Turso Dashboard → Database → Settings → Tokens
- `FIREBASE_PROJECT_ID` — your Firebase project ID

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

**For rate limiting & idempotency (Redis):**
- `UPSTASH_REDIS_REST_URL` — from Upstash Console → Redis Database → REST URL
- `UPSTASH_REDIS_REST_TOKEN` — from Upstash Console → Redis Database → REST Token
- Without these, rate limiting falls back to per-invocation memory (ineffective on serverless)

**For CORS:**
- `FRONTEND_URL` — your production frontend URL (e.g., `https://glamonepal.com`)

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
# Option A: Deploy via git push (recommended)
git push origin main
# Netlify auto-deploys on push

# Option B: Manual deploy
netlify deploy --prod
```

The `netlify.toml` handles:
- Building the Hono app as a Netlify Function
- Setting the function directory to `netlify/functions`
- Configuring CORS headers

### Step 5: Verify Deployment

```bash
# Health check
curl https://your-site.netlify.app/.netlify/functions/api/health

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

- **Netlify Logs**: Netlify Dashboard → Site → Functions → Logs
- **Turso Dashboard**: Database metrics, query performance at turso.tech/app
- **Firebase Console**: Auth users, sign-in logs

## Troubleshooting

- **"Database connection failed"**: Verify `TURSO_DB_URL` and `TURSO_AUTH_TOKEN` are correct. Check Turso dashboard for database status.
- **"Firebase auth token verification failed"**: Verify `FIREBASE_PROJECT_ID` matches your Firebase project. Check that the frontend uses the same Firebase project.
- **CORS errors**: Verify `FRONTEND_URL` in Netlify env vars matches your frontend domain exactly (including protocol).
- **"Table not found" errors**: Run `schema.sql` against your Turso database. Check with `turso db shell glamo-nepal ".tables"`.
- **Empty responses**: Run `pnpm db:seed` to populate the database with initial data.
- **Function timeout**: Netlify Functions have a 10-second default timeout. For long-running operations, consider upgrading to Netlify Pro for 26-second timeout.
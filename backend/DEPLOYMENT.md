# GLAMO Nepal API — Deployment Guide

## Cloudflare Workers Deployment

### Prerequisites

1. Node.js 18+ installed
2. Wrangler CLI installed (`npm install -g wrangler`)
3. Cloudflare account with Workers, D1, KV, and R2 access

### Step 1: Create Cloudflare Resources

```bash
# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create glamo-nepal-db
# Copy the database_id from the output

# Create KV namespace
wrangler kv:namespace create "GLAMO_KV"
# Copy the id from the output

# Create R2 bucket
wrangler r2 bucket create glamo-nepal-assets
```

### Step 2: Update wrangler.toml

Replace placeholder IDs in `wrangler.toml`:
- `database_id` — from D1 create output
- `id` under `[[kv_namespaces]]` — from KV create output

### Step 3: Generate RSA Key Pair for JWT

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Generate public key
openssl rsa -in private.pem -pubout -out public.pem

# Set as Wrangler secrets (paste the PEM content when prompted)
wrangler secret put JWT_PRIVATE_KEY < private.pem
wrangler secret put JWT_PUBLIC_KEY < public.pem
```

### Step 4: Set Wrangler Secrets

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put R2_PUBLIC_URL
wrangler secret put CLOUDINARY_CLOUD_NAME
wrangler secret put CLOUDINARY_API_KEY
wrangler secret put CLOUDINARY_API_SECRET
wrangler secret put KHALTI_SECRET_KEY
wrangler secret put ESEWA_SECRET_KEY
wrangler secret put ESEWA_MERCHANT_CODE
```

### Step 5: Run Database Migrations

```bash
# Local development
wrangler d1 migrations apply glamo-nepal-db --local

# Production
wrangler d1 migrations apply glamo-nepal-db --remote
```

### Step 6: Seed Database

```bash
# Local
wrangler d1 execute glamo-nepal-db --local --file=migrations/0002_seed_data.sql

# Production
wrangler d1 execute glamo-nepal-db --remote --file=migrations/0002_seed_data.sql
```

### Step 7: Configure R2 Public Access

1. Go to Cloudflare Dashboard → R2 → glamo-nepal-assets
2. Enable R2.dev subdomain or configure custom domain
3. Set `R2_PUBLIC_URL` secret to the public URL

### Step 8: Deploy

```bash
npm run deploy
# or
wrangler deploy
```

### Step 9: Configure Custom Domain

1. Go to Cloudflare Dashboard → Workers → glamo-nepal-api
2. Add custom domain (e.g., `api.glamonepal.com`)
3. Update `FRONTEND_URL` in wrangler.toml to your production frontend URL

## Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Create .dev.vars from example
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your local secrets

# Run local D1 migrations
npm run db:migrate:local

# Seed local database
npm run db:seed:local

# Start development server
npm run dev
```

The API will be available at `http://localhost:8787`

## Monitoring

- **Logs**: `wrangler tail` for real-time logs
- **D1 Console**: `wrangler d1 console glamo-nepal-db`
- **KV**: `wrangler kv:key list --namespace-id=<id>`

## Troubleshooting

- **JWT errors**: Ensure RSA keys are properly set as secrets (full PEM format including headers/footers)
- **D1 errors**: Check migrations have been applied (`wrangler d1 migrations list glamo-nepal-db`)
- **CORS issues**: Verify `FRONTEND_URL` in wrangler.toml matches your frontend origin
- **KV cache issues**: Clear with `wrangler kv:key delete --namespace-id=<id> "<key>"`
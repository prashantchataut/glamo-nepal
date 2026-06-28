# GLAMO NEPAL

Premium Nepali beauty, skincare, cosmetics and lifestyle ecommerce storefront for **GLAMO NEPAL**.

## Business constants

- Store: GLAMO NEPAL
- Address: Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal
- Phone: +977 9818212188
- Instagram: @glamo_nepal
- Instagram URL: https://www.instagram.com/glamo_nepal/
- Currency: NPR
- Free shipping threshold: NPR 2,500
- Payments: Khalti, eSewa, Cash on Delivery, Cards

## Project structure

```txt
glamo/
  src/          Next.js 15 App Router frontend (Cloudflare Workers)
  public/       Local storefront and admin imagery
  scripts/      Static QA and source checks
  backend/      Hono API on Cloudflare Workers
```

## Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Cloudflare Workers (`glamo-nepal`) | `https://www.glamonepal.com` |
| Backend | Cloudflare Workers (`glamo-nepal-api`) | `https://api.glamonepal.com` |

Pushing to `master` triggers automatic deployment via GitHub Actions.

## Commands

```bash
pnpm install          # Install frontend deps
pnpm dev              # Start frontend dev server (localhost:3000)
pnpm typecheck        # TypeScript check
pnpm lint             # ESLint
pnpm build            # Next.js build
pnpm build:cf         # OpenNext Cloudflare build
pnpm deploy:cf        # Build + deploy frontend to Cloudflare
pnpm test             # Run unit tests

cd backend
pnpm install          # Install backend deps
pnpm dev              # Start backend dev server (localhost:3001)
pnpm typecheck        # TypeScript check
```

## Admin access

- `/admin/login` — protected admin sign-in
- `/admin` — dashboard, products, orders, stock, banners, customers, analytics and settings

## Security

This project implements defence-in-depth security controls. See the source code and `docs/` for implementation details.

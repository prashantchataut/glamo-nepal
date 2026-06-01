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
  src/          Next.js 14 App Router frontend
  public/       Local storefront and admin imagery
  scripts/      Static QA and source checks
  backend/      Express + Prisma backend scaffold
```

## Frontend commands

```bash
npm install
npm run qa:static
npm run typecheck
npm run lint
npm run build
```

## Admin access

Admin panel routes:

- `/admin/login` — protected admin sign-in
- `/admin` — dashboard, products, orders, stock, banners, customers, analytics and settings

Set these in `.env.local` before using the admin panel (see `.env.example` for the full list):

```env
ADMIN_EMAIL=<your-admin-email>
ADMIN_PASSWORD=<generate-a-strong-password>
ADMIN_SESSION_SECRET=<generate-with:-node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
AUTH_SECRET=<generate-with:-node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

**Never commit real credentials.** Generate unique values for each environment.

## Security

This project implements defence-in-depth security controls. See the source code and `docs/` for implementation details.

## Backend commands

```bash
cd backend
npm install
npm run typecheck
npm run build
npm run dev
```

The backend folder is included for production API work. Current admin UI is protected by a signed HTTP-only Next.js admin session and is ready to be connected to backend admin APIs.

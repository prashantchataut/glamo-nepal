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

Set these in `.env.local` before using the admin panel:

```env
ADMIN_EMAIL=admin@glamonepal.com
ADMIN_PASSWORD=ChangeMe@123
ADMIN_SESSION_SECRET=replace_with_a_long_random_secret_at_least_32_chars
AUTH_SECRET=replace_with_a_long_random_secret_at_least_32_chars
```

The default credentials are only for local setup. Change them before deployment.

## Backend commands

```bash
cd backend
npm install
npm run typecheck
npm run build
npm run dev
```

The backend folder is included for production API work. Current admin UI is protected by a signed HTTP-only Next.js admin session and is ready to be connected to backend admin APIs.

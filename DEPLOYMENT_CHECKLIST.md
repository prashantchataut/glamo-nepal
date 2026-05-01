# GLAMO NEPAL Frontend Deployment Checklist

## Before any production deployment

- Run `npm install` or `npm ci`.
- Run `npm run static:check`.
- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build`.
- Confirm there is no `src/app/(auth)` route group or duplicate `/login`, `/register`, `/forgot-password`, `/reset-password` pages.
- Confirm `.env.local` has the production values listed in `.env.example`.

## Business verification

- Confirm Instagram handle is `@glamo_nepal`.
- Confirm Instagram URL is `https://www.instagram.com/glamo_nepal/`.
- Confirm phone is `+977 9818212188`.
- Confirm address is `Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal`.
- Replace placeholder product images with supplier-approved images.
- Replace mock stock, prices, ingredients and claims with supplier-approved data.
- Review privacy, terms, shipping, returns and refund policies with legal/business owner.

## Backend/payment readiness

- Replace signed admin session and future database auth cookies with signed HTTP-only sessions.
- Add backend RBAC for `/admin`; middleware is only frontend UX protection.
- Add server-side inventory checks before order creation.
- Add Khalti/eSewa/card credential handling on server.
- Add payment verification webhooks/server callbacks.
- Add courier/COD district rules and delivery fee API.
- Add analytics IDs and consent strategy.

## Admin access

- Admin login route: `/admin/login`.
- Admin panel route: `/admin`.
- Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` and `AUTH_SECRET` in `.env.local`.
- Do not deploy with the default local password.

## Additional pre-launch checks from latest pass

- Confirm every province/district delivery rule in `src/lib/delivery.ts` with the courier partner.
- Decide final free-delivery thresholds for Kathmandu Valley, metro routes and remote routes.
- Replace mock COD/prepaid availability with backend-driven shipping quotes before accepting real orders.
- Confirm public environment variables in `.env.example` and keep payment secrets server-side only.
- Connect analytics IDs only after privacy/cookie policy language is approved.
- Review `/collections/low-stock`; this route is useful for QA/admin review and should be hidden or protected if not intended for public shoppers.
- Run `npm run preflight` before deployment.


## Additional production checks added

- Run `npm run test:smoke` to confirm key route files and store contracts.
- Run `npm run perf:source` to catch obvious debug logs and image hotlinks.
- Manually review `/routines`, `/brands`, `/search`, `/product/[slug]`, and out-of-stock products.
- Confirm bundle pricing is backend-calculated before enabling real discounts.
- Confirm stock-alert consent language and backend notification storage before collecting users.

# GLAMO NEPAL Frontend Handoff

This project has been regenerated from the uploaded GLAMO frontend zip and expanded into a premium beauty/cosmetics ecommerce frontend for **GLAMO NEPAL**.

## Brand and business details applied

- Site name: GLAMO NEPAL
- Location: Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal
- Phone: +977 9818212188
- Website: https://glamonepal.com
- Instagram: @glamo_nepal
- Instagram URL: https://www.instagram.com/glamo_nepal/
- Currency: NPR
- Payment methods displayed: Khalti, eSewa, Cash on Delivery, Cards
- Fonts: Cormorant Garamond for headings, DM Sans for body

## Implemented frontend areas

- Storefront routes: `/`, `/shop`, `/product/[slug]`, `/cart`, `/checkout`, `/checkout/success`
- Content routes: `/blog`, `/blog/[slug]`, `/about`, `/contact`, `/faq`, `/shipping`, `/returns`, `/privacy`, `/terms`
- Policy aliases: `/shipping-policy`, `/return-policy`, `/privacy-policy`, `/terms-and-conditions`
- Auth/account routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/account`, `/account/profile`, `/account/orders`, `/account/orders/[id]`, `/account/wishlist`, `/account/addresses`, `/account/password`
- Utility/admin routes: `/compare`, `/admin`, `app/not-found.tsx`
- SEO: `app/sitemap.ts`, `app/robots.ts`, product structured data, breadcrumb schema, blog article schema and organization schema
- Premium loading and error states for important segments
- Middleware-based mock protection for account/admin pages

## Commerce features

- Expanded Nepal-market mock catalog in `src/lib/mock/products.ts`
- Original GLAMO-facing descriptions and neutral local placeholder SVG images
- Product card improvements: NPR formatting, hover zoom, wishlist, compare, badges, stock state, rating, accessible focus states and analytics hooks
- Product detail page: variants/shades, SKU copy, share action, benefits, how-to-use, ingredients, delivery/returns, FAQ, review summary, related products, recently viewed, sticky add-to-cart
- Shop filters: category, subcategory, brand, concern, skin type, Made in Nepal, in-stock, price and search
- Persistent Zustand stores for cart, wishlist, compare, recently viewed, mock auth and checkout simulation
- Cart page with totals, quantity controls, free delivery/free gift messaging
- Checkout page with Nepal phone validation, province/district/city/ward/address fields, COD checker, delivery fee, gift wrap, notes, payment selector and simulated order placement

## Backend-ready contracts and adapters

Added or expanded:

- `src/lib/api/contracts.ts`
- `src/lib/api/catalog.ts`
- `src/lib/api/client.ts`
- `src/lib/api/checkout.ts`
- `src/lib/api/customer.ts`

These define Product, Category, Cart, Wishlist, Customer, Address, Order, Payment Method, Checkout Payload, API response wrappers and adapter functions for future backend integration.

## Important production note

This is still a frontend-only build. Do not launch with mock product claims, placeholder imagery, simulated checkout, mock auth, mock admin protection or placeholder legal policy copy.

## Latest production-readiness additions

This version adds a stronger launch-prep layer on top of the ecommerce frontend:

- Delivery rules are centralized in `src/lib/delivery.ts` so the owner can later replace mock rules with courier/COD business logic.
- Checkout now calculates delivery fee by province/district, shows free-delivery progress and disables COD when the selected district is prepaid-only.
- New collection routes provide campaign-ready merchandising pages for best sellers, new arrivals, Made in Nepal, festival-ready, under NPR 1,000 and low-stock review.
- API adapter stubs now cover catalog, customer, checkout, auth, orders and admin flows.
- Static QA now checks route duplication, local imports, GLAMO content, product data quality, source-level accessibility and environment placeholders.

Recommended local validation:

```bash
npm install
npm run static:check
npm run typecheck
npm run lint
npm run build
```

Use `npm run preflight` once dependencies are installed and the local environment is stable.


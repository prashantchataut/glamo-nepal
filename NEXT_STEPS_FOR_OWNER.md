# Next Steps for GLAMO NEPAL Owner

Before production launch, GLAMO NEPAL must provide, approve or connect the following.

## 1. Real product images

- Use original GLAMO photography or supplier-approved image assets.
- Replace local placeholder SVGs in `public/images`.
- Confirm image aspect ratios for product cards, gallery thumbnails, blog covers and hero banners.

## 2. Supplier-approved product data

- Confirm product names, SKU, MRP, sale price, stock, origin, size, variants/shades, product claims, benefits, ingredients and usage instructions.
- Replace mock catalog entries in `src/lib/mock/products.ts` or connect the backend catalog API.
- Review all beauty claims for accuracy and compliance before publishing.

## 3. Backend API

- Required APIs: product catalog, inventory, customer account, cart, wishlist, orders, address book, checkout, admin inventory and campaigns.
- Replace mock catalog and Zustand-only flows with backend calls using `src/lib/api/*` adapters.
- Add server-side validation for every checkout/customer/admin operation.

## 4. Authentication and admin security

- Replace mock cookie auth with signed HTTP-only secure sessions or an approved auth provider.
- Add real login/register/reset flows, CSRF protection, rate limiting and session rotation.
- Add admin RBAC, audit logs, permissioned APIs and server-side authorization.

## 5. Payment credentials

- Khalti public/private keys and callback verification.
- eSewa merchant ID and verification flow.
- Card gateway provider and PCI-safe redirect/tokenization flow.
- Verify payment status server-side before creating confirmed orders.

## 6. Courier and COD rules

- Final district coverage, delivery estimates, delivery fees, free delivery rules and COD restrictions.
- Replace mock logic in `src/components/checkout/CodAvailabilityChecker.tsx`.
- Add courier tracking events for the account order timeline.

## 7. Legal approval

- Approve Privacy Policy, Terms & Conditions, Shipping Policy, Returns Policy, cancellation, damaged goods and dispute policies.
- Confirm whether beauty products are returnable after opening and how photo evidence should be handled.

## 8. Analytics and marketing

- Provide Google Analytics ID and Meta Pixel if needed.
- Confirm cookie/consent strategy.
- Connect frontend analytics events in `src/lib/analytics.ts` to the approved analytics stack.

## Suggested validation commands

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run validate
```

If validation fails after backend work begins, check imports, environment variables and any API response shape changes first.

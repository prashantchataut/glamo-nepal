# GLAMO NEPAL Product Data Guide

This frontend now includes an expanded in-stock mock catalog for Nepal beauty ecommerce testing. The mock catalog is useful for UI, filtering, checkout, admin inventory and SEO development, but it is **not production product truth**.

## Owner/supplier data needed before launch

For every real product, provide:

- Official product name and brand spelling
- Supplier-approved short and long descriptions
- MRP, selling price, sale price, stock count and low-stock threshold in NPR
- SKU, barcode if available, batch number and expiry date where relevant
- Size, origin, importer/supplier and Made in Nepal status
- INCI/ingredient list exactly as approved
- Usage directions and warnings
- Skin type/concern tags that are safe and not medical claims
- Shade names, shade images and shade stock where relevant
- Return eligibility for sealed/opened condition
- Product images owned by GLAMO or approved by the supplier

## Current mock-data safety rules

- Product descriptions are original GLAMO-facing text.
- Images are local neutral SVG placeholders.
- Public Nepal-market sites were used only for category and price-band direction.
- Do not launch with mock descriptions, placeholder images or unverified ingredient/claim data.

## Reference categories used only for benchmarking

The mock stock includes skincare, sunscreen, Korean skincare, face wash, serum, micellar water, makeup, lipstick, foundation, haircare, bodycare, local Nepal-made products and tools.

## Handoff mapping

Recommended backend fields should map to `src/lib/api/contracts.ts` and the current mock fields in `src/store/useCartStore.ts`. Keep the frontend contract stable so the real API can replace `src/lib/mock/products.ts` without rewriting the UI.

## Bundle and routine data now supported

The frontend now includes routine/bundle pages. To make them production-ready, provide:

- bundle title and slug
- bundle products/SKUs
- backend-calculated bundle price and discount rules
- routine step labels and supplier-approved usage copy
- skin type and concern mapping
- eligibility rules for coupons/free gifts
- final legal/claims review for each routine

Bundle pricing must be recalculated on the backend. Frontend bundle prices are mock display values only.

## Back-in-stock alert requirements

The stock-alert UI is frontend-only. Production requires:

- consent capture language
- backend storage for email/phone
- rate limiting and spam protection
- email/SMS provider integration
- unsubscribe and privacy handling
- event logging for inventory restock notifications

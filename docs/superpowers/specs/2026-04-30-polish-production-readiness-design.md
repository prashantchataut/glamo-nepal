# GLAMO NEPAL Polish & Production-Readiness Design

**Date:** 2026-04-30
**Scope:** User-visible fixes only — remove dev-facing text, add newsletter logic, fix brand logos, fix SEO schema, fix legal metadata

## Problem Statement

The GLAMO NEPAL frontend contains developer-facing text visible to real users: "mock", "draft", "frontend-only", "before launch", "owner action needed", "simulated", and "placeholder" language across legal pages, checkout, contact, brands, collections, and component UI. This undermines brand credibility and makes the site look unfinished to customers.

Additionally, the newsletter form does nothing on submit, brand logos show as text names instead of images, and the Organization JSON-LD uses an incorrect schema type.

## Design Decisions

### D1: Dev text replacement strategy — Replace with real copy
All developer-facing text is replaced with professional, customer-facing language. Where the text references internal processes (e.g., "must be configured by the owner"), it is rewritten to describe the customer-facing outcome (e.g., "Delivery coverage varies by area"). Legal pages are rewritten to read as if they are active policies, not drafts.

### D2: Newsletter form — Client-side success state
The newsletter form gets a simple client-side state machine: idle → submitting → success. No backend API call is made (there is no newsletter API yet). On submit, the form shows a thank-you message. A TODO comment marks where the real API call should go.

### D3: Brand logos — Use existing SVG assets
The BrandsMarquee component switches from rendering text `<span>` elements to rendering `<Image>` components using the brand logo SVGs already in `/public/brands/`. This uses the `BRAND_LOGOS` constant that already has `image` properties pointing to these files.

### D4: Organization schema — Change from BeautySalon to OnlineStore
The `organizationJsonLd()` function in `seo.ts` changes its `@type` from `"BeautySalon"` to `"OnlineStore"` to correctly represent an ecommerce business rather than a physical salon.

### D5: Legal metadata — Remove "draft" language
The meta descriptions for terms, shipping, returns, and privacy pages currently include the word "draft". These are rewritten to read as active, published policies.

### D6: Internal notes hidden from customers
- `CodAvailabilityChecker`: The `ownerNote` field is removed from customer-facing rendering. It remains in the data model for internal reference.
- Routine detail pages: The `bundle.ownerNote` warning banner is removed from customer view.
- Contact page: The "Add official store hours..." note is removed.
- Collections detail: The "Add products..." note is removed.
- Brands page: "Supplier-ready catalog" eyebrow is changed to customer-facing language.
- About page: "supplier-approved claims" is changed to customer-facing language.
- FAQ: The "Are these products final?" answer is rewritten.
- LegalLayout: "Draft for owner/legal approval" footer is changed to a standard "Last updated" line.

## Files Modified

### 1. `src/lib/legal.ts` — Rewrite all legal content
Replace all dev-facing text with professional customer-facing language. Key changes:
- Privacy: "owner" → remove internal stakeholder references, describe data practices as active policy
- Terms: "draft" → remove, "mock products" → "product information", "before launch" → remove
- Shipping: "simulated" → "calculated", "mock rule" → remove, "owner confirms" → "available at"
- Returns: "owner policy" → "our return policy", "frontend placeholder" → remove, "draft" → remove

### 2. `src/app/terms/page.tsx` — Fix metadata
Change description from "Review draft GLAMO NEPAL ecommerce terms" to "GLAMO NEPAL terms and conditions for orders, payments, product information and customer support."

### 3. `src/app/shipping/page.tsx` — Fix metadata
Change description from "Read draft GLAMO NEPAL shipping" to "GLAMO NEPAL shipping coverage, delivery estimates, fees and store pickup information."

### 4. `src/app/returns/page.tsx` — Fix metadata
Change description from "Read draft GLAMO NEPAL returns" to "GLAMO NEPAL returns, exchange, refund and damaged item policy."

### 5. `src/app/privacy/page.tsx` — Fix metadata
Change description from "Read the GLAMO NEPAL draft privacy policy" to "GLAMO NEPAL privacy policy for customer data, orders, analytics and service providers."

### 6. `src/components/legal/LegalLayout.tsx` — Fix footer
Change "Draft for owner/legal approval" to "Last updated: April 2026"

### 7. `src/app/contact/page.tsx` — Remove dev note
Remove "Add official store hours and Google Maps embed once confirmed by the owner." Replace with "Store hours and map coming soon."

### 8. `src/app/brands/page.tsx` — Fix eyebrow text
Change "Supplier-ready catalog" to "Curated beauty brands"

### 9. `src/app/about/page.tsx` — Fix authenticity text
Change "Product pages are designed to highlight supplier-approved claims, ingredients, sourcing and clear beauty guidance." to "Product pages highlight authentic ingredients, clear sourcing and honest beauty guidance."

### 10. `src/app/faq/page.tsx` — Rewrite product answer
Change "The catalog is being finalized with supplier-approved product details, pricing, ingredients and imagery. Please contact GLAMO if you need confirmation before ordering." to "We continuously update our catalog with accurate product details, pricing and ingredients. If you have questions about a specific product, please contact us."

### 11. `src/app/collections/[slug]/page.tsx` — Remove dev note
Remove "Add products to this collection once real supplier data is ready."

### 12. `src/components/checkout/CodAvailabilityChecker.tsx` — Hide ownerNote from customers
Remove the `<p>` element that renders `rule.ownerNote` to customers. This is internal reference data.

### 13. `src/app/routines/[slug]/page.tsx` — Hide ownerNote from customers
Remove the warning banner that displays `bundle.ownerNote` to customers.

### 14. `src/components/home/NewsletterSignup.tsx` — Add submit logic
Add `useState` for email and submitted state. On submit: prevent default, set submitted to true, show thank-you message. Add TODO comment for real API integration.

### 15. `src/components/home/BrandsMarquee.tsx` — Use logo images
Replace text `<span>` rendering with `<Image>` components using `brand.image` from BRAND_LOGOS. Add `import Image from "next/image"`.

### 16. `src/lib/seo.ts` — Fix Organization schema
Change `@type: "BeautySalon"` to `@type: "OnlineStore"` in `organizationJsonLd()`.

## Out of Scope
- Admin page dev text (behind auth, not customer-visible)
- Product mock data `sourceAuditNote` fields (not rendered to users)
- Internal code cleanup (compressed JSX, unused deps)
- Delivery.ts `ownerNote` data (kept in data model, just hidden from customer rendering)
- Adding real legal copy (requires owner/legal review)
- Adding real blog content
- Replacing placeholder product images
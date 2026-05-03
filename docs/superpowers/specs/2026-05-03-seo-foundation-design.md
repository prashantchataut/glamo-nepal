# SEO Foundation — Design Spec

**Date:** 2026-05-03  
**Scope:** Comprehensive technical SEO, structured data, on-page SEO, performance, and LLM discoverability for GLAMO NEPAL.

---

## A) Technical SEO Fixups

1. **Canonical URLs**: Fix `/cart` and `/compare` layouts to use absolute canonical URLs via `absoluteUrl()` instead of relative paths.
2. **Twitter meta**: Add `twitter:site` (`@glamo_nepal`) and `twitter:creator` to `createMetadata()` in `seo.ts`.
3. **SITE_CONFIG additions**: Add `logo`, `openingHours`, and `coordinates` to `constants.ts`.
4. **NEXT_PUBLIC_SITE_URL**: Add to `.env.example` with `https://glamonepal.com` as default.

## B) Structured Data (JSON-LD)

New generators in `src/lib/seo.ts`:

1. **`faqJsonLd(items)`** — `FAQPage` schema for `/faq` page.
2. **`localBusinessJsonLd()`** — `LocalBusiness` schema with `HealthAndBeautyStore` subtype.
3. **`webSiteJsonLd()`** — `WebSite` schema with `SearchAction`.
4. **`itemListJsonLd(items)`** — `ItemList` schema for product listing pages.

Where each schema renders:

| Page | Existing | New |
|------|----------|-----|
| Root layout | Organization | + LocalBusiness, WebSite |
| `/faq` | — | FAQPage |
| `/category/[slug]` | — | BreadcrumbList, ItemList |
| `/shop` | — | BreadcrumbList, ItemList |
| `/about` | — | BreadcrumbList |
| `/contact` | — | BreadcrumbList |

No fake ratings or reviews.

## C) On-Page SEO — Category Descriptions & Page Copy

Category SEO metadata:

| Category | Title | Description |
|----------|-------|-------------|
| Skincare | Sunscreen in Nepal — SPF 50, SPF 30 & Daily Skincare | Shop sunscreen in Nepal, plus cleansers, moisturizers, serums and face masks. Authentic skincare products delivered across Nepal from GLAMO NEPAL, Kathmandu. |
| Makeup | Makeup in Nepal — Foundation, Lipstick, Eyeshadow & More | Shop makeup in Nepal: foundation, lipstick, eyeshadow, blush and kajal. Authentic beauty products with COD and fast delivery across Nepal. |
| Haircare | Haircare in Nepal — Shampoo, Conditioner & Hair Treatments | Shop haircare in Nepal: shampoo, conditioner, hair oil and styling products for all hair types. Delivered across Nepal from GLAMO NEPAL, Kathmandu. |
| Fragrance | Fragrance in Nepal — Perfumes & Body Mists | Shop fragrance in Nepal: perfumes, body mists and deodorants for men and women. Authentic scents with delivery across Nepal from GLAMO NEPAL. |
| Bath & Body | Bath & Body in Nepal — Body Lotion, Soap & Body Wash | Shop bath and body products in Nepal: body lotion, soap, body wash and hand cream. Premium skincare delivered across Nepal from GLAMO NEPAL. |
| Men's Grooming | Men's Grooming in Nepal — Face Wash, Shaving & Skincare | Shop men's grooming in Nepal: face wash, shaving cream, moisturizers and hair styling. Authentic grooming products delivered across Nepal. |

FAQ page: Extract 12 Q&A pairs into `src/lib/data/faq.ts` for both UI and JSON-LD.

About page: Add structured "About GLAMO NEPAL" section with brand story, address, phone, social links.

## D) Performance (Core Web Vitals)

Add explicit `sizes` props to hero images missing them:
- `/brands/[slug]` — brand hero image
- `/collections/[slug]` — collection hero image
- `/routines/[slug]` — routine hero image

## E) LLM Discoverability

- Enrich Organization JSON-LD with `logo`, `openingHours`, `geo` coordinates
- Add structured brand section to About page
- Add `ContactPage` schema to Contact page
- Ensure consistent brand signals across Organization, LocalBusiness, About, Contact, SITE_CONFIG

## Files Changed

| File | Change |
|------|--------|
| `src/lib/seo.ts` | Add `faqJsonLd`, `localBusinessJsonLd`, `webSiteJsonLd`, `itemListJsonLd`. Add `twitter:site`/`twitter:creator` to `createMetadata`. |
| `src/lib/constants.ts` | Add `logo`, `openingHours`, `coordinates` to SITE_CONFIG |
| `src/lib/data/faq.ts` | **NEW** — Extract FAQ Q&A data array |
| `src/lib/data/categories.ts` (or equivalent) | Add `seoTitle`/`seoDescription` to each category |
| `src/app/layout.tsx` | Add LocalBusiness + WebSite JSON-LD |
| `src/app/faq/page.tsx` | Import FAQ data, add `FAQPage` JSON-LD |
| `src/app/category/[slug]/page.tsx` | Add BreadcrumbList + ItemList JSON-LD, use `seoTitle`/`seoDescription` |
| `src/app/shop/page.tsx` | Add BreadcrumbList + ItemList JSON-LD |
| `src/app/about/page.tsx` | Add BreadcrumbList JSON-LD, enrich with structured brand section |
| `src/app/contact/page.tsx` | Add BreadcrumbList JSON-LD, add `ContactPage` schema |
| `src/app/cart/layout.tsx` | Fix canonical URL to absolute |
| `src/app/compare/layout.tsx` | Fix canonical URL to absolute |
| `src/app/brands/[slug]/page.tsx` | Add `sizes` prop to hero image |
| `src/app/collections/[slug]/page.tsx` | Add `sizes` prop to hero image |
| `src/app/routines/[slug]/page.tsx` | Add `sizes` prop to hero image |
| `.env.example` | Add `NEXT_PUBLIC_SITE_URL` |
# SEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive technical SEO, structured data, on-page SEO, performance, and LLM discoverability so GLAMO NEPAL ranks for "sunscreen nepal", "skincare nepal", "vitamin c serum nepal", etc.

**Architecture:** Extend the existing `src/lib/seo.ts` + `JsonLd.tsx` pattern. Add new JSON-LD generators (FAQ, LocalBusiness, WebSite, ItemList), enrich SITE_CONFIG, extract FAQ data, add category SEO metadata, fix canonical URLs, add missing `sizes` props. All changes plug into existing patterns — no new patterns introduced.

**Tech Stack:** Next.js 14 Metadata API, Schema.org JSON-LD, TypeScript, Tailwind CSS

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/seo.ts` | All JSON-LD generators + createMetadata (add faqJsonLd, localBusinessJsonLd, webSiteJsonLd, itemListJsonLd, twitter:site/creator) |
| `src/lib/constants.ts` | SITE_CONFIG (add logo, openingHours, coordinates) |
| `src/lib/data/faq.ts` | **NEW** — FAQ Q&A data array for both UI and JSON-LD |
| `src/lib/mock/products.ts` | CATEGORIES array (add seoTitle, seoDescription fields) |
| `src/app/layout.tsx` | Add LocalBusiness + WebSite JSON-LD |
| `src/app/faq/page.tsx` | Import FAQ data, add FAQPage JSON-LD |
| `src/app/category/[slug]/page.tsx` | Add BreadcrumbList + ItemList JSON-LD, use seoTitle/seoDescription |
| `src/app/shop/page.tsx` | Add BreadcrumbList + ItemList JSON-LD |
| `src/app/about/page.tsx` | Add BreadcrumbList JSON-LD, enrich with structured brand section |
| `src/app/contact/page.tsx` | Add BreadcrumbList JSON-LD |
| `src/app/cart/layout.tsx` | Fix canonical URL to absolute |
| `src/app/compare/layout.tsx` | Fix canonical URL to absolute |
| `src/app/brands/[slug]/page.tsx` | Add `sizes` prop to hero image |
| `src/app/collections/[slug]/page.tsx` | Add `sizes` prop to hero image |
| `src/app/routines/[slug]/page.tsx` | Add `sizes` prop to hero image |

---

### Task 1: Enrich SITE_CONFIG and add category SEO metadata

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/mock/products.ts`

- [ ] **Step 1: Add logo, openingHours, coordinates to SITE_CONFIG**

In `src/lib/constants.ts`, add three new fields to `SITE_CONFIG`:

```ts
export const SITE_CONFIG = {
  name: "GLAMO",
  tagline: "Nepal",
  fullTitle: "GLAMO NEPAL",
  description: "Premium Nepali beauty, cosmetics and personal care curated from Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal.",
  phone: "+977 9818212188",
  whatsapp: "https://wa.me/9779818212188",
  email: "hello@glamonepal.com",
  website: "https://glamonepal.com",
  address: "Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal",
  currency: "NPR",
  instagramHandle: "@glamo_nepal",
  paymentMethods: ["Khalti", "eSewa", "Cash on Delivery", "Cards"],
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/glamo_nepal/",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/glamonepal",
  },
  logo: "/images/logo.svg",
  openingHours: "Mo-Fr 10:00-19:00, Sa 10:00-17:00",
  coordinates: { latitude: 27.6944, longitude: 85.3244 },
};
```

- [ ] **Step 2: Add seoTitle and seoDescription to each CATEGORIES entry**

In `src/lib/mock/products.ts`, update the `CATEGORIES` array to add `seoTitle` and `seoDescription` fields:

```ts
export const CATEGORIES = [
  { name: "Skincare", slug: "skincare", description: "Cleansers, serums, moisturizers and SPF chosen for Nepal's climate.", image: "/images/categories/skincare.svg", subCategories: ["Cleansers", "Serums", "Moisturizers", "Masks", "Sunscreens", "Toners"], seoTitle: "Sunscreen in Nepal — SPF 50, SPF 30 & Daily Skincare", seoDescription: "Shop sunscreen in Nepal, plus cleansers, moisturizers, serums and face masks. Authentic skincare products delivered across Nepal from GLAMO NEPAL, Kathmandu." },
  { name: "Makeup", slug: "makeup", description: "Everyday base, lip, eye and cheek essentials for polished looks.", image: "/images/categories/makeup.svg", subCategories: ["Foundation", "Lipstick", "Mascara", "Blush", "Concealer", "Tint"], seoTitle: "Makeup in Nepal — Foundation, Lipstick, Eyeshadow & More", seoDescription: "Shop makeup in Nepal: foundation, lipstick, eyeshadow, blush and kajal. Authentic beauty products with COD and fast delivery across Nepal." },
  { name: "Haircare", slug: "haircare", description: "Shampoo, oils and treatments for humidity, frizz and scalp care.", image: "/images/categories/haircare.svg", subCategories: ["Shampoo", "Conditioner", "Hair Oil", "Treatment", "Serum"], seoTitle: "Haircare in Nepal — Shampoo, Conditioner & Hair Treatments", seoDescription: "Shop haircare in Nepal: shampoo, conditioner, hair oil and styling products for all hair types. Delivered across Nepal from GLAMO NEPAL, Kathmandu." },
  { name: "Bodycare", slug: "bodycare", description: "Creams, lotions and body rituals for soft, healthy skin.", image: "/images/categories/bodycare.svg", subCategories: ["Body Lotion", "Body Scrub", "Body Oil", "Hand Care"], seoTitle: "Bath & Body in Nepal — Body Lotion, Soap & Body Wash", seoDescription: "Shop bath and body products in Nepal: body lotion, soap, body wash and hand cream. Premium skincare delivered across Nepal from GLAMO NEPAL." },
  { name: "Fragrance", slug: "fragrance", description: "Soft perfumes, mists and roll-ons for everyday wear.", image: "/images/categories/fragrance.svg", subCategories: ["Perfume", "Body Mist", "Roll On"], seoTitle: "Fragrance in Nepal — Perfumes & Body Mists", seoDescription: "Shop fragrance in Nepal: perfumes, body mists and deodorants for men and women. Authentic scents with delivery across Nepal from GLAMO NEPAL." },
  { name: "Tools", slug: "tools", description: "Brushes, sponges and beauty tools for a cleaner routine.", image: "/images/categories/tools.svg", subCategories: ["Brushes", "Sponges", "Accessories"], seoTitle: "Beauty Tools in Nepal — Brushes, Sponges & Accessories", seoDescription: "Shop beauty tools in Nepal: brushes, sponges and accessories for a cleaner routine. Authentic beauty tools delivered across Nepal from GLAMO NEPAL." },
];
```

Note: The `Category` type in the codebase (used by `Product`) needs to be updated to accept these new fields. Check if `CATEGORIES` has a type definition — if it's just an inline array literal, the new fields will be inferred automatically.

- [ ] **Step 3: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors (or only errors related to the Category type not having seoTitle/seoDescription — if so, update the type)

---

### Task 2: Add new JSON-LD generators to seo.ts

**Files:**
- Modify: `src/lib/seo.ts`

- [ ] **Step 1: Add faqJsonLd function**

Add after the existing `breadcrumbJsonLd` function:

```ts
export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
```

- [ ] **Step 2: Add localBusinessJsonLd function**

```ts
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HealthAndBeautyStore"],
    name: SITE_CONFIG.fullTitle,
    url: SITE_CONFIG.website,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Naya Baneshwor, Mantra In & Out Square",
      addressLocality: "Kathmandu",
      addressRegion: "Bagmati",
      postalCode: "44600",
      addressCountry: "NP",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE_CONFIG.coordinates.latitude,
      longitude: SITE_CONFIG.coordinates.longitude,
    },
    image: absoluteUrl(SITE_CONFIG.logo),
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "17:00",
      },
    ],
    sameAs: [SITE_CONFIG.social.instagram, SITE_CONFIG.social.facebook].filter(Boolean),
    currenciesAccepted: SITE_CONFIG.currency,
    paymentAccepted: SITE_CONFIG.paymentMethods.join(", "),
  };
}
```

- [ ] **Step 3: Add webSiteJsonLd function**

```ts
export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.fullTitle,
    url: SITE_CONFIG.website,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.website}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
```

- [ ] **Step 4: Add itemListJsonLd function**

```ts
export function itemListJsonLd(items: Array<{ name: string; url: string; image?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.url),
      ...(item.image ? { image: absoluteUrl(item.image) } : {}),
    })),
  };
}
```

- [ ] **Step 5: Add twitter:site and twitter:creator to createMetadata**

In the `createMetadata` function, update the `twitter` object to include `site` and `creator`:

```ts
twitter: {
  card: "summary_large_image",
  title: `${title} | ${siteName}`,
  description,
  images: [imageUrl],
  site: "@glamo_nepal",
  creator: "@glamo_nepal",
},
```

- [ ] **Step 6: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 3: Extract FAQ data into reusable module

**Files:**
- Create: `src/lib/data/faq.ts`
- Modify: `src/app/faq/page.tsx`

- [ ] **Step 1: Create `src/lib/data/faq.ts`**

```ts
export const FAQ_ITEMS = [
  { question: "Where do you deliver?", answer: "GLAMO NEPAL delivers inside Kathmandu Valley and to many locations across Nepal through available courier partners. Delivery availability is confirmed during checkout." },
  { question: "How long does Kathmandu Valley delivery take?", answer: "Most Kathmandu Valley orders are prepared for delivery within 1 to 2 business days, depending on stock, address details and courier timing." },
  { question: "How long does outside-Valley delivery take?", answer: "Outside-Valley orders usually take 3 to 5 business days after dispatch. Remote areas may require additional time." },
  { question: "Which payment methods are available?", answer: "You can choose Khalti, eSewa, Cash on Delivery or Cards where those options are available for your order and location." },
  { question: "Is Cash on Delivery available?", answer: "Cash on Delivery depends on district, order value and courier coverage. The checkout page shows availability before you place an order." },
  { question: "Are products authentic?", answer: "GLAMO NEPAL curates beauty products with authenticity, clear product information and careful sourcing in mind." },
  { question: "Can I return a product?", answer: "Returns are considered within 7 days for eligible unused, unopened and sealed products. Beauty and hygiene items may have restrictions once opened." },
  { question: "What if an item arrives damaged or incorrect?", answer: "Contact GLAMO NEPAL as soon as possible with your order details and clear photos so the support team can review the issue." },
  { question: "Do you offer gift wrapping?", answer: "Gift wrapping is available from checkout when the service is offered for your order." },
  { question: "How do I choose products for sensitive skin?", answer: "Review ingredients, patch test new products and avoid items with known triggers. For medical skin concerns, consult a qualified professional." },
  { question: "Can I pick up from the store?", answer: "Store pickup may be available from Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal. Contact the team before visiting to confirm timing." },
  { question: "Can I chat on WhatsApp?", answer: "Yes. Use the floating WhatsApp button or message GLAMO NEPAL at +977 9818212188." },
];
```

- [ ] **Step 2: Update `src/app/faq/page.tsx`**

Replace the inline `faqs` array with an import from the new data module, and add FAQPage JSON-LD:

```tsx
import Link from "next/link";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/common/PageHeader";
import { SITE_CONFIG } from "@/lib/constants";
import { createMetadata, faqJsonLd } from "@/lib/seo";
import { FAQ_ITEMS } from "@/lib/data/faq";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = createMetadata({
  title: "Frequently Asked Questions",
  description: "Find answers about GLAMO NEPAL products, payments, COD, delivery and returns.",
  path: "/faq",
  keywords: ["FAQ", "GLAMO NEPAL FAQ", "delivery Nepal", "COD Nepal", "skincare FAQ"],
});

export default function FaqPage() {
  return (
    <main className="bg-brand-bgLight">
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />
      <PageHeader eyebrow="FAQ" title="Frequently asked questions" description="Clear answers for shoppers about products, delivery, payments and customer care." />
      <section className="container mx-auto grid gap-8 px-4 py-12 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm lg:self-start">
          <HelpCircle className="text-brand-primary" />
          <h2 className="mt-4 font-serif text-3xl font-semibold text-brand-textPrimary">Need a custom answer?</h2>
          <p className="mt-3 text-sm leading-6 text-brand-textMuted">For order support, product confirmation or care guidance, contact GLAMO NEPAL directly.</p>
          <Link href={SITE_CONFIG.whatsapp} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-semibold text-white"><MessageCircle size={17} /> Chat on WhatsApp</Link>
        </aside>
        <Accordion type="single" collapsible className="rounded-[2rem] border border-border/70 bg-white p-4 shadow-sm md:p-6">
          {FAQ_ITEMS.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`q${index}`}>
              <AccordionTrigger className="text-left font-serif text-xl font-semibold text-brand-textPrimary">{question}</AccordionTrigger>
              <AccordionContent className="text-sm leading-7 text-brand-textMuted">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 4: Add JSON-LD to root layout and static pages

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/about/page.tsx`
- Modify: `src/app/contact/page.tsx`

- [ ] **Step 1: Add LocalBusiness + WebSite JSON-LD to root layout**

Update `src/app/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { defaultMetadata, localBusinessJsonLd, organizationJsonLd, webSiteJsonLd } from "@/lib/seo";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata = defaultMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-brand-bgLight font-sans text-brand-textPrimary antialiased">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={localBusinessJsonLd()} />
        <JsonLd data={webSiteJsonLd()} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add BreadcrumbList JSON-LD to About page**

Update `src/app/about/page.tsx` — add imports and `<JsonLd>`:

Add to imports:
```tsx
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
```

Add inside `<main>`, before the `<PageHeader>`:
```tsx
<JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
```

- [ ] **Step 3: Add BreadcrumbList JSON-LD to Contact page**

Update `src/app/contact/page.tsx`:

Add to imports:
```tsx
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
```

Add inside the `<Suspense>`, before `<ContactClient />`:
```tsx
<JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
```

Since the contact page uses `<Suspense>` wrapping `<ContactClient />`, the `<JsonLd>` should go inside the Suspense boundary. The updated return:

```tsx
export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bgLight" />}>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <ContactClient />
    </Suspense>
  );
}
```

- [ ] **Step 4: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 5: Add JSON-LD to category and shop pages, use SEO metadata

**Files:**
- Modify: `src/app/category/[slug]/page.tsx`
- Modify: `src/app/shop/page.tsx`

- [ ] **Step 1: Update category page with JSON-LD and SEO metadata**

Update `src/app/category/[slug]/page.tsx`:

```tsx
import { Suspense } from "react";
import CategoryPageContent from "./CategoryPageContent";
import { CATEGORIES } from "@/lib/data/products";
import { createMetadata, breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const category = CATEGORIES.find((item) => item.slug === params.slug);
  return createMetadata({
    title: category?.seoTitle || (category ? `${category.name} Products` : "Category"),
    description: category?.seoDescription || category?.description || "Explore GLAMO NEPAL beauty category products.",
    path: `/category/${params.slug}`,
    image: category?.image,
    keywords: category ? [category.name, `${category.name} Nepal`, "beauty Nepal", "GLAMO NEPAL"] : ["GLAMO NEPAL"],
  });
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bgLight" />}>
      <CategoryPageContent />
    </Suspense>
  );
}
```

Note: The JSON-LD (BreadcrumbList + ItemList) will be rendered in the client component `CategoryPageContent` since we need the product list data. However, since `CategoryPageContent` is a client component, we need to add the JSON-LD in a different way. The simplest approach: add a server component wrapper.

Actually, looking at the existing pattern (brands, collections, routines pages all render `<JsonLd>` in the server component), we should add it to the server component. But `CategoryPage` currently just renders `<CategoryPageContent />` inside Suspense. We need to access the category data in the server component.

The cleanest approach: make the server component render the JSON-LD by looking up the category from the slug. But the slug is only available via `params` which needs to be passed through. Let me check how the other pages handle this.

Looking at `brands/[slug]/page.tsx`, it directly accesses `params.slug` and renders `<JsonLd>` in the server component. The category page should do the same — we just need to read the slug from params.

But `CategoryPage` currently doesn't receive `params`. Let me update it:

```tsx
import { Suspense } from "react";
import CategoryPageContent from "./CategoryPageContent";
import { CATEGORIES } from "@/lib/data/products";
import { createMetadata, breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const category = CATEGORIES.find((item) => item.slug === params.slug);
  return createMetadata({
    title: category?.seoTitle || (category ? `${category.name} Products` : "Category"),
    description: category?.seoDescription || category?.description || "Explore GLAMO NEPAL beauty category products.",
    path: `/category/${params.slug}`,
    image: category?.image,
    keywords: category ? [category.name, `${category.name} Nepal`, "beauty Nepal", "GLAMO NEPAL"] : ["GLAMO NEPAL"],
  });
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = CATEGORIES.find((item) => item.slug === params.slug);
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bgLight" />}>
      {category && (
        <JsonLd data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: category.name, path: `/category/${category.slug}` },
        ])} />
      )}
      <CategoryPageContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Add BreadcrumbList + ItemList JSON-LD to Shop page**

Update `src/app/shop/page.tsx`:

```tsx
import { Suspense } from "react";
import ShopPageContent from "./ShopPageContent";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = createMetadata({
  title: "Shop Beauty Products",
  description: "Browse GLAMO NEPAL skincare, makeup, haircare, bodycare, fragrance and beauty tools with Nepal-market filters and NPR pricing.",
  path: "/shop",
  keywords: ["shop beauty Nepal", "skincare Nepal", "makeup Nepal", "sunscreen Nepal", "GLAMO NEPAL shop"],
});

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bgLight" />}>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }])} />
      <ShopPageContent />
    </Suspense>
  );
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 6: Fix canonical URLs and add sizes props

**Files:**
- Modify: `src/app/cart/layout.tsx`
- Modify: `src/app/compare/layout.tsx`
- Modify: `src/app/brands/[slug]/page.tsx`
- Modify: `src/app/collections/[slug]/page.tsx`
- Modify: `src/app/routines/[slug]/page.tsx`

- [ ] **Step 1: Fix cart layout canonical URL**

In `src/app/cart/layout.tsx`, change:

```ts
alternates: { canonical: "/cart" },
```

To:

```ts
alternates: { canonical: "https://glamonepal.com/cart" },
```

Or better, use the `createMetadata` helper:

```tsx
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Cart",
  description: "Review your GLAMO NEPAL cart with NPR totals, quantity controls, free delivery messaging and checkout link.",
  path: "/cart",
  noIndex: true,
});
```

This is cleaner — it uses the same `createMetadata` pattern as all other pages and automatically sets the absolute canonical URL. It also correctly sets `noIndex: true` since cart pages shouldn't be indexed.

- [ ] **Step 2: Fix compare layout canonical URL**

In `src/app/compare/layout.tsx`, change to use `createMetadata`:

```tsx
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Compare Products",
  description: "Compare up to three GLAMO NEPAL products by price, brand, category, concerns, size, origin, stock and features.",
  path: "/compare",
  noIndex: true,
});
```

- [ ] **Step 3: Add `sizes` prop to brand hero image**

In `src/app/brands/[slug]/page.tsx`, find the brand hero `<Image>` tag:

```tsx
<Image src={brand.image} alt={`${brand.name} brand visual`} fill className="object-cover" />
```

Add `sizes` prop:

```tsx
<Image src={brand.image} alt={`${brand.name} brand visual`} fill sizes="(max-width: 1024px) 100vw, 320px" className="object-cover" />
```

- [ ] **Step 4: Add `sizes` prop to collection hero image**

In `src/app/collections/[slug]/page.tsx`, find:

```tsx
<Image src={collection.image} alt={collection.title} fill priority className="object-cover" />
```

Add `sizes`:

```tsx
<Image src={collection.image} alt={collection.title} fill sizes="(max-width: 1024px) 100vw, 420px" priority className="object-cover" />
```

- [ ] **Step 5: Add `sizes` prop to routine hero image**

In `src/app/routines/[slug]/page.tsx`, find the routine hero `<Image>` tag (line 47):

```tsx
<Image src={bundle.image} alt={bundle.title} fill priority className="object-cover" />
```

Add `sizes`:

```tsx
<Image src={bundle.image} alt={bundle.title} fill sizes="(max-width: 1024px) 100vw, 0.9fr" priority className="object-cover" />
```

- [ ] **Step 6: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 7: Enrich About page with structured brand section

**Files:**
- Modify: `src/app/about/page.tsx`

- [ ] **Step 1: Add structured brand content and top categories links**

Update `src/app/about/page.tsx` to include:
1. A "Top Categories" section with links to the 6 main categories
2. Opening hours displayed in structured format
3. The BreadcrumbList JSON-LD already added in Task 4

Add `CATEGORIES` import and a categories section after the pillars grid. The full updated file:

```tsx
import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Store } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SITE_CONFIG } from "@/lib/constants";
import { CATEGORIES } from "@/lib/data/products";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = createMetadata({
  title: "About GLAMO NEPAL",
  description: "Learn about GLAMO NEPAL, a premium beauty and cosmetics storefront in Naya Baneshwor, Kathmandu.",
  path: "/about",
  keywords: ["about GLAMO NEPAL", "beauty store Nepal", "skincare Kathmandu", "Nepal cosmetics"],
});

const pillars = [
  { icon: <Sparkles className="text-brand-primary" size={26} />, title: "Premium Nepali beauty", body: "A curated beauty experience for skincare, makeup, haircare, fragrance and beauty tools with NPR-first shopping." },
  { icon: <ShieldCheck className="text-brand-primary" size={26} />, title: "Authenticity-first curation", body: "Product pages highlight authentic ingredients, clear sourcing and honest beauty guidance." },
  { icon: <Store className="text-brand-primary" size={26} />, title: "Kathmandu-ready", body: `Visit us at ${SITE_CONFIG.address}, message us on WhatsApp or pick up in store.` },
];

export default function AboutPage() {
  return (
    <main className="bg-brand-bgLight">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <PageHeader eyebrow="Our story" title="Premium beauty from the heart of Kathmandu" description={`${SITE_CONFIG.fullTitle} is a premium Nepali beauty and cosmetics storefront based at ${SITE_CONFIG.address}.`} />
      <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-2xl bg-white p-7 shadow-sm">
            <MapPin className="text-brand-primary" size={30} />
            <h2 className="mt-4 font-serif text-4xl font-semibold text-brand-textPrimary">Built for the Nepal beauty customer</h2>
            <p className="mt-4 leading-7 text-brand-textMuted">GLAMO NEPAL brings customers polished product discovery, Nepal-relevant delivery information, local payment options and a premium beauty experience that feels trustworthy from the first visit.</p>
            <div className="mt-6 space-y-2 text-sm text-brand-textMuted">
              <p><strong className="text-brand-textPrimary">Phone:</strong> <a href={SITE_CONFIG.whatsapp} target="_blank" rel="noopener noreferrer" className="text-brand-textMuted hover:text-brand-primary transition-colors">{SITE_CONFIG.phone}</a></p>
              <p><strong className="text-brand-textPrimary">Email:</strong> <a href={`mailto:${SITE_CONFIG.email}`} className="text-brand-textMuted hover:text-brand-primary transition-colors">{SITE_CONFIG.email}</a></p>
              <p><strong className="text-brand-textPrimary">Address:</strong> {SITE_CONFIG.address}</p>
              <p><strong className="text-brand-textPrimary">Hours:</strong> Sun–Fri 10AM–7PM, Sat 10AM–5PM</p>
              <p><strong className="text-brand-textPrimary">Instagram:</strong> {SITE_CONFIG.instagramHandle}</p>
              <p><strong className="text-brand-textPrimary">Payments:</strong> {SITE_CONFIG.paymentMethods.join(", ")}</p>
            </div>
            <Link href="/shop" className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3 font-semibold text-white transition hover:bg-brand-bgDark">Explore shop <ArrowRight size={17} /></Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1">
            {pillars.map(({ icon, title, body }) => (
              <article key={title} className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                {icon}
                <h3 className="mt-4 font-serif text-2xl font-semibold text-brand-textPrimary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-textMuted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 pb-12 md:px-6 md:pb-16">
        <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Shop by category</h2>
        <p className="mt-2 text-sm text-brand-textMuted">Browse our curated selection across every beauty category.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="group rounded-2xl border border-border/70 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <p className="font-semibold text-brand-textPrimary group-hover:text-brand-primary">{category.name}</p>
              <p className="mt-1 text-xs text-brand-textMuted">{category.subCategories.slice(0, 2).join(", ")}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 8: Final verification

- [ ] **Step 1: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `npx next lint`
Expected: No errors

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 4: Commit**

```bash
git add src/lib/seo.ts src/lib/constants.ts src/lib/data/faq.ts src/lib/mock/products.ts src/app/layout.tsx src/app/faq/page.tsx src/app/category/[slug]/page.tsx src/app/shop/page.tsx src/app/about/page.tsx src/app/contact/page.tsx src/app/cart/layout.tsx src/app/compare/layout.tsx src/app/brands/[slug]/page.tsx src/app/collections/[slug]/page.tsx src/app/routines/[slug]/page.tsx
git commit -m "feat: comprehensive SEO foundation — JSON-LD, category SEO, FAQ schema, canonical fixes, performance"
```
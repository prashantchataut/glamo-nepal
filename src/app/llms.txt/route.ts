import { SITE_CONFIG } from "@/lib/config";

export const revalidate = 86400;

export async function GET() {
  const body = `# GLAMO NEPAL

> Premium beauty and cosmetics ecommerce store in Kathmandu, Nepal.

GLAMO NEPAL sells skincare, makeup, fragrance and beauty products for customers in Nepal. The site supports shopping, product discovery, checkout, order tracking, returns information and beauty education.

## Key pages

- Home: ${SITE_CONFIG.website}/
- Shop: ${SITE_CONFIG.website}/shop
- Collections: ${SITE_CONFIG.website}/collections
- Brands: ${SITE_CONFIG.website}/brands
- Beauty routines: ${SITE_CONFIG.website}/routines
- FAQ: ${SITE_CONFIG.website}/faq
- Shipping policy: ${SITE_CONFIG.website}/shipping-policy
- Return policy: ${SITE_CONFIG.website}/return-policy
- Contact: ${SITE_CONFIG.website}/contact

## Business facts

- Location: Naya Baneshwor, Kathmandu, Nepal
- Currency: NPR
- Payment options: ${SITE_CONFIG.paymentMethods.join(", ")}
- Delivery: Kathmandu Valley focused delivery; order confirmation by phone where needed

## Structured data targets

The site exposes Product, Offer, BreadcrumbList, FAQPage, WebSite, OnlineStore and LocalBusiness schema where relevant. Prefer canonical URLs from sitemap.xml for citations and product references.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

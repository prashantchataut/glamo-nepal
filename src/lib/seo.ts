import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/config";
import { absoluteUrl } from "@/lib/utils";
import type { Product } from "@/types/product";

const siteName = SITE_CONFIG.fullTitle;

interface SeoInput {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
}

export function createMetadata({ title, description, path = "/", image = "/images/editorial/hero-editorial.svg", noIndex = false, keywords = [], type = "website" }: SeoInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    keywords: [
      "GLAMO NEPAL",
      "Nepal beauty ecommerce",
      "cosmetics in Kathmandu",
      "skincare Nepal",
      ...keywords,
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url,
      siteName,
      locale: "en_NP",
      type,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${title} - ${siteName}` }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${title} | ${siteName}`,
      description,
      images: [imageUrl],
      site: "@glamo_nepal",
      creator: "@glamo_nepal",
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export const defaultMetadata = createMetadata({
  title: "GLAMO NEPAL — Premium Beauty & Cosmetics",
  description: SITE_CONFIG.description,
  path: "/",
});

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: SITE_CONFIG.fullTitle,
    url: SITE_CONFIG.website,
    telephone: SITE_CONFIG.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Naya Baneshwor, Mantra In & Out Square",
      addressLocality: "Kathmandu",
      addressCountry: "NP",
    },
    sameAs: [SITE_CONFIG.social.instagram, SITE_CONFIG.social.facebook].filter(Boolean),
    currenciesAccepted: SITE_CONFIG.currency,
    paymentAccepted: SITE_CONFIG.paymentMethods.join(", "),
  };
}

export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    category: product.category,
    image: product.images?.map((image) => absoluteUrl(image)) ?? [absoluteUrl(product.image)],
    description: product.description,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "NPR",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.reviewSummary?.average ?? product.rating,
      reviewCount: product.reviewSummary?.count ?? product.reviewsCount,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

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
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
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

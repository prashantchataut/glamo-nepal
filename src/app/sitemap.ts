import type { MetadataRoute } from "next";
import { PRODUCTS, CATEGORIES } from "@/lib/data/products";
import { BLOG_POSTS_SYNC } from "@/lib/data/blog";
import { SITE_CONFIG } from "@/lib/config";
import { PRODUCT_COLLECTIONS } from "@/lib/collections";
import { getBrandProfiles } from "@/lib/brands";
import { PRODUCT_BUNDLES } from "@/lib/data/bundles";

// Revalidate sitemap daily via ISR
export const revalidate = 86400;

// TODO: When the backend API is available, fetch products from /api/v1/products
// instead of using the static PRODUCTS array. Use try/catch with PRODUCTS as fallback
// since the backend may not be available at build time.
// Example:
//   const products = await fetch(`${base}/api/v1/products`).then(r => r.json()).catch(() => PRODUCTS);

function toISO8601(date: Date): string {
  return date.toISOString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || SITE_CONFIG.website).replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = [
    { path: "", priority: 1, changefreq: "daily" as const },
    { path: "/shop", priority: 0.8, changefreq: "daily" as const },
    { path: "/collections", priority: 0.72, changefreq: "weekly" as const },
    { path: "/routines", priority: 0.68, changefreq: "weekly" as const },
    { path: "/brands", priority: 0.62, changefreq: "weekly" as const },
    { path: "/blog", priority: 0.7, changefreq: "weekly" as const },
    { path: "/about", priority: 0.7, changefreq: "monthly" as const },
    { path: "/contact", priority: 0.7, changefreq: "monthly" as const },
    { path: "/faq", priority: 0.7, changefreq: "monthly" as const },
    { path: "/privacy-policy", priority: 0.5, changefreq: "yearly" as const },
    { path: "/terms", priority: 0.5, changefreq: "yearly" as const },
    { path: "/shipping-policy", priority: 0.5, changefreq: "yearly" as const },
    { path: "/return-policy", priority: 0.5, changefreq: "yearly" as const },
  ].map(({ path, priority, changefreq }) => ({
    url: `${base}${path}`,
    lastModified: toISO8601(now),
    changeFrequency: changefreq,
    priority,
  }));

  const categoryRoutes = CATEGORIES.map((category) => ({
    url: `${base}/category/${category.slug}`,
    lastModified: toISO8601(now),
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  // TODO: Replace PRODUCTS with API-fetched products when /api/v1/products is available
  const productRoutes = PRODUCTS.map((product) => ({
    url: `${base}/products/${product.slug}`,
    lastModified: toISO8601(now),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const collectionRoutes = PRODUCT_COLLECTIONS.filter((collection) => collection.slug !== "low-stock").map((collection) => ({
    url: `${base}/collections/${collection.slug}`,
    lastModified: toISO8601(now),
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));

  const brandRoutes = getBrandProfiles().map((brand) => ({
    url: `${base}/brands/${brand.slug}`,
    lastModified: toISO8601(now),
    changeFrequency: "weekly" as const,
    priority: 0.62,
  }));

  const routineRoutes = PRODUCT_BUNDLES.map((bundle) => ({
    url: `${base}/routines/${bundle.slug}`,
    lastModified: toISO8601(now),
    changeFrequency: "weekly" as const,
    priority: 0.68,
  }));

  const blogRoutes = BLOG_POSTS_SYNC.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: toISO8601(new Date(post.date)),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...collectionRoutes, ...routineRoutes, ...brandRoutes, ...productRoutes, ...blogRoutes];
}

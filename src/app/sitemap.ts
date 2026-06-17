import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/data/products";
import { BLOG_POSTS_SYNC } from "@/lib/data/blog";
import { SITE_CONFIG } from "@/lib/config";
import { PRODUCT_COLLECTIONS } from "@/lib/collections";
import { getBrandProfiles } from "@/lib/brands";
import { PRODUCT_BUNDLES } from "@/lib/data/bundles";
import { getAllServerProducts } from "@/lib/server/catalog";

// Revalidate sitemap daily via ISR so newly published catalog entries appear.
export const revalidate = 86400;

function toISO8601(date: Date): string {
  return date.toISOString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || SITE_CONFIG.website).replace(/\/$/, "");

  // Prefer the live catalog; fall back to the bundled static catalog when the
  // data service is unreachable (e.g. during a build before provisioning).
  const products = await getAllServerProducts();
  const productSlugs = products.map((p) => p.slug);
  const categorySlugs = CATEGORIES.map((c) => c.slug);

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
    changeFrequency: changefreq,
    priority,
  }));

  const categoryRoutes = categorySlugs.map((slug) => ({
    url: `${base}/category/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  const productRoutes = productSlugs.map((slug) => ({
    url: `${base}/product/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const collectionRoutes = PRODUCT_COLLECTIONS.filter((collection) => collection.slug !== "low-stock").map((collection) => ({
    url: `${base}/collections/${collection.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));

  const brandRoutes = getBrandProfiles().map((brand) => ({
    url: `${base}/brands/${brand.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.62,
  }));

  const routineRoutes = PRODUCT_BUNDLES.map((bundle) => ({
    url: `${base}/routines/${bundle.slug}`,
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

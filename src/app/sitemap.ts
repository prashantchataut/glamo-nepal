import type { MetadataRoute } from "next";
import { PRODUCTS, CATEGORIES } from "@/lib/data/products";
import { BLOG_POSTS_SYNC } from "@/lib/data/blog";
import { SITE_CONFIG } from "@/lib/config";
import { PRODUCT_COLLECTIONS } from "@/lib/collections";
import { getBrandProfiles } from "@/lib/brands";
import { PRODUCT_BUNDLES } from "@/lib/data/bundles";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || SITE_CONFIG.website).replace(/\/$/, "");
  const now = new Date();
  const staticRoutes = ["", "/shop", "/collections", "/routines", "/brands", "/blog", "/about", "/contact", "/faq", "/privacy", "/terms", "/shipping", "/returns"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  const categoryRoutes = CATEGORIES.map((category) => ({
    url: `${base}/category/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));
  const productRoutes = PRODUCTS.map((product) => ({
    url: `${base}/product/${product.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const collectionRoutes = PRODUCT_COLLECTIONS.filter((collection) => collection.slug !== "low-stock").map((collection) => ({
    url: `${base}/collections/${collection.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));
  const brandRoutes = getBrandProfiles().map((brand) => ({
    url: `${base}/brands/${brand.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.62,
  }));
  const routineRoutes = PRODUCT_BUNDLES.map((bundle) => ({
    url: `${base}/routines/${bundle.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.68,
  }));
  const blogRoutes = BLOG_POSTS_SYNC.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...categoryRoutes, ...collectionRoutes, ...routineRoutes, ...brandRoutes, ...productRoutes, ...blogRoutes];
}

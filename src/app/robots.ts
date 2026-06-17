import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || SITE_CONFIG.website).replace(/\/$/, "");

  const privatePaths = ["/admin", "/account", "/checkout", "/cart", "/wishlist", "/login", "/register", "/forgot-password", "/reset-password", "/search", "/collections/low-stock", "/order-confirmation", "/order", "/payment"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User"],
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: ["PerplexityBot"],
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: ["ClaudeBot", "anthropic-ai"],
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: ["CCBot"],
        disallow: "/",
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

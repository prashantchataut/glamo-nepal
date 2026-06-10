import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || SITE_CONFIG.website).replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/checkout", "/cart", "/login", "/register", "/forgot-password", "/reset-password", "/search", "/collections/low-stock", "/order-confirmation", "/order", "/payment"],
      },
      {
        userAgent: ["Googlebot", "Google-Extended"],
        allow: "/",
        disallow: ["/admin", "/account", "/checkout", "/cart", "/login", "/register", "/forgot-password", "/reset-password", "/search", "/collections/low-stock", "/order-confirmation", "/order", "/payment"],
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User"],
        allow: "/",
        disallow: ["/admin", "/account", "/checkout", "/cart", "/order-confirmation", "/order", "/payment"],
      },
      {
        userAgent: ["PerplexityBot"],
        allow: "/",
        disallow: ["/admin", "/account", "/checkout", "/cart", "/order-confirmation", "/order", "/payment"],
      },
      {
        userAgent: ["ClaudeBot", "anthropic-ai"],
        allow: "/",
        disallow: ["/admin", "/account", "/checkout", "/cart", "/order-confirmation", "/order", "/payment"],
      },
      {
        userAgent: ["CCBot"],
        disallow: "/",
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

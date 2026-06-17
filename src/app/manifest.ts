import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GLAMO Nepal — Premium Beauty & Skincare",
    short_name: "GLAMO",
    description: "Premium Nepali beauty, skincare, cosmetics and lifestyle ecommerce.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8B3A8F",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
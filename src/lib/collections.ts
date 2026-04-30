import type { Product } from "@/store/useCartStore";
import { PRODUCTS } from "@/lib/mock/products";

export interface ProductCollection {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  seoDescription: string;
  image: string;
  filter: (product: Product) => boolean;
}

export const PRODUCT_COLLECTIONS: ProductCollection[] = [
  {
    slug: "new-arrivals",
    title: "New Arrivals",
    eyebrow: "Fresh on GLAMO",
    description: "Recently added skincare, makeup and beauty essentials prepared for Nepal-market catalog testing.",
    seoDescription: "Shop new beauty arrivals at GLAMO NEPAL with NPR pricing and Nepal delivery-ready mock stock.",
    image: "/images/hero-glow.svg",
    filter: (product) => Boolean(product.isNewArrival || product.badge === "New"),
  },
  {
    slug: "best-sellers",
    title: "Best Sellers",
    eyebrow: "Most loved mock picks",
    description: "High-intent catalog picks with strong review signals and best-seller placement for conversion testing.",
    seoDescription: "Explore GLAMO NEPAL best-selling beauty, skincare and makeup picks with original product copy.",
    image: "/images/promo-store.svg",
    filter: (product) => Boolean(product.isBestSeller || product.badge === "Best Seller"),
  },
  {
    slug: "made-in-nepal",
    title: "Made in Nepal Beauty",
    eyebrow: "Local glow edit",
    description: "A dedicated collection for Nepal-made beauty, wellness and personal care SKUs. Supplier verification still required.",
    seoDescription: "Discover Made in Nepal beauty products curated for GLAMO NEPAL customers.",
    image: "/images/hero-nepal.svg",
    filter: (product) => product.madeInNepal,
  },
  {
    slug: "festival-ready",
    title: "Festival Ready Beauty",
    eyebrow: "Dashain, Tihar and weddings",
    description: "Long-wear makeup, glow skincare, fragrance and gifting picks for Nepal's festive and wedding seasons.",
    seoDescription: "Shop festival-ready beauty picks for Dashain, Tihar and wedding season at GLAMO NEPAL.",
    image: "/images/hero-festival.svg",
    filter: (product) => product.concernTags.includes("Festival") || product.concernTags.includes("Long Wear") || product.badge === "Limited",
  },
  {
    slug: "under-npr-1000",
    title: "Under NPR 1,000",
    eyebrow: "Affordable beauty edits",
    description: "Budget-friendly mock products for entry-level shopping, gifts and add-on cart items.",
    seoDescription: "Find GLAMO NEPAL beauty products under NPR 1,000 across skincare, makeup and personal care.",
    image: "/images/promo-dashain.svg",
    filter: (product) => product.price <= 1000,
  },

  {
    slug: "sensitive-skin",
    title: "Sensitive Skin Edit",
    eyebrow: "Calm routine picks",
    description: "Gentle-positioned skincare and bodycare items for customers who prefer simpler, comfort-focused routines.",
    seoDescription: "Explore GLAMO NEPAL sensitive-skin beauty picks with frontend-only mock product data and patch-test reminders.",
    image: "/images/product-placeholder-cream.svg",
    filter: (product) => product.skinType.includes("Sensitive") || product.concernTags.includes("Sensitive Skin") || product.concernTags.includes("Barrier Repair"),
  },
  {
    slug: "bridal-beauty",
    title: "Bridal Beauty Edit",
    eyebrow: "Wedding season ready",
    description: "A conversion-focused collection for Nepali wedding events, long-wear makeup, glow skincare and fragrance gifting.",
    seoDescription: "Shop bridal beauty and wedding-season makeup picks at GLAMO NEPAL with NPR pricing and mock stock.",
    image: "/images/hero-festival.svg",
    filter: (product) => product.concernTags.includes("Long Wear") || product.concernTags.includes("Festival") || product.category === "fragrance" || product.subCategory === "Lipstick",
  },
  {
    slug: "low-stock",
    title: "Low Stock Watchlist",
    eyebrow: "Inventory signal",
    description: "Frontend inventory-risk collection for admin and merchandising checks. Not intended as public scarcity messaging until stock is real.",
    seoDescription: "Low-stock GLAMO NEPAL inventory preview for frontend merchandising checks.",
    image: "/images/product-placeholder-skincare.svg",
    filter: (product) => product.stockCount > 0 && product.stockCount <= 10,
  },
];

export function getCollection(slug: string) {
  return PRODUCT_COLLECTIONS.find((collection) => collection.slug === slug);
}

export function getCollectionProducts(slug: string) {
  const collection = getCollection(slug);
  if (!collection) return [];
  return PRODUCTS.filter(collection.filter);
}

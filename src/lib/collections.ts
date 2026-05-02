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
    description: "Recently added skincare, makeup and beauty essentials curated for Nepal-market shoppers.",
    seoDescription: "Shop new beauty arrivals at GLAMO NEPAL with NPR pricing and delivery across Nepal.",
    image: "/images/editorial/collection-new-arrivals.svg",
    filter: (product) => Boolean(product.isNewArrival || product.badge === "New"),
  },
  {
    slug: "best-sellers",
    title: "Best Sellers",
    eyebrow: "Most loved picks",
    description: "Customer-loved skincare, makeup and beauty favorites with strong bestseller appeal.",
    seoDescription: "Explore GLAMO NEPAL best-selling beauty, skincare and makeup picks with original product copy.",
    image: "/images/editorial/collection-best-sellers.svg",
    filter: (product) => Boolean(product.isBestSeller || product.badge === "Best Seller"),
  },
  {
    slug: "made-in-nepal",
    title: "Made in Nepal Beauty",
    eyebrow: "Local glow edit",
    description: "A dedicated collection for Nepal-made beauty, wellness and personal care favorites.",
    seoDescription: "Discover Made in Nepal beauty products curated for GLAMO NEPAL customers.",
    image: "/images/editorial/collection-made-in-nepal.svg",
    filter: (product) => product.madeInNepal,
  },
  {
    slug: "festival-ready",
    title: "Festival Ready Beauty",
    eyebrow: "New Year, gifting and weddings",
    description: "Long-wear makeup, glow skincare, fragrance and gifting picks for Nepal's festive and wedding seasons.",
    seoDescription: "Shop festival-ready beauty picks for New Year, gifting and wedding season at GLAMO NEPAL.",
    image: "/images/editorial/collection-festival-ready.svg",
    filter: (product) => product.concernTags.includes("Festival") || product.concernTags.includes("Long Wear") || product.badge === "Limited",
  },
  {
    slug: "under-npr-1000",
    title: "Under NPR 1,000",
    eyebrow: "Affordable beauty edits",
    description: "Budget-friendly beauty products for everyday shopping, gifts and easy cart add-ons.",
    seoDescription: "Find GLAMO NEPAL beauty products under NPR 1,000 across skincare, makeup and personal care.",
    image: "/images/editorial/collection-under-npr-1000.svg",
    filter: (product) => product.price <= 1000,
  },

  {
    slug: "sensitive-skin",
    title: "Sensitive Skin Edit",
    eyebrow: "Calm routine picks",
    description: "Gentle-positioned skincare and bodycare items for customers who prefer simpler, comfort-focused routines.",
    seoDescription: "Explore GLAMO NEPAL sensitive-skin beauty picks with comfort-focused routines and patch-test reminders.",
    image: "/images/editorial/collection-sensitive-skin.svg",
    filter: (product) => product.skinType.includes("Sensitive") || product.concernTags.includes("Sensitive Skin") || product.concernTags.includes("Barrier Repair"),
  },
  {
    slug: "bridal-beauty",
    title: "Bridal Beauty Edit",
    eyebrow: "Wedding season ready",
    description: "A wedding-season collection for Nepali events, long-wear makeup, glow skincare and fragrance gifting.",
    seoDescription: "Shop bridal beauty and wedding-season makeup picks at GLAMO NEPAL with NPR pricing.",
    image: "/images/editorial/collection-bridal-beauty.svg",
    filter: (product) => product.concernTags.includes("Long Wear") || product.concernTags.includes("Festival") || product.category === "fragrance" || product.subCategory === "Lipstick",
  },
  {
    slug: "low-stock",
    title: "Almost Gone Beauty Picks",
    eyebrow: "Limited availability",
    description: "Limited-availability beauty picks customers may want before they sell out.",
    seoDescription: "Shop almost-gone GLAMO NEPAL beauty picks with limited availability.",
    image: "/images/editorial/collection-low-stock.svg",
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
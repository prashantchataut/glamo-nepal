import type { Product } from "@/store/useCartStore";
import { PRODUCTS, getProductBySlug } from "@/lib/mock/products";

export interface RoutineStep {
  label: string;
  productSlug: string;
  note: string;
}

export interface ProductBundle {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  skinTypes: string[];
  concerns: string[];
  occasion: string;
  image: string;
  productSlugs: string[];
  steps: RoutineStep[];
  ownerNote: string;
}

export interface HydratedProductBundle extends ProductBundle {
  products: Product[];
  subtotal: number;
  bundlePrice: number;
  savings: number;
}

export const PRODUCT_BUNDLES: ProductBundle[] = [
  {
    slug: "kathmandu-daily-glow-routine",
    title: "Kathmandu Daily Glow Routine",
    eyebrow: "AM routine starter",
    description: "A simple cleanser-to-SPF routine for dust, sun exposure and busy Kathmandu mornings.",
    skinTypes: ["All Skin Types", "Combination"],
    concerns: ["Brightening", "Hydration", "Sun Protection"],
    occasion: "Daily skincare",
    image: "/images/editorial/collection-new-arrivals.svg",
    productSlugs: ["rose-water-calm-toner", "himalayan-vitamin-c-glow-serum", "invisible-city-spf-50-pa"],
    steps: [
      { label: "Refresh", productSlug: "rose-water-calm-toner", note: "Pat on after cleansing for a soft hydrating layer." },
      { label: "Glow", productSlug: "himalayan-vitamin-c-glow-serum", note: "Use a few drops before moisturizer." },
      { label: "Protect", productSlug: "invisible-city-spf-50-pa", note: "Finish with SPF every morning." },
    ],
    ownerNote: "Replace routine claims with supplier-approved usage notes and dermatologist/legal review before launch.",
  },
  {
    slug: "sensitive-barrier-reset",
    title: "Sensitive Barrier Reset",
    eyebrow: "Comfort routine",
    description: "A calm, low-fuss edit for dry, tight or sensitive-feeling skin days.",
    skinTypes: ["Sensitive", "Dry"],
    concerns: ["Barrier Repair", "Hydration", "Sensitive Skin"],
    occasion: "Night care",
    image: "/images/editorial/collection-sensitive-skin.svg",
    productSlugs: ["rose-water-calm-toner", "barrier-repair-ceramide-cream", "daily-dew-gel-moisturizer"],
    steps: [
      { label: "Soothe", productSlug: "rose-water-calm-toner", note: "Apply gently without rubbing." },
      { label: "Repair", productSlug: "barrier-repair-ceramide-cream", note: "Use a richer layer at night." },
      { label: "Maintain", productSlug: "daily-dew-gel-moisturizer", note: "Use a lighter layer on warmer days." },
    ],
    ownerNote: "Sensitive-skin copy must avoid medical claims and include patch-test language in final content.",
  },
  {
    slug: "festival-longwear-glam-kit",
    title: "Festival Long-Wear Glam Kit",
    eyebrow: "New Year · gifting · weddings",
    description: "Color, definition and glow essentials for festive days and evening gatherings.",
    skinTypes: ["All Skin Types"],
    concerns: ["Long Wear", "Festival", "Dewy Finish"],
    occasion: "Festival makeup",
    image: "/images/editorial/collection-festival-ready.svg",
    productSlugs: ["velvet-matte-lip-cream", "monsoon-proof-mascara", "cream-blush-stick-peach-bloom"],
    steps: [
      { label: "Cheeks", productSlug: "cream-blush-stick-peach-bloom", note: "Blend in thin layers for a fresh finish." },
      { label: "Eyes", productSlug: "monsoon-proof-mascara", note: "Build one or two coats before the first coat fully dries." },
      { label: "Lips", productSlug: "velvet-matte-lip-cream", note: "Apply a thin coat and let it set." },
    ],
    ownerNote: "Final shade photography and performance claims need supplier approval.",
  },
  {
    slug: "made-in-nepal-gift-edit",
    title: "Made in Nepal Gift Edit",
    eyebrow: "Local beauty gifting",
    description: "A locally focused gift edit for customers who want Nepal-made beauty and self-care items.",
    skinTypes: ["All Skin Types"],
    concerns: ["Natural", "Hydration", "Made in Nepal"],
    occasion: "Gifting",
    image: "/images/editorial/collection-made-in-nepal.svg",
    productSlugs: ["rose-water-calm-toner", "daily-dew-gel-moisturizer", "tea-tree-blemish-gel"],
    steps: [
      { label: "Refresh", productSlug: "rose-water-calm-toner", note: "Giftable everyday refresh step." },
      { label: "Moisturize", productSlug: "daily-dew-gel-moisturizer", note: "Lightweight daily moisturizer format." },
      { label: "Target", productSlug: "tea-tree-blemish-gel", note: "Small add-on for targeted routine support." },
    ],
    ownerNote: "Confirm Made in Nepal status, manufacturer details and MRP before public launch.",
  },
];

export function hydrateBundle(bundle: ProductBundle): HydratedProductBundle {
  const products = bundle.productSlugs
    .map((slug) => getProductBySlug(slug))
    .filter((product): product is Product => Boolean(product));
  const subtotal = products.reduce((sum, product) => sum + product.price, 0);
  const bundlePrice = Math.max(0, Math.round(subtotal * 0.92 / 10) * 10);
  return {
    ...bundle,
    products,
    subtotal,
    bundlePrice,
    savings: Math.max(0, subtotal - bundlePrice),
  };
}

export function getBundles() {
  return PRODUCT_BUNDLES.map(hydrateBundle);
}

export function getBundle(slug: string) {
  const bundle = PRODUCT_BUNDLES.find((item) => item.slug === slug);
  return bundle ? hydrateBundle(bundle) : undefined;
}

export function getRecommendedBundles(product: Product, limit = 2) {
  const matches = getBundles().filter((bundle) => {
    const hasProduct = bundle.products.some((item) => item.slug === product.slug);
    const concernMatch = bundle.concerns.some((concern) => product.concernTags.includes(concern));
    const skinMatch = bundle.skinTypes.some((skinType) => product.skinType.includes(skinType));
    return hasProduct || concernMatch || skinMatch;
  });
  return (matches.length ? matches : getBundles()).slice(0, limit);
}

export const BUNDLE_PRODUCT_POOL = Array.from(new Set(PRODUCT_BUNDLES.flatMap((bundle) => bundle.productSlugs)))
  .map((slug) => PRODUCTS.find((product) => product.slug === slug))
  .filter((product): product is Product => Boolean(product));
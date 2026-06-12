import type { Product } from "@/types/product";
import { PRODUCTS, getProductBySlug } from "@/lib/data/catalog-products";

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
    productSlugs: ["bioderma-sensibio-h2o-micellar-water", "the-ordinary-niacinamide-10-zinc-1", "beauty-of-joseon-relief-sun-spf50"],
    steps: [
      { label: "Cleanse", productSlug: "bioderma-sensibio-h2o-micellar-water", note: "Gentle micellar water to remove impurities and prep skin." },
      { label: "Treat", productSlug: "the-ordinary-niacinamide-10-zinc-1", note: "Niacinamide serum to balance shine and refine pores." },
      { label: "Protect", productSlug: "beauty-of-joseon-relief-sun-spf50", note: "Finish with SPF every morning." },
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
    productSlugs: ["cetaphil-gentle-skin-cleanser", "cerave-moisturising-cream", "cosrx-advanced-snail-96-mucin-power-essence"],
    steps: [
      { label: "Cleanse", productSlug: "cetaphil-gentle-skin-cleanser", note: "Gentle non-stripping cleanse for sensitive skin." },
      { label: "Repair", productSlug: "cerave-moisturising-cream", note: "Ceramide-rich cream to rebuild the moisture barrier." },
      { label: "Hydrate", productSlug: "cosrx-advanced-snail-96-mucin-power-essence", note: "Snail mucin essence for an extra layer of hydration." },
    ],
    ownerNote: "Sensitive-skin copy must avoid medical claims and include patch-test language in final content.",
  },
  {
    slug: "festival-long-wear-glam-kit",
    title: "Festival Long-Wear Glam Kit",
    eyebrow: "New Year · gifting · weddings",
    description: "Color, definition and glow essentials for festive days and evening gatherings.",
    skinTypes: ["All Skin Types"],
    concerns: ["Long Wear", "Festival", "Dewy Finish"],
    occasion: "Festival makeup",
    image: "/images/editorial/collection-festival-ready.svg",
    productSlugs: ["lakme-9to5-primer-matte-lip-color", "maybelline-fit-me-matte-poreless-foundation", "cream-blush-stick-peach-bloom"],
    steps: [
      { label: "Base", productSlug: "maybelline-fit-me-matte-poreless-foundation", note: "Matte foundation for a long-wear base." },
      { label: "Cheeks", productSlug: "cream-blush-stick-peach-bloom", note: "Blend in thin layers for a fresh finish." },
      { label: "Lips", productSlug: "lakme-9to5-primer-matte-lip-color", note: "Apply a thin coat and let it set." },
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
    productSlugs: ["papaya-enzyme-face-wash", "kathmandu-glow-bridal-lip-cheek-tint", "wild-earth-nepal-lavender-body-butter"],
    steps: [
      { label: "Cleanse", productSlug: "papaya-enzyme-face-wash", note: "Brightening face wash for a fresh start." },
      { label: "Color", productSlug: "kathmandu-glow-bridal-lip-cheek-tint", note: "Nepal-made lip and cheek tint for a soft glow." },
      { label: "Nourish", productSlug: "wild-earth-nepal-lavender-body-butter", note: "Rich body butter with lavender for all-over softness." },
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
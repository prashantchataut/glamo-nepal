import type { Product, ProductBadge, ShadeOption } from "@/types/product";
import { PRODUCTS } from "@/lib/data/catalog-products";

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  sku?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  brandSlug?: string | null;
  basePrice?: number | null;
  salePrice?: number | null;
  currency?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  trackInventory?: boolean;
  stockQuantity?: number | null;
  tags?: string[] | string | null;
  attributes?: Record<string, unknown> | string | null;
  images?: Array<{ url?: string | null; isPrimary?: boolean; altText?: string | null }> | null;
  variants?: Array<{ name?: string | null; stockQuantity?: number | null; attributes?: Record<string, unknown> | null }> | null;
  reviewSummary?: { avgRating?: number | null; count?: number | null } | null;
  createdAt?: string | null;
}

const FALLBACK_IMAGE = "/images/editorial/newsletter-vanity.svg";
const NEW_ARRIVAL_WINDOW_MS = 45 * 24 * 60 * 60 * 1000;

function isStorefrontProduct(value: unknown): value is Product {
  return Boolean(value && typeof value === "object" && "price" in (value as Record<string, unknown>) && "image" in (value as Record<string, unknown>));
}

function findCatalogMatch(raw: { id?: unknown; slug?: unknown }): Product | undefined {
  return PRODUCTS.find((p) => p.id === raw.id || p.slug === raw.slug);
}

function attrString(attributes: Record<string, unknown> | null | undefined, key: string): string | undefined {
  const value = attributes?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Robust string array extractor. Handles:
 * - Native arrays: ["a", "b"]
 * - JSON strings: '["a","b"]'
 * - Comma strings: "a, b, c"
 * - Any other type -> []
 */
function attrStringArray(attributes: Record<string, unknown> | null | undefined, key: string): string[] {
  const value = attributes?.[key];
  // Native array
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  // JSON string
  if (typeof value === "string") {
    if (value.startsWith("[") || value.startsWith("{")) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === "string");
      } catch { /* fall through */ }
    }
    // Comma-separated string
    if (value.includes(",")) return value.split(",").map((v) => v.trim()).filter(Boolean);
    if (value.length > 0) return [value.trim()];
  }
  return [];
}

function attrNumber(attributes: Record<string, unknown> | null | undefined, key: string): number | undefined {
  const value = attributes?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Ensure a value is always a string array */
function ensureStringArray(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") {
    if (value.startsWith("[") || value.startsWith("{")) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === "string");
      } catch { /* fall through */ }
    }
    if (value.includes(",")) return value.split(",").map((v) => v.trim()).filter(Boolean);
    if (value.length > 0) return [value.trim()];
  }
  return fallback;
}

export function adaptApiProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== "object") return null;
  if (isStorefrontProduct(raw)) return raw as Product;

  const api = raw as unknown as ApiProduct;
  if (typeof api.id !== "string" || typeof api.slug !== "string" || typeof api.name !== "string") return null;

  const catalog = findCatalogMatch(api);

  const basePrice = typeof api.basePrice === "number" ? api.basePrice : catalog?.price ?? 0;
  const salePrice = typeof api.salePrice === "number" ? api.salePrice : catalog?.originalPrice ? null : null;
  const price = salePrice != null && salePrice < basePrice ? salePrice : basePrice;
  const originalPrice = salePrice != null && basePrice > salePrice ? basePrice : catalog?.originalPrice;

  // Parse attributes - might be a JSON string from DB
  let attributes: Record<string, unknown> = {};
  if (typeof api.attributes === "string") {
    try { attributes = JSON.parse(api.attributes); } catch { /* empty */ }
  } else if (api.attributes && typeof api.attributes === "object") {
    attributes = api.attributes;
  }

  const sortedImages = Array.isArray(api.images) ? [...api.images].sort((a, b) => Number(b?.isPrimary ? 1 : 0) - Number(a?.isPrimary ? 1 : 0)) : [];
  const imageUrls = sortedImages.map((img) => img?.url).filter((url): url is string => typeof url === "string" && url.length > 0);
  const image = imageUrls[0] ?? catalog?.image ?? FALLBACK_IMAGE;

  const stockCount = typeof api.stockQuantity === "number" ? api.stockQuantity : catalog?.stockCount ?? 0;
  const inStock = api.trackInventory === false ? true : stockCount > 0;

  // Parse tags - might be JSON string or array
  let tags: string[] = [];
  if (typeof api.tags === "string") {
    try { tags = JSON.parse(api.tags); } catch { tags = api.tags.split(",").map((t) => t.trim()).filter(Boolean); }
  } else if (Array.isArray(api.tags)) {
    tags = api.tags.filter((t): t is string => typeof t === "string");
  }

  const shadeOptions: ShadeOption[] | undefined = Array.isArray(api.variants) && api.variants.length > 0
    ? api.variants.filter((v) => v && v.name).map((v) => ({ name: v.name as string, hex: typeof v.attributes?.hex === "string" ? v.attributes.hex : undefined, stockCount: typeof v.stockQuantity === "number" ? v.stockQuantity : undefined }))
    : catalog?.shadeOptions;

  const reviewCount = api.reviewSummary?.count ?? 0;
  const rating = reviewCount > 0 ? Math.round((api.reviewSummary?.avgRating ?? 0) * 10) / 10 : (attrNumber(attributes, "rating") ?? catalog?.rating ?? 0);
  const badge = attrString(attributes, "badge");

  const createdAtMs = api.createdAt ? Date.parse(api.createdAt) : NaN;
  const isNewArrival = Number.isFinite(createdAtMs) ? Date.now() - createdAtMs < NEW_ARRIVAL_WINDOW_MS : catalog?.isNewArrival;

  // Ensure ALL arrays are truly arrays - never undefined, never strings
  const skinType = ensureStringArray(attributes.skinType, catalog?.skinType ?? []);
  const benefits = ensureStringArray(attributes.benefits, catalog?.benefits ?? []);
  const howToUse = ensureStringArray(attributes.howToUse, catalog?.howToUse ?? []);
  const ingredients = ensureStringArray(attributes.ingredients, catalog?.ingredients ?? []);
  const concernTags = tags.length > 0 ? tags : ensureStringArray(attributes.concernTags, catalog?.concernTags ?? []);

  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    sku: api.sku || catalog?.sku || api.id,
    brand: api.brandName || catalog?.brand || "GLAMO",
    category: api.categorySlug || catalog?.category || "",
    subCategory: catalog?.subCategory || attrString(attributes, "subCategory") || "",
    price,
    originalPrice,
    image,
    images: imageUrls.length > 0 ? imageUrls : catalog?.images ?? [image],
    badge: badge && (["Sale", "New", "Best Seller", "Limited"] as string[]).includes(badge) ? (badge as ProductBadge) : catalog?.badge,
    rating,
    reviewsCount: reviewCount > 0 ? reviewCount : (attrNumber(attributes, "reviewsCount") ?? catalog?.reviewsCount ?? 0),
    skinType,
    concernTags,
    benefits,
    howToUse,
    ingredients,
    size: attrString(attributes, "size") || catalog?.size || "",
    origin: attrString(attributes, "origin") || catalog?.origin || "",
    madeInNepal: attributes.madeInNepal === true || catalog?.madeInNepal || tags.includes("made-in-nepal"),
    shadeOptions,
    stockCount,
    inStock,
    description: api.description || api.shortDescription || catalog?.description || "",
    deliveryNote: attrString(attributes, "deliveryNote") || catalog?.deliveryNote,
    isFeatured: api.isFeatured ?? catalog?.isFeatured,
    isBestSeller: attributes.isBestSeller === true || catalog?.isBestSeller || tags.includes("best-seller"),
    isNewArrival,
  };
}

export function adaptApiProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => adaptApiProduct(item)).filter((p): p is Product => p !== null);
}

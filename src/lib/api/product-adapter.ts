import type { Product, ProductBadge, ShadeOption } from "@/types/product";
import { PRODUCTS } from "@/lib/data/catalog-products";
import { toArray } from "@/lib/array-safe";

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
  tags?: string[] | null;
  attributes?: Record<string, unknown> | null;
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

function attrStringArray(attributes: Record<string, unknown> | null | undefined, key: string): string[] {
  const value = attributes?.[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function attrNumber(attributes: Record<string, unknown> | null | undefined, key: string): number | undefined {
  const value = attributes?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
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

  const sortedImages = Array.isArray(api.images) ? [...api.images].sort((a, b) => Number(b?.isPrimary ? 1 : 0) - Number(a?.isPrimary ? 1 : 0)) : [];
  const imageUrls = sortedImages.map((img) => img?.url).filter((url): url is string => typeof url === "string" && url.length > 0);
  const image = imageUrls[0] ?? catalog?.image ?? FALLBACK_IMAGE;

  const stockCount = typeof api.stockQuantity === "number" ? api.stockQuantity : catalog?.stockCount ?? 0;
  const inStock = api.trackInventory === false ? true : stockCount > 0;

  const tags = Array.isArray(api.tags) ? api.tags.filter((t): t is string => typeof t === "string") : [];
  const attributes = api.attributes ?? {};

  const shadeOptions: ShadeOption[] | undefined = Array.isArray(api.variants) && api.variants.length > 0
    ? api.variants.filter((v) => v && v.name).map((v) => ({ name: v.name as string, hex: typeof v.attributes?.hex === "string" ? v.attributes.hex : undefined, stockCount: typeof v.stockQuantity === "number" ? v.stockQuantity : undefined }))
    : catalog?.shadeOptions;

  const reviewCount = api.reviewSummary?.count ?? 0;
  const rating = reviewCount > 0 ? Math.round((api.reviewSummary?.avgRating ?? 0) * 10) / 10 : (attrNumber(attributes, "rating") ?? catalog?.rating ?? 0);
  const badge = attrString(attributes, "badge");

  const createdAtMs = api.createdAt ? Date.parse(api.createdAt) : NaN;
  const isNewArrival = Number.isFinite(createdAtMs) ? Date.now() - createdAtMs < NEW_ARRIVAL_WINDOW_MS : catalog?.isNewArrival;

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
    images: imageUrls.length > 0 ? imageUrls : toArray(catalog?.images ?? [image]),
    badge: badge && (["Sale", "New", "Best Seller", "Limited"] as string[]).includes(badge) ? (badge as ProductBadge) : catalog?.badge,
    rating,
    reviewsCount: reviewCount > 0 ? reviewCount : (attrNumber(attributes, "reviewsCount") ?? catalog?.reviewsCount ?? 0),
    // DEFENSIVE: catalog?.skinType (and similar) might be a non-array value
    // (e.g. `1` from a corrupted DB row). `?? []` only falls back on
    // null/undefined, so we wrap with toArray() to guarantee a real array.
    skinType: attrStringArray(attributes, "skinType").length > 0 ? attrStringArray(attributes, "skinType") : toArray(catalog?.skinType),
    concernTags: tags.length > 0 ? tags : toArray(catalog?.concernTags),
    benefits: attrStringArray(attributes, "benefits").length > 0 ? attrStringArray(attributes, "benefits") : toArray(catalog?.benefits),
    howToUse: attrStringArray(attributes, "howToUse").length > 0 ? attrStringArray(attributes, "howToUse") : toArray(catalog?.howToUse),
    ingredients: attrStringArray(attributes, "ingredients").length > 0 ? attrStringArray(attributes, "ingredients") : toArray(catalog?.ingredients),
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
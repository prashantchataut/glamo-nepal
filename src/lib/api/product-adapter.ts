import type { Product, ProductBadge, ShadeOption } from "@/types/product";

/**
 * Shape returned by the backend product serializer (formatProduct in
 * backend/src/modules/products/product.service.ts). The storefront `Product`
 * type is richer, so this adapter maps the persisted fields and leaves
 * content-only fields (benefits, ingredients, etc.) empty when absent.
 */
interface BackendProductImage {
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
  altText?: string | null;
}

interface BackendVariant {
  name: string;
  attributes?: Record<string, string> | null;
  stockQuantity?: number;
}

interface BackendProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  sku?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  brandName?: string | null;
  basePrice?: number;
  salePrice?: number | null;
  isFeatured?: boolean;
  stockQuantity?: number;
  tags?: string[];
  images?: BackendProductImage[];
  variants?: BackendVariant[];
  reviewSummary?: { avgRating?: number; average?: number; count?: number } | null;
}

function isBackendProduct(raw: unknown): raw is BackendProduct {
  return (
    typeof raw === "object" &&
    raw !== null &&
    "basePrice" in raw &&
    !("price" in (raw as Record<string, unknown>))
  );
}

function pickImage(images: BackendProductImage[] | undefined): string {
  if (!images || images.length === 0) return "";
  const primary = images.find((img) => img.isPrimary);
  return (primary ?? images[0]).url ?? "";
}

function deriveBadge(raw: BackendProduct): ProductBadge | undefined {
  if (raw.salePrice != null && raw.basePrice != null && raw.salePrice < raw.basePrice) {
    return "Sale";
  }
  if (raw.isFeatured) return "Best Seller";
  return undefined;
}

function shadesFromVariants(variants: BackendVariant[] | undefined): ShadeOption[] | undefined {
  if (!variants || variants.length === 0) return undefined;
  const shades = variants
    .map((variant) => ({
      name: variant.name,
      hex: variant.attributes?.hex || variant.attributes?.color,
      stockCount: variant.stockQuantity,
    }))
    .filter((shade) => Boolean(shade.name));
  return shades.length > 0 ? shades : undefined;
}

/**
 * Map a single backend product DTO to the storefront `Product` type.
 * Idempotent: if given an object that is already a storefront `Product`
 * (has `price`), it is returned unchanged.
 */
export function adaptProduct(raw: unknown): Product {
  if (!isBackendProduct(raw)) {
    return raw as Product;
  }

  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const basePrice = raw.basePrice ?? 0;
  const hasSale = raw.salePrice != null && raw.salePrice < basePrice;
  const stockCount = raw.stockQuantity ?? 0;
  const reviewAverage = raw.reviewSummary?.avgRating ?? raw.reviewSummary?.average ?? 0;

  return {
    id: String(raw.id),
    name: raw.name,
    slug: raw.slug,
    sku: raw.sku ?? "",
    brand: raw.brandName ?? "",
    category: raw.categorySlug ?? "",
    subCategory: "",
    price: hasSale && raw.salePrice != null ? raw.salePrice : basePrice,
    originalPrice: hasSale ? basePrice : undefined,
    mrp: basePrice,
    image: pickImage(raw.images),
    images: raw.images?.map((img) => img.url).filter(Boolean),
    badge: deriveBadge(raw),
    rating: reviewAverage,
    reviewsCount: raw.reviewSummary?.count ?? 0,
    skinType: [],
    concernTags: tags,
    benefits: [],
    howToUse: [],
    ingredients: [],
    size: "",
    origin: "",
    madeInNepal: tags.some((tag) => tag.toLowerCase().includes("made in nepal")),
    shadeOptions: shadesFromVariants(raw.variants),
    stockCount,
    inStock: stockCount > 0,
    description: raw.description ?? raw.shortDescription ?? "",
    isFeatured: raw.isFeatured ?? undefined,
  };
}

export function adaptProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(adaptProduct);
}

import { PRODUCTS, CATEGORIES, getProductBySlug, getRelatedProducts, searchProducts } from "@/lib/data/catalog-products";
import type { ApiResponse, Category, PaymentMethod } from "./contracts";
import type { Product } from "@/types/product";

const ok = <T>(data: T, meta?: ApiResponse<T>["meta"]): ApiResponse<T> => ({ status: "success", data, meta });

export interface ProductListParams {
  query?: string;
  category?: string;
  brand?: string;
  concern?: string;
  skinType?: string;
  madeInNepal?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "best-sellers" | "most-reviewed";
  page?: number;
  perPage?: number;
}

function sortProducts(products: Product[], sort: ProductListParams["sort"] = "featured") {
  const result = [...products];
  switch (sort) {
    case "price-asc":
      return result.sort((a, b) => a.price - b.price);
    case "price-desc":
      return result.sort((a, b) => b.price - a.price);
    case "newest":
      return result.sort((a, b) => Number(Boolean(b.isNewArrival)) - Number(Boolean(a.isNewArrival)));
    case "best-sellers":
      return result.sort((a, b) => Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller)));
    case "most-reviewed":
      return result.sort((a, b) => b.reviewsCount - a.reviewsCount);
    case "featured":
    default:
      return result.sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
  }
}

export async function listProducts(params: ProductListParams = {}): Promise<ApiResponse<Product[]>> {
  let products = params.query ? searchProducts(params.query) : [...PRODUCTS];

  if (params.category) products = products.filter((p) => p.category === params.category);
  if (params.brand) products = products.filter((p) => p.brand === params.brand);
  if (params.concern) products = products.filter((p) => p.concernTags.includes(params.concern as string));
  if (params.skinType) products = products.filter((p) => p.skinType.includes(params.skinType as string));
  if (params.madeInNepal) products = products.filter((p) => p.madeInNepal);
  if (params.inStock) products = products.filter((p) => p.inStock);
  if (typeof params.minPrice === "number") products = products.filter((p) => p.price >= params.minPrice!);
  if (typeof params.maxPrice === "number") products = products.filter((p) => p.price <= params.maxPrice!);

  const sorted = sortProducts(products, params.sort);
  const page = Math.max(1, params.page || 1);
  const perPage = Math.max(1, params.perPage || sorted.length || 1);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  return ok(paginated, { page, perPage, total: sorted.length });
}

export async function getProduct(slug: string): Promise<ApiResponse<Product | null>> {
  return ok(getProductBySlug(slug) || null);
}

export async function listRelatedProducts(slug: string, limit = 4): Promise<ApiResponse<Product[]>> {
  const product = getProductBySlug(slug);
  return ok(product ? getRelatedProducts(product, limit) : []);
}

export async function listCategories(): Promise<ApiResponse<Category[]>> {
  return ok(CATEGORIES.map((c) => ({ id: c.slug, name: c.name, slug: c.slug, description: c.description, image: c.image })));
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { code: "khalti", label: "Khalti", enabled: true, requiresRedirect: true, publicKeyEnv: "NEXT_PUBLIC_KHALTI_PUBLIC_KEY" },
  { code: "esewa", label: "eSewa", enabled: true, requiresRedirect: true, publicKeyEnv: "NEXT_PUBLIC_ESEWA_MERCHANT_ID" },
  { code: "cod", label: "Cash on Delivery", enabled: true },
  { code: "card", label: "Cards", enabled: true, requiresRedirect: true },
];

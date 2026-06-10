import type { ApiResponse, Category, PaymentMethod } from "./contracts";
import type { Product } from "@/types/product";
import { apiRequest } from "./client";
import { adaptProduct, adaptProducts } from "./product-adapter";

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

export async function listProducts(params: ProductListParams = {}): Promise<ApiResponse<Product[]>> {
  const queryParams = new URLSearchParams();
  if (params.query) queryParams.set("q", params.query);
  if (params.category) queryParams.set("category", params.category);
  if (params.brand) queryParams.set("brand", params.brand);
  if (params.concern) queryParams.set("concern", params.concern);
  if (params.skinType) queryParams.set("skinType", params.skinType);
  if (params.madeInNepal) queryParams.set("madeInNepal", "1");
  if (params.inStock) queryParams.set("inStock", "1");
  if (params.minPrice !== undefined) queryParams.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) queryParams.set("maxPrice", String(params.maxPrice));
  if (params.sort) queryParams.set("sort", params.sort);
  if (params.page) queryParams.set("page", String(params.page));
  if (params.perPage) queryParams.set("perPage", String(params.perPage));

  const qs = queryParams.toString();
  const endpoint = params.query ? `/products/search?${qs}` : `/products?${qs}`;

  const result = await apiRequest<unknown[]>(endpoint);
  return { ...result, data: adaptProducts(result.data) };
}

export async function searchProducts(query: string, limit = 8): Promise<ApiResponse<Product[]>> {
  if (!query.trim()) return ok([]);
  const result = await apiRequest<unknown[]>(`/products/search?q=${encodeURIComponent(query)}&perPage=${limit}`);
  return { ...result, data: adaptProducts(result.data) };
}

export async function getProduct(slug: string): Promise<ApiResponse<Product | null>> {
  try {
    const apiResult = await apiRequest<unknown>(`/products/${slug}`);
    if (apiResult.status === "success" && apiResult.data) {
      return { ...apiResult, data: adaptProduct(apiResult.data) };
    }
  } catch {}
  return ok(null);
}

export async function listRelatedProducts(slug: string, limit = 4): Promise<ApiResponse<Product[]>> {
  try {
    const result = await apiRequest<unknown[]>(`/products/${slug}/related?limit=${limit}`);
    return { ...result, data: adaptProducts(result.data) };
  } catch {
    return ok([]);
  }
}

export async function listCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const apiResult = await apiRequest<Category[]>("/categories");
    if (apiResult.status === "success" && apiResult.data && apiResult.data.length > 0) {
      return apiResult;
    }
  } catch {}
  return ok([]);
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { code: "khalti", label: "Khalti", enabled: true, requiresRedirect: true, publicKeyEnv: "NEXT_PUBLIC_KHALTI_PUBLIC_KEY" },
  { code: "esewa", label: "eSewa", enabled: true, requiresRedirect: true, publicKeyEnv: "NEXT_PUBLIC_ESEWA_MERCHANT_ID" },
  { code: "cod", label: "Cash on Delivery", enabled: true },
  { code: "card", label: "Cards", enabled: true, requiresRedirect: true },
];
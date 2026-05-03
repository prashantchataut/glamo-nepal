import { PRODUCTS, getRelatedProducts } from "@/lib/mock/products";
import type { Product } from "@/store/useCartStore";
import { apiRequest } from "./client";
import type { ApiResponse } from "./contracts";

export interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  brandId: string | null;
  categoryId: string;
  basePrice: number;
  salePrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  reason: string;
  reasonLabel: string;
}

export interface TrendingProduct extends RecommendedProduct {
  trendingScore: number;
}

export interface RecommendationParams {
  context: "home" | "product" | "cart" | "shop";
  product_id?: string;
  session_id: string;
  user_id?: string;
  limit?: number;
}

export interface TrendingParams {
  window?: "24h" | "7d";
  category?: string;
  limit?: number;
}

function mapToProduct(rp: RecommendedProduct): Product {
  const mockProduct = PRODUCTS.find((p) => p.id === rp.id);
  if (mockProduct) {
    return {
      ...mockProduct,
      stockCount: rp.stockQuantity,
      inStock: rp.stockQuantity > 0,
      price: rp.salePrice ?? rp.basePrice,
      originalPrice: rp.salePrice ? rp.basePrice : undefined,
    };
  }

  return {
    id: rp.id,
    name: rp.name,
    slug: rp.slug,
    sku: "",
    brand: "",
    category: "",
    subCategory: "",
    price: rp.salePrice ?? rp.basePrice,
    originalPrice: rp.salePrice ? rp.basePrice : undefined,
    image: "/images/product-placeholder-skincare.svg",
    rating: 0,
    reviewsCount: 0,
    skinType: [],
    concernTags: rp.tags || [],
    benefits: [],
    howToUse: [],
    ingredients: [],
    size: "",
    origin: "",
    madeInNepal: false,
    stockCount: rp.stockQuantity,
    inStock: rp.stockQuantity > 0,
    sourceAuditNote: "",
    description: "",
  } as Product & { _reason?: string; _reasonLabel?: string };
}

export async function fetchRecommendations(
  params: RecommendationParams
): Promise<Product[]> {
  try {
    const queryParams = new URLSearchParams({
      context: params.context,
      session_id: params.session_id,
      limit: String(params.limit || 8),
    });
    if (params.product_id) queryParams.set("product_id", params.product_id);
    if (params.user_id) queryParams.set("user_id", params.user_id);

    const response = await apiRequest<RecommendedProduct[]>(
      `recommendations?${queryParams.toString()}`
    );

    if (response.status === "success" && response.data) {
      return response.data.map(mapToProduct);
    }
    throw new Error("Failed to fetch recommendations");
  } catch {
    return getFallbackRecommendations(params);
  }
}

export async function fetchTrending(params?: TrendingParams): Promise<Product[]> {
  try {
    const queryParams = new URLSearchParams({
      window: params?.window || "24h",
      limit: String(params?.limit || 10),
    });
    if (params?.category) queryParams.set("category", params.category);

    const response = await apiRequest<TrendingProduct[]>(
      `recommendations/trending?${queryParams.toString()}`
    );

    if (response.status === "success" && response.data) {
      return response.data.map(mapToProduct);
    }
    throw new Error("Failed to fetch trending");
  } catch {
    return PRODUCTS.filter((p) => p.isBestSeller).slice(0, params?.limit || 10);
  }
}

function getFallbackRecommendations(params: RecommendationParams): Product[] {
  if (params.context === "product" && params.product_id) {
    const product = PRODUCTS.find(
      (p) => p.id === params.product_id || p.slug === params.product_id
    );
    if (product) return getRelatedProducts(product, params.limit || 8);
  }
  return PRODUCTS.filter((p) => p.isFeatured).slice(0, params.limit || 8);
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem("glamo_session_id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem("glamo_session_id", id);
  return id;
}
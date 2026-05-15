export type ProductBadge = "Best Seller" | "New" | "Sale" | "Limited";

export interface ProductReviewSummary {
  average: number;
  count: number;
  highlights: string[];
}

export interface ShadeOption {
  name: string;
  hex?: string;
  stockCount?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  subCategory: string;
  price: number;
  originalPrice?: number;
  mrp?: number;
  image: string;
  images?: string[];
  badge?: ProductBadge;
  rating: number;
  reviewsCount: number;
  reviewSummary?: ProductReviewSummary;
  skinType: string[];
  concernTags: string[];
  benefits: string[];
  howToUse: string[];
  ingredients: string[];
  size: string;
  origin: string;
  madeInNepal: boolean;
  shadeOptions?: ShadeOption[];
  stockCount: number;
  inStock: boolean;
  sourceAuditNote?: string;
  description: string;
  deliveryNote?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedShade?: string;
}

export interface CartActionResult {
  ok: boolean;
  message?: string;
  available?: number;
}
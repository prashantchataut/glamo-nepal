import type { Product } from "@/types/product";
import { adaptApiProduct, adaptApiProducts } from "@/lib/api/product-adapter";
import { PRODUCTS, getProductBySlug as getLocalProductBySlug, getRelatedProducts as getLocalRelatedProducts, getProductsByCategory as getLocalProductsByCategory } from "@/lib/data/catalog-products";
import { backendJson } from "./backend";

interface BackendEnvelope<T> { success?: boolean; status?: string; data?: T; meta?: { total?: number; page?: number; perPage?: number; totalPages?: number } }

export async function getServerProduct(slug: string): Promise<Product | null> {
  const payload = await backendJson<BackendEnvelope<unknown>>(`/products/${encodeURIComponent(slug)}`);
  const dto = payload?.data;
  if (dto) return adaptApiProduct(dto);
  return getLocalProductBySlug(slug) ?? null;
}

export async function getServerRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const payload = await backendJson<BackendEnvelope<unknown[]>>(`/products?category=${encodeURIComponent(product.category)}&perPage=${limit + 1}`);
  if (Array.isArray(payload?.data) && payload.data.length > 0) {
    const related = adaptApiProducts(payload.data).filter((p) => p.slug !== product.slug).slice(0, limit);
    if (related.length > 0) return related;
  }
  return getLocalRelatedProducts(product, limit);
}

export async function getServerProductsByCategory(categorySlug: string, limit = 100): Promise<Product[]> {
  const payload = await backendJson<BackendEnvelope<unknown[]>>(`/products?category=${encodeURIComponent(categorySlug)}&perPage=${limit}`);
  if (Array.isArray(payload?.data) && payload.data.length > 0) return adaptApiProducts(payload.data);
  return getLocalProductsByCategory(categorySlug);
}

export async function getServerFeaturedProducts(limit = 4): Promise<Product[]> {
  const payload = await backendJson<BackendEnvelope<unknown[]>>(`/products?featured=true&perPage=${limit}`);
  if (Array.isArray(payload?.data) && payload.data.length > 0) return adaptApiProducts(payload.data).slice(0, limit);
  return PRODUCTS.filter((p) => p.isFeatured).slice(0, limit);
}

export async function getServerBestSellers(limit = 4): Promise<Product[]> {
  const payload = await backendJson<BackendEnvelope<unknown[]>>(`/products?sort=best-sellers&perPage=${limit}`);
  if (Array.isArray(payload?.data) && payload.data.length > 0) return adaptApiProducts(payload.data).slice(0, limit);
  return PRODUCTS.filter((p) => p.isBestSeller).slice(0, limit);
}

export async function getAllServerProducts(maxProducts = 400): Promise<Product[]> {
  const collected: Product[] = [];
  let page = 1;
  const pageSize = 100;
  while (collected.length < maxProducts) {
    const payload = await backendJson<BackendEnvelope<unknown[]>>(`/products?perPage=${pageSize}&page=${page}`);
    const batch = Array.isArray(payload?.data) ? adaptApiProducts(payload.data) : [];
    collected.push(...batch);
    if (batch.length < pageSize) break;
    page += 1;
  }
  if (collected.length > 0) return collected.slice(0, maxProducts);
  return PRODUCTS;
}
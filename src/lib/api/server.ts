import "server-only";
import type { Product } from "@/types/product";
import { adaptApiProduct as adaptProduct, adaptApiProducts as adaptProducts } from "./product-adapter";
import { backendJson } from "@/lib/server/backend";

/**
 * Server-side data access. Calls the backend over HTTP (service binding on
 * Cloudflare, absolute URL elsewhere). Every call is wrapped so that if the
 * backend is unavailable the caller falls back to the static catalog — pages
 * stay renderable in every environment while preferring live DB data.
 */
async function callBackend<T>(path: string): Promise<T | null> {
  const payload = await backendJson<
    | { success?: boolean; status?: string; data?: unknown }
    | null
  >(path);
  if (payload && (payload.success === true || payload.status === "success")) {
    return (payload.data as T) ?? null;
  }
  return null;
}

export async function getProductServer(slug: string): Promise<Product | null> {
  const data = await callBackend<unknown>(`/products/${encodeURIComponent(slug)}`);
  return data ? adaptProduct(data) : null;
}

export async function listProductsServer(queryString = ""): Promise<Product[]> {
  const suffix = queryString ? `?${queryString.replace(/^\?/, "")}` : "";
  const data = await callBackend<unknown[]>(`/products${suffix}`);
  return Array.isArray(data) ? adaptProducts(data) : [];
}

export async function getRelatedProductsServer(slug: string, limit = 4): Promise<Product[]> {
  const data = await callBackend<unknown[]>(`/products/${encodeURIComponent(slug)}/related?limit=${limit}`);
  return Array.isArray(data) ? adaptProducts(data) : [];
}

export interface ServerCategory {
  id: string;
  name: string;
  slug: string;
}

export async function listCategoriesServer(): Promise<ServerCategory[]> {
  const data = await callBackend<ServerCategory[]>("/categories");
  return Array.isArray(data) ? data : [];
}

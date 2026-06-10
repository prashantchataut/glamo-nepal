import "server-only";
import type { Product } from "@/types/product";
import { adaptApiProduct as adaptProduct, adaptApiProducts as adaptProducts } from "./product-adapter";

/**
 * Server-side data access that calls the in-process Hono backend directly
 * (no network hop). Every call is wrapped so that if the backend is
 * unavailable (e.g. no database configured at build time) the caller can
 * fall back to the static catalog. This keeps pages renderable in every
 * environment while preferring live data when the database is reachable.
 */
async function callBackend<T>(path: string): Promise<T | null> {
  try {
    const mod = await import("../../../backend/src/index");
    const app = mod.default;
    const res = await app.request(`/api/v1${path}`, { method: "GET" });
    if (!res.ok) return null;
    const json = (await res.json()) as
      | { success?: boolean; status?: string; data?: unknown }
      | null;
    if (json && (json.success === true || json.status === "success")) {
      return (json.data as T) ?? null;
    }
    return null;
  } catch {
    return null;
  }
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

import { apiRequest } from "@/lib/api/client";
import type { ApiResponse, ProductBundleContract, StockAlertPayload } from "@/lib/api/contracts";
import { getBundle, getBundles } from "@/lib/data/bundle-catalog";

const ok = <T>(data: T, message?: string): ApiResponse<T> => ({ status: "success", data, message });

function toContract(bundle: NonNullable<ReturnType<typeof getBundle>>): ProductBundleContract {
  return {
    id: bundle.slug,
    slug: bundle.slug,
    title: bundle.title,
    description: bundle.description,
    productIds: bundle.products.map((product) => product.id),
    bundlePrice: bundle.bundlePrice,
    subtotal: bundle.subtotal,
    savings: bundle.savings,
    currency: "NPR",
    active: true,
  };
}

export async function fetchRoutineBundles(): Promise<ApiResponse<ProductBundleContract[]>> {
  try {
    return await apiRequest<ProductBundleContract[]>("/routine-bundles");
  } catch {
    return ok(getBundles().map(toContract));
  }
}

export async function fetchRoutineBundle(slug: string): Promise<ApiResponse<ProductBundleContract | null>> {
  try {
    return await apiRequest<ProductBundleContract | null>(`/routine-bundles/${slug}`);
  } catch {
    const bundle = getBundle(slug);
    return ok(bundle ? toContract(bundle) : null);
  }
}

export async function createStockAlert(payload: StockAlertPayload): Promise<ApiResponse<{ queued: boolean }>> {
  return apiRequest<{ queued: boolean }>("/stock-alerts", { method: "POST", body: JSON.stringify(payload) });
}

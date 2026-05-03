export type GlamoAnalyticsEvent =
  | "page_view"
  | "product_viewed"
  | "search_submitted"
  | "filter_used"
  | "add_to_cart"
  | "remove_from_cart"
  | "wishlist_toggle"
  | "compare_toggle"
  | "checkout_started"
  | "shipping_info_submitted"
  | "payment_method_selected"
  | "order_simulated"
  | "order_placed"
  | "beauty_quiz_completed"
  | "whatsapp_click"
  | "instagram_click"
  | "bundle_add_to_cart"
  | "routine_viewed"
  | "notify_me_submitted"
  | "brand_viewed";

export interface AnalyticsPayload {
  productId?: string;
  productSlug?: string;
  sku?: string;
  value?: number;
  currency?: "NPR";
  method?: string;
  action?: string;
  category?: string;
  brand?: string;
  query?: string;
  results?: number;
  itemCount?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface AnalyticsEventEnvelope extends AnalyticsPayload {
  event: GlamoAnalyticsEvent;
  currency: "NPR";
  timestamp: string;
  path?: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: GlamoAnalyticsEvent, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  const data: AnalyticsEventEnvelope = {
    event,
    currency: "NPR",
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
    ...payload,
  };

  window.dispatchEvent(new CustomEvent("glamo:analytics", { detail: data }));
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
  window.gtag?.("event", event, data);

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tracking = require("./tracking") as typeof import("./tracking");
    switch (event) {
      case "product_viewed":
        tracking.trackProductView({ product_id: payload.productId || "", product_slug: payload.productSlug || "", category: payload.category, brand: payload.brand });
        break;
      case "add_to_cart":
        tracking.trackAddToCart({ product_id: payload.productId || "", product_slug: payload.productSlug || "", quantity: payload.itemCount, price_npr: payload.value });
        break;
      case "remove_from_cart":
        tracking.track({ type: "remove_from_cart", entity_id: payload.productId || "", metadata: { product_slug: payload.productSlug, quantity: payload.itemCount, price_npr: payload.value }, timestamp: new Date().toISOString() });
        break;
      case "wishlist_toggle":
        tracking.trackWishlistToggle({ product_id: payload.productId || "", product_slug: payload.productSlug || "", action: payload.action === "remove" ? "remove" : "add" });
        break;
      case "search_submitted":
        tracking.trackSearchQuery({ query: payload.query || "", results_count: payload.results });
        break;
      case "checkout_started":
        tracking.trackCheckoutStart({ cart_value_npr: payload.value, item_count: payload.itemCount });
        break;
      case "order_placed":
        tracking.trackPurchaseSuccess({ order_id: payload.productId || "", cart_value_npr: payload.value, item_count: payload.itemCount });
        break;
      case "page_view":
        tracking.track({ type: "page_view", metadata: { path: payload.path || window.location.pathname }, timestamp: new Date().toISOString() });
        break;
    }
  } catch {
    // tracking module not available during SSR
  }

  const numericValue = typeof data.value === "number" ? data.value : undefined;

  if (event === "add_to_cart") window.fbq?.("track", "AddToCart", { value: numericValue, currency: "NPR", content_ids: data.sku ? [data.sku] : undefined });
  if (event === "checkout_started") window.fbq?.("track", "InitiateCheckout", { value: numericValue, currency: "NPR" });
}

export const analytics = {
  pageView: (path?: string) => trackEvent("page_view", { path }),
  productViewed: (payload: AnalyticsPayload) => trackEvent("product_viewed", payload),
  searchSubmitted: (query: string, results: number) => trackEvent("search_submitted", { query, results }),
  filterUsed: (filter: string, value: string | boolean | number) => trackEvent("filter_used", { filter, filterValue: value }),
  checkoutStarted: (value: number) => trackEvent("checkout_started", { value }),
  routineViewed: (routineSlug: string) => trackEvent("routine_viewed", { routineSlug }),
  notifyMeSubmitted: (productSlug: string) => trackEvent("notify_me_submitted", { productSlug }),
};

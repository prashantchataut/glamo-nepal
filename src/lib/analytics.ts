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

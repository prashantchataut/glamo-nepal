import type { GlamoAnalyticsEvent, AnalyticsPayload } from "./analytics";

const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 50;
const STORAGE_KEY = "glamo_session_id";
const API_ENDPOINT = "/api/v1/events";

interface TrackingEvent {
  type: GlamoAnalyticsEvent;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface PendingBatch {
  session_id: string;
  user_id?: string;
  events: TrackingEvent[];
}

let buffer: TrackingEvent[] = [];
let sessionId: string | null = null;
let userId: string | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let isFlushing = false;

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}

function getOrCreateUserId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const authData = localStorage.getItem("glamo-auth-storage");
    if (authData) {
      const parsed = JSON.parse(authData);
      const uid = parsed?.state?.user?.id;
      if (typeof uid === "string") return uid;
    }
  } catch {
    // auth data not available
  }
  return undefined;
}

export function initEventTracker(): void {
  if (typeof window === "undefined") return;
  sessionId = getOrCreateSessionId();
  userId = getOrCreateUserId();

  flushTimer = setInterval(() => {
    flush();
  }, FLUSH_INTERVAL_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flush();
    }
  });

  window.addEventListener("beforeunload", () => {
    flush();
  });
}

export function setTrackingUserId(id: string | null): void {
  userId = id;
}

export function track(event: TrackingEvent): void {
  buffer.push(event);
  if (buffer.length >= MAX_BATCH_SIZE) {
    flush();
  }
}

export async function flush(): Promise<void> {
  if (isFlushing || buffer.length === 0 || !sessionId) return;
  isFlushing = true;

  const batch: PendingBatch = {
    session_id: sessionId,
    user_id: userId || undefined,
    events: buffer.splice(0, MAX_BATCH_SIZE),
  };

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const url = apiBase
      ? `${apiBase.replace(/\/$/, "")}/${API_ENDPOINT.replace(/^\//, "")}`
      : API_ENDPOINT;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
      keepalive: true,
    });

    if (!res.ok && res.status !== 204) {
      throw new Error(`Tracking failed: ${res.status}`);
    }
  } catch {
    buffer.unshift(...batch.events);
  } finally {
    isFlushing = false;
  }
}

export function trackProductView(payload: {
  product_id: string;
  product_slug: string;
  category?: string;
  brand?: string;
}): void {
  track({
    type: "product_view",
    entity_id: payload.product_id,
    metadata: {
      product_slug: payload.product_slug,
      category: payload.category,
      brand: payload.brand,
    },
    timestamp: new Date().toISOString(),
  });
}

export function trackAddToCart(payload: {
  product_id: string;
  product_slug: string;
  quantity?: number;
  price_npr?: number;
}): void {
  track({
    type: "add_to_cart",
    entity_id: payload.product_id,
    metadata: {
      product_slug: payload.product_slug,
      quantity: payload.quantity,
      price_npr: payload.price_npr,
    },
    timestamp: new Date().toISOString(),
  });
}

export function trackWishlistToggle(payload: {
  product_id: string;
  product_slug: string;
  action: "add" | "remove";
}): void {
  track({
    type: "wishlist_toggle",
    entity_id: payload.product_id,
    metadata: { product_slug: payload.product_slug, action: payload.action },
    timestamp: new Date().toISOString(),
  });
}

export function trackSearchQuery(payload: {
  query: string;
  results_count?: number;
}): void {
  track({
    type: "search_query",
    metadata: { query: payload.query, results_count: payload.results_count },
    timestamp: new Date().toISOString(),
  });
}

export function trackCategoryView(payload: { category_slug: string }): void {
  track({
    type: "category_view",
    metadata: { category_slug: payload.category_slug },
    timestamp: new Date().toISOString(),
  });
}

export function trackCheckoutStart(payload: {
  cart_value_npr?: number;
  item_count?: number;
}): void {
  track({
    type: "checkout_start",
    metadata: {
      cart_value_npr: payload.cart_value_npr,
      item_count: payload.item_count,
    },
    timestamp: new Date().toISOString(),
  });
}

export function trackPurchaseSuccess(payload: {
  order_id: string;
  cart_value_npr?: number;
  item_count?: number;
}): void {
  track({
    type: "purchase_success",
    metadata: {
      order_id: payload.order_id,
      cart_value_npr: payload.cart_value_npr,
      item_count: payload.item_count,
    },
    timestamp: new Date().toISOString(),
  });
}
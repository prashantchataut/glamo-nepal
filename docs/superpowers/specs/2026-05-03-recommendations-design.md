# GLAMO Nepal — Personalization & Recommendations System Design

**Date:** 2026-05-03  
**Status:** Approved  
**Approach:** Thin Client / Heavy DB (Approach A)

---

## Decisions

| Decision | Choice |
|----------|--------|
| Local vs server sync | Keep separate — local store stays instant, server events are analytics-only |
| Backend approach | Supabase RPC (leverage existing Postgres + Hono API) |
| Recommendation scope | All five types in first pass |
| Session ID strategy | localStorage UUID (no cookies, no fingerprinting) |
| Event batching | 5s debounce + visibility change flush |

---

## 1. Event Tracking System

### Event Emitter (`src/lib/tracking.ts`)

A singleton event emitter utility:

- **5-second debounce** — events accumulate in a buffer, flushed every 5s
- **Visibility change flush** — `document.visibilitychange` fires a flush on tab hide/close
- **Batch POST** — sends up to 50 events per request to `POST /events`
- **Retry once** — if the POST fails, events stay in buffer for next flush
- **Session ID** — UUID generated once, stored in `localStorage` under `glamo_session_id`, persists across tabs but not across devices (no fingerprinting)

### Event Types

| Event | Payload |
|-------|---------|
| `product_view` | `{ product_id, product_slug, category, brand }` |
| `add_to_cart` | `{ product_id, product_slug, quantity, price_npr }` |
| `wishlist_toggle` | `{ product_id, product_slug, action: "add" \| "remove" }` |
| `search_query` | `{ query, results_count }` — `entity_id` is null, query stored in metadata |
| `category_view` | `{ category_slug }` — `entity_id` is null, slug stored in metadata |
| `checkout_start` | `{ cart_value_npr, item_count }` — `entity_id` is null |
| `purchase_success` | `{ order_id, cart_value_npr, item_count }` — `entity_id` is null |

### Integration Points

- `ProductCard` — already fires `trackEvent("add_to_cart")` and `trackEvent("wishlist_toggle")`. Extend `analytics.ts` to also push into the event emitter buffer.
- Product detail page — fires `product_view` on mount
- Shop/search page — fires `search_query` and `category_view`
- Cart page — fires `checkout_start`
- Order confirmation — fires `purchase_success`

### Privacy

- No cookies, no fingerprinting. A single `localStorage` UUID is the session identifier.
- On login, associate `session_id` with `user_id` server-side (no client-side PII in events).
- Events contain no email, name, or address.

---

## 2. Database Schema (Supabase Postgres)

### `events` — Raw event stream

```sql
CREATE TABLE events (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id),
  session_id    UUID NOT NULL,
  event_type    TEXT NOT NULL CHECK (event_type IN (
    'product_view','add_to_cart','wishlist_toggle',
    'search_query','category_view',
    'checkout_start','purchase_success'
  )),
  entity_id     TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_user_id ON events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_entity_type ON events(entity_id, event_type);
```

### `product_metrics_daily` — Pre-aggregated daily rollups

```sql
CREATE TABLE product_metrics_daily (
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  views         INTEGER NOT NULL DEFAULT 0,
  adds_to_cart  INTEGER NOT NULL DEFAULT 0,
  purchases     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, date)
);

CREATE INDEX idx_pmd_date ON product_metrics_daily(date DESC);
```

### `user_product_affinity` — Computed affinity scores

```sql
CREATE TABLE user_product_affinity (
  user_id        UUID REFERENCES profiles(id),
  session_id     UUID NOT NULL,
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  score          REAL NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (COALESCE(user_id, session_id), product_id)
);
```

### RPC: `track_events`

Called from the Hono API. Bulk-inserts events and updates affinity scores in a single transaction:

1. Insert all events into `events` table
2. For each `product_view` event: upsert `user_product_affinity` — increment score by 1.0
3. For each `add_to_cart`: increment score by 3.0
4. For each `wishlist_toggle` (add): increment score by 2.0
5. For each `purchase_success`: increment score by 5.0

### RPC: `refresh_product_metrics`

Called via daily cron (or `pg_cron`). Aggregates last 24h of events:

```sql
INSERT INTO product_metrics_daily (product_id, date, views, adds_to_cart, purchases)
SELECT 
  (metadata->>'product_id')::uuid,
  CURRENT_DATE,
  COUNT(*) FILTER (WHERE event_type = 'product_view'),
  COUNT(*) FILTER (WHERE event_type = 'add_to_cart'),
  COUNT(*) FILTER (WHERE event_type = 'purchase_success')
FROM events
WHERE created_at >= CURRENT_DATE AND entity_id IS NOT NULL
GROUP BY (metadata->>'product_id')::uuid, CURRENT_DATE
ON CONFLICT (product_id, date) DO UPDATE SET
  views = EXCLUDED.views,
  adds_to_cart = EXCLUDED.adds_to_cart,
  purchases = EXCLUDED.purchases;
```

### Data Retention

- `events`: Partition by month. Drop partitions older than 90 days via cron.
- `product_metrics_daily`: Keep indefinitely (one row per product per day).
- `user_product_affinity`: Keep indefinitely, zero out scores older than 90 days via cron.

---

## 3. Backend API Endpoints

All endpoints are Hono routes on the existing Cloudflare Worker, calling Supabase RPCs.

### `POST /api/events`

**Request:**
```json
{
  "session_id": "uuid",
  "user_id": "uuid | null",
  "events": [
    {
      "type": "product_view",
      "entity_id": "p001",
      "metadata": { "product_slug": "vitamin-c-glow-serum", "category": "skincare", "brand": "Kathmandu Glow" },
      "timestamp": "2026-05-03T10:00:00Z"
    }
  ]
}
```

**Response:** `204 No Content` on success. `429` if rate-limited (max 100 events/min per session).

**Processing:** Calls `track_events` RPC. Writes events + updates affinity scores in one transaction.

### `GET /api/recommendations`

| Param | Required | Values | Description |
|-------|----------|--------|-------------|
| `context` | yes | `home`, `product`, `cart`, `shop` | Where the strip appears |
| `product_id` | if context=product | string | Current product slug/id |
| `session_id` | yes | uuid | Anonymous session identifier |
| `user_id` | no | uuid | If logged in |
| `limit` | no | number (default 8) | Max products to return |

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "p003",
      "name": "Invisible City SPF 50 PA++++",
      "slug": "invisible-city-spf-50-pa",
      "brand": "Solar Care",
      "category": "skincare",
      "price": 1650,
      "originalPrice": 1950,
      "image": "/images/products/p003.svg",
      "stockCount": 18,
      "inStock": true,
      "reason": "trending",
      "reasonLabel": "Trending now"
    }
  ],
  "meta": { "context": "home", "count": 8 }
}
```

**Logic by context:**

- **`home`** — 50% personalized (affinity-based) + 50% trending. Excludes out-of-stock.
- **`product`** — 50% similar (same category/brand/skinType) + 50% customers also viewed (collaborative). Excludes current product.
- **`cart`** — Prioritizes complementary categories (skincare → tools/makeup) + personalized.
- **`shop`** — Personalized + trending with broader diversity enforcement.

### `GET /api/trending`

| Param | Required | Values | Description |
|-------|----------|--------|-------------|
| `window` | no | `24h`, `7d` (default `24h`) | Time window |
| `category` | no | string | Filter by category slug |
| `limit` | no | number (default 10) | Max products |

**Response:** Same product shape as recommendations, with `reason: "trending"` and `reasonLabel: "Fast moving"`.

**Logic:** Queries `product_metrics_daily` for the given window. Ranks by `views * 1 + adds_to_cart * 3 + purchases * 5`. Excludes out-of-stock. Max 3 products per category in top 10.

### Caching

- `GET /recommendations`: Edge-cached for 5 minutes (`Cache-Control: public, s-maxage=300`). Varies by session_id hash.
- `GET /trending`: Edge-cached for 15 minutes (`Cache-Control: public, s-maxage=900`). Same for all users.

---

## 4. Recommendation Logic

### 1. Recently Viewed (Client-Side)

- Source: `useRecentlyViewedStore` (existing Zustand + localStorage)
- No API call — instant, offline-capable
- Horizontal strip, max 8 items, most recent first
- `product_view` events also sent to server for affinity scoring

### 2. Frequently Viewed / Personalized

- Source: `user_product_affinity` table
- RPC logic: Query top-N products by `score DESC` for the given session_id (or user_id if logged in, merging session data)
- Score weights: view=1, wishlist=2, cart=3, purchase=5
- Diversity filter: max 2 per category, fill remaining slots with next-highest-scored products
- Exclude: `stockCount <= 0` or `is_active = false`

### 3. Similar Products ("Customers also viewed")

Two signals combined:

- **Content-based**: Same category, overlapping `concernTags` or `skinType` as current product
- **Collaborative**: Products viewed by other users who also viewed this product (from `events` table, last 30 days)

RPC logic:
1. Get top 20 products from `events` where `session_id IN (SELECT DISTINCT session_id FROM events WHERE entity_id = $1 AND event_type = 'product_view') AND entity_id != $1`
2. Intersect with products matching same category or overlapping tags
3. Rank by frequency, apply diversity filter (max 2 per subcategory)
4. Fall back to content-based only if collaborative data is sparse (fewer than 5 sessions viewed this product)

### 4. Trending

- Source: `product_metrics_daily`
- RPC logic: For the given window, compute `trending_score = views * 1 + adds_to_cart * 3 + purchases * 5`
- Rank descending by trending_score
- Diversity: max 3 per category
- Exclude: out-of-stock, inactive products
- Label: "Fast moving" if trending_score > threshold, "Trending now" otherwise

### 5. Urgency Nudges

Product-level flags computed server-side, returned as part of any product response:

- **Low stock**: `stockCount < low_stock_threshold` (default 5). Label: "Only {stockCount} left"
- **Fast moving**: Product in trending top 20 for current 24h window. Label: "Fast moving"

**Anti-dark-pattern rules:**
- Never fabricate urgency — `stockCount` must come from real inventory
- "Fast moving" requires actual view+cart data from last 24h, not random assignment
- No countdown timers, no fake "X people viewing this now"

### Context Composition Rules

| Context | Slot 1 (4 items) | Slot 2 (4 items) | Fallback |
|---------|------------------|-------------------|----------|
| `home` | Personalized | Trending | Featured products |
| `product` | Similar (content) | Customers also viewed | Same-category products |
| `cart` | Complementary categories | Personalized | Trending |
| `shop` | Personalized | Trending | Featured products |

If personalized data is empty (new user), the slot falls back to trending, then to featured (`is_featured = true`).

---

## 5. Frontend Components & Integration

### New Files

**`src/lib/tracking.ts`** — Event emitter singleton
- `initEventTracker()` — creates/loads session UUID from localStorage, starts 5s flush interval, attaches visibilitychange listener
- `track(event)` — pushes event to buffer
- `flush()` — POSTs buffered events to `/api/events`, retries once on failure
- Typed wrappers: `trackProductView()`, `trackAddToCart()`, `trackWishlistToggle()`, `trackSearchQuery()`, `trackCategoryView()`, `trackCheckoutStart()`, `trackPurchaseSuccess()`
- Integrates with existing `analytics.ts`: `trackEvent()` also calls `track()` so both GTM and backend receive events

**`src/lib/api/recommendations.ts`** — API client
- `fetchRecommendations(params)` → calls `GET /api/recommendations`
- `fetchTrending(params)` → calls `GET /api/trending`
- Returns typed `Product[]` with extra `reason` and `reasonLabel` fields

### New Components

**`src/components/product/ProductRecommendationStrip.tsx`**
- Props: `title: string`, `products: Product[]`, `reasonLabels?: boolean`, `loading?: boolean`
- Horizontal scrollable strip of `ProductCard` components
- Shows `reasonLabel` badge on each card when `reasonLabels=true`
- Responsive: 2 columns mobile, 3 tablet, 4 desktop
- Skeleton state while loading

**`src/components/product/RecentlyViewedStrip.tsx`**
- Reads from `useRecentlyViewedStore`
- Client-only render (hydration-safe)
- Hidden if fewer than 2 items
- Title: "Recently Viewed"

**`src/components/product/UrgencyBadge.tsx`**
- Props: `product: Product` (with optional `lowStock`, `fastMoving` flags)
- Renders "Only X left" badge (amber) or "Fast moving" badge (teal)
- Positioned inside `ProductCard` and `ProductDetailClient`

### Page Integration

**Home page (`src/app/page.tsx`):**
- `<RecentlyViewedStrip />` after `<QuickCategoryPills />`
- `<ProductRecommendationStrip title="Recommended for You" />` (context=home) after `<FeaturedProducts />`
- `<ProductRecommendationStrip title="Trending Now" />` (context=home, trending bias) after `<TheGlowEdit />`

**Product page (`src/app/product/[slug]/ProductDetailClient.tsx`):**
- Replace current `related` prop with recommendation fetch: `context=product&product_id={slug}`
- Show "Customers also viewed" section with `reasonLabels=true`
- Add low stock / fast moving badges on product detail

**Cart page (`src/app/cart/page.tsx`):**
- `<ProductRecommendationStrip title="You might also like" />` (context=cart) before checkout section

**Shop page (`src/app/shop/page.tsx`):**
- `<ProductRecommendationStrip title="Recommended for You" />` sidebar or top section

### Data Flow

```
User action → trackProductView() → buffer → 5s flush → POST /api/events
                                                          ↓
                                                    Supabase RPC
                                                    (track_events)
                                                          ↓
                                              events table + affinity update

Page load → fetchRecommendations(context=...) → GET /api/recommendations
                                                      ↓
                                                Supabase RPC
                                                (get_recommendations)
                                                      ↓
                                              scored + filtered products
```

### Fallback Strategy

When the API is unavailable (offline, Supabase down, pre-launch with mock data):
- `fetchRecommendations` falls back to `getRelatedProducts()` from existing mock data layer
- `fetchTrending` falls back to `PRODUCTS.filter(p => p.isBestSeller)`
- Recently Viewed always works (local store)
- UI never breaks, even without a backend

---

## 6. A/B Test Suggestions

| Test | Hypothesis | Metric | Variant |
|------|-----------|--------|---------|
| Recommendation strip position | "Recommended for You" above fold converts better | CTR on recommendation cards, add-to-cart from strip | A: after QuickCategoryPills, B: after FeaturedProducts |
| Urgency badge style | "Fast moving" label increases CTR without reducing trust | CTR on products with badge vs without | A: teal "Fast moving" badge, B: no badge |
| Recently viewed threshold | Showing strip with 1 item is too sparse, 2 is minimum | Engagement with strip | A: show at 2+ items, B: show at 4+ items |
| Trending window | 24h trending feels more urgent than 7d | CTR on trending strip | A: 24h window, B: 7d window |
| Cart recommendation context | Complementary categories convert better than personalized | Add-to-cart rate from cart page strip | A: complementary categories, B: personalized |

---

## 7. Migration Plan

The Supabase migration file (`0003_recommendations.sql`) will create:
1. `events` table with indexes
2. `product_metrics_daily` table with indexes
3. `user_product_affinity` table with indexes
4. `track_events()` RPC function
5. `get_recommendations()` RPC function
6. `get_trending()` RPC function
7. `refresh_product_metrics()` RPC function
8. Row Level Security policies (service_role full access, anon read-only on metrics, no direct access to events/affinity)
9. `pg_cron` job for daily metrics refresh (if available) or instructions for external cron

The Hono API will add 3 new routes:
1. `POST /api/events` — calls `track_events` RPC
2. `GET /api/recommendations` — calls `get_recommendations` RPC
3. `GET /api/trending` — calls `get_trending` RPC
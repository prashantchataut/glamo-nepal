# Recommendations & Personalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a privacy-respecting personalization and recommendation system for GLAMO Nepal with event tracking, Supabase-backed recommendation logic, and frontend recommendation strips.

**Architecture:** Thin client / heavy DB approach. Frontend tracks events via a batching emitter, displays recommendation strips via API calls with local fallbacks. Backend uses Supabase RPCs for recommendation scoring and event storage. All recommendation logic lives in Postgres functions.

**Tech Stack:** Next.js 14, Zustand, Supabase Postgres, Hono (Cloudflare Workers), TypeScript

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `src/lib/tracking.ts` | Event emitter singleton with batching, session UUID, typed wrappers |
| `src/lib/api/recommendations.ts` | API client for `/api/recommendations` and `/api/trending` |
| `src/components/product/ProductRecommendationStrip.tsx` | Horizontal recommendation strip component |
| `src/components/product/UrgencyBadge.tsx` | Low stock / fast moving badge component |
| `backend/src/modules/events/event.schema.ts` | Zod schemas for event ingestion |
| `backend/src/modules/events/event.service.ts` | Event insertion + affinity update service |
| `backend/src/modules/events/event.controller.ts` | POST /events handler |
| `backend/src/modules/events/event.routes.ts` | Route definitions for events module |
| `backend/src/modules/recommendations/recommendation.schema.ts` | Zod schemas for recommendation/trending queries |
| `backend/src/modules/recommendations/recommendation.service.ts` | Recommendation scoring service |
| `backend/src/modules/recommendations/recommendation.controller.ts` | GET /recommendations and /trending handlers |
| `backend/src/modules/recommendations/recommendation.routes.ts` | Route definitions for recommendations module |
| `backend/supabase/migrations/0003_recommendations.sql` | New tables, indexes, RPCs, RLS policies |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/analytics.ts` | Add call to tracking emitter from `trackEvent()` |
| `src/store/useRecentlyViewedStore.ts` | No changes needed (already works) |
| `src/components/product/ProductCard.tsx` | Add `UrgencyBadge` integration |
| `src/app/page.tsx` | Add recommendation strips to home page |
| `src/app/product/[slug]/ProductDetailClient.tsx` | Replace `related` with API-driven recommendations, add urgency badges |
| `src/app/cart/page.tsx` | Add cart recommendation strip |
| `src/app/shop/ShopPageContent.tsx` | Add shop recommendation strip |
| `backend/src/index.ts` | Register new routes for events and recommendations |

---

### Task 1: Supabase Migration — Events, Metrics, Affinity Tables + RPCs

**Files:**
- Create: `backend/supabase/migrations/0003_recommendations.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- GLAMO Nepal - Recommendations & Personalization Schema
-- Run after 0001_initial_schema.sql

-- ============================================
-- EVENTS
-- ============================================

CREATE TABLE events (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
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

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on events" ON events
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- PRODUCT METRICS DAILY
-- ============================================

CREATE TABLE product_metrics_daily (
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  views         INTEGER NOT NULL DEFAULT 0,
  adds_to_cart  INTEGER NOT NULL DEFAULT 0,
  purchases     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, date)
);

CREATE INDEX idx_pmd_date ON product_metrics_daily(date DESC);
CREATE INDEX idx_pmd_product ON product_metrics_daily(product_id);

ALTER TABLE product_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on metrics" ON product_metrics_daily
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read metrics" ON product_metrics_daily
  FOR SELECT USING (true);

-- ============================================
-- USER PRODUCT AFFINITY
-- ============================================

CREATE TABLE user_product_affinity (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id    UUID NOT NULL,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  score         REAL NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_affinity_unique ON user_product_affinity (COALESCE(user_id, session_id), product_id);
CREATE INDEX idx_affinity_user ON user_product_affinity (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_affinity_session ON user_product_affinity (session_id);
CREATE INDEX idx_affinity_score ON user_product_affinity (score DESC);

ALTER TABLE user_product_affinity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on affinity" ON user_product_affinity
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- RPC: track_events
-- ============================================

CREATE OR REPLACE FUNCTION track_events(
  p_events JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_item JSONB;
  evt_type TEXT;
  evt_entity_id TEXT;
  evt_session_id UUID;
  evt_user_id UUID;
  evt_metadata JSONB;
  affinity_score REAL;
BEGIN
  FOR event_item IN SELECT * FROM jsonb_array_elements(p_events)
  LOOP
    evt_type := event_item->>'type';
    evt_entity_id := event_item->>'entity_id';
    evt_session_id := (event_item->>'session_id')::uuid;
    evt_user_id := CASE WHEN event_item->>'user_id' IS NOT NULL THEN (event_item->>'user_id')::uuid ELSE NULL END;
    evt_metadata := COALESCE(event_item->>'metadata', '{}')::jsonb;

    INSERT INTO events (user_id, session_id, event_type, entity_id, metadata)
    VALUES (evt_user_id, evt_session_id, evt_type, evt_entity_id, evt_metadata);

    -- Update affinity scores for product-related events
    IF evt_entity_id IS NOT NULL AND evt_type IN ('product_view', 'add_to_cart', 'wishlist_toggle', 'purchase_success') THEN
      affinity_score := CASE evt_type
        WHEN 'product_view' THEN 1.0
        WHEN 'wishlist_toggle' THEN
          CASE WHEN evt_metadata->>'action' = 'add' THEN 2.0 ELSE -2.0 END
        WHEN 'add_to_cart' THEN 3.0
        WHEN 'purchase_success' THEN 5.0
        ELSE 0
      END;

      IF affinity_score > 0 THEN
        INSERT INTO user_product_affinity (user_id, session_id, product_id, score, last_viewed_at, updated_at)
        VALUES (
          evt_user_id,
          evt_session_id,
          evt_entity_id::uuid,
          affinity_score,
          NOW(),
          NOW()
        )
        ON CONFLICT (COALESCE(user_id, session_id), product_id) DO UPDATE SET
          score = user_product_affinity.score + affinity_score,
          last_viewed_at = NOW(),
          updated_at = NOW();
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- ============================================
-- RPC: get_recommendations
-- ============================================

CREATE OR REPLACE FUNCTION get_recommendations(
  p_context TEXT,
  p_product_id UUID DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  brand_id UUID,
  category_id UUID,
  base_price INTEGER,
  sale_price INTEGER,
  stock_quantity INTEGER,
  low_stock_threshold INTEGER,
  is_active BOOLEAN,
  is_featured BOOLEAN,
  tags JSONB,
  reason TEXT,
  reason_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_identifier UUID;
BEGIN
  -- Use user_id if logged in, otherwise session_id
  v_identifier := COALESCE(p_user_id, p_session_id);

  IF p_context = 'home' THEN
    -- Mix personalized + trending
    RETURN QUERY
    SELECT
      p.id, p.name, p.slug, p.brand_id, p.category_id,
      p.base_price, p.sale_price, p.stock_quantity, p.low_stock_threshold,
      p.is_active, p.is_featured, p.tags,
      'personalized'::TEXT AS reason,
      'Recommended for you'::TEXT AS reason_label
    FROM products p
    INNER JOIN user_product_affinity a ON a.product_id = p.id
    WHERE (a.user_id = p_user_id OR a.session_id = p_session_id)
      AND p.is_active = true
      AND p.stock_quantity > 0
      AND p.deleted_at IS NULL
      AND p.id NOT IN (
        SELECT product_id FROM user_product_affinity
        WHERE (user_id = p_user_id OR session_id = p_session_id)
        ORDER BY score DESC LIMIT 4
      )
    ORDER BY a.score DESC
    LIMIT p_limit / 2;

    -- Trending slot
    RETURN QUERY
    SELECT
      p.id, p.name, p.slug, p.brand_id, p.category_id,
      p.base_price, p.sale_price, p.stock_quantity, p.low_stock_threshold,
      p.is_active, p.is_featured, p.tags,
      'trending'::TEXT AS reason,
      'Trending now'::TEXT AS reason_label
    FROM products p
    INNER JOIN product_metrics_daily m ON m.product_id = p.id
    WHERE p.is_active = true
      AND p.stock_quantity > 0
      AND p.deleted_at IS NULL
      AND m.date >= CURRENT_DATE - INTERVAL '1 day'
    GROUP BY p.id
    ORDER BY (SUM(m.views) + SUM(m.adds_to_cart) * 3 + SUM(m.purchases) * 5) DESC
    LIMIT p_limit / 2;

  ELSIF p_context = 'product' THEN
    -- Similar products (same category, overlapping tags)
    RETURN QUERY
    SELECT
      p.id, p.name, p.slug, p.brand_id, p.category_id,
      p.base_price, p.sale_price, p.stock_quantity, p.low_stock_threshold,
      p.is_active, p.is_featured, p.tags,
      'similar'::TEXT AS reason,
      'Similar products'::TEXT AS reason_label
    FROM products p
    WHERE p.category_id = (SELECT category_id FROM products WHERE id = p_product_id)
      AND p.id != p_product_id
      AND p.is_active = true
      AND p.stock_quantity > 0
      AND p.deleted_at IS NULL
    ORDER BY p.is_featured DESC, p.created_at DESC
    LIMIT p_limit / 2;

    -- Customers also viewed (collaborative)
    RETURN QUERY
    SELECT DISTINCT ON (p.id)
      p.id, p.name, p.slug, p.brand_id, p.category_id,
      p.base_price, p.sale_price, p.stock_quantity, p.low_stock_threshold,
      p.is_active, p.is_featured, p.tags,
      'also_viewed'::TEXT AS reason,
      'Customers also viewed'::TEXT AS reason_label
    FROM products p
    INNER JOIN events e ON e.entity_id = p.id::TEXT
    WHERE e.event_type = 'product_view'
      AND e.session_id IN (
        SELECT DISTINCT session_id FROM events
        WHERE entity_id = p_product_id::TEXT
          AND event_type = 'product_view'
          AND created_at >= NOW() - INTERVAL '30 days'
        LIMIT 50
      )
      AND p.id != p_product_id
      AND p.is_active = true
      AND p.stock_quantity > 0
      AND p.deleted_at IS NULL
    LIMIT p_limit / 2;

  ELSIF p_context = 'cart' THEN
    -- Complementary categories + personalized
    RETURN QUERY
    SELECT
      p.id, p.name, p.slug, p.brand_id, p.category_id,
      p.base_price, p.sale_price, p.stock_quantity, p.low_stock_threshold,
      p.is_active, p.is_featured, p.tags,
      'personalized'::TEXT AS reason,
      'You might also like'::TEXT AS reason_label
    FROM products p
    INNER JOIN user_product_affinity a ON a.product_id = p.id
    WHERE (a.user_id = p_user_id OR a.session_id = p_session_id)
      AND p.is_active = true
      AND p.stock_quantity > 0
      AND p.deleted_at IS NULL
    ORDER BY a.score DESC
    LIMIT p_limit;

  ELSIF p_context = 'shop' THEN
    -- Personalized + trending with diversity
    RETURN QUERY
    SELECT
      p.id, p.name, p.slug, p.brand_id, p.category_id,
      p.base_price, p.sale_price, p.stock_quantity, p.low_stock_threshold,
      p.is_active, p.is_featured, p.tags,
      'personalized'::TEXT AS reason,
      'Recommended for you'::TEXT AS reason_label
    FROM products p
    INNER JOIN user_product_affinity a ON a.product_id = p.id
    WHERE (a.user_id = p_user_id OR a.session_id = p_session_id)
      AND p.is_active = true
      AND p.stock_quantity > 0
      AND p.deleted_at IS NULL
    ORDER BY a.score DESC
    LIMIT p_limit / 2;

    RETURN QUERY
    SELECT
      p.id, p.name, p.slug, p.brand_id, p.category_id,
      p.base_price, p.sale_price, p.stock_quantity, p.low_stock_threshold,
      p.is_active, p.is_featured, p.tags,
      'trending'::TEXT AS reason,
      'Trending now'::TEXT AS reason_label
    FROM products p
    INNER JOIN product_metrics_daily m ON m.product_id = p.id
    WHERE p.is_active = true
      AND p.stock_quantity > 0
      AND p.deleted_at IS NULL
      AND m.date >= CURRENT_DATE - INTERVAL '1 day'
    GROUP BY p.id
    ORDER BY (SUM(m.views) + SUM(m.adds_to_cart) * 3 + SUM(m.purchases) * 5) DESC
    LIMIT p_limit / 2;
  END IF;

  -- Fallback: featured products if no results
  RETURN QUERY
  SELECT
    p.id, p.name, p.slug, p.brand_id, p.category_id,
    p.base_price, p.sale_price, p.stock_quantity, p.low_stock_threshold,
    p.is_active, p.is_featured, p.tags,
    'featured'::TEXT AS reason,
    'Featured'::TEXT AS reason_label
  FROM products p
  WHERE p.is_active = true
    AND p.is_featured = true
    AND p.stock_quantity > 0
    AND p.deleted_at IS NULL
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- RPC: get_trending
-- ============================================

CREATE OR REPLACE FUNCTION get_trending(
  p_window TEXT DEFAULT '24h',
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  brand_id UUID,
  category_id UUID,
  base_price INTEGER,
  sale_price INTEGER,
  stock_quantity INTEGER,
  low_stock_threshold INTEGER,
  is_active BOOLEAN,
  is_featured BOOLEAN,
  tags JSONB,
  trending_score BIGINT,
  reason TEXT,
  reason_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_offset INTERVAL;
BEGIN
  v_date_offset := CASE p_window
    WHEN '24h' THEN INTERVAL '1 day'
    WHEN '7d' THEN INTERVAL '7 days'
    ELSE INTERVAL '1 day'
  END;

  RETURN QUERY
  SELECT
    p.id, p.name, p.slug, p.brand_id, p.category_id,
    p.base_price, p.sale_price, p.stock_quantity, p.low_stock_threshold,
    p.is_active, p.is_featured, p.tags,
    (SUM(m.views) + SUM(m.adds_to_cart) * 3 + SUM(m.purchases) * 5) AS trending_score,
    CASE
      WHEN (SUM(m.views) + SUM(m.adds_to_cart) * 3 + SUM(m.purchases) * 5) > 50
      THEN 'trending'
      ELSE 'popular'
    END::TEXT AS reason,
    CASE
      WHEN (SUM(m.views) + SUM(m.adds_to_cart) * 3 + SUM(m.purchases) * 5) > 50
      THEN 'Fast moving'
      ELSE 'Trending now'
    END::TEXT AS reason_label
  FROM products p
  INNER JOIN product_metrics_daily m ON m.product_id = p.id
  WHERE p.is_active = true
    AND p.stock_quantity > 0
    AND p.deleted_at IS NULL
    AND m.date >= CURRENT_DATE - v_date_offset
    AND (p_category IS NULL OR p.category_id = (SELECT id FROM categories WHERE slug = p_category LIMIT 1))
  GROUP BY p.id
  ORDER BY trending_score DESC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- RPC: refresh_product_metrics
-- ============================================

CREATE OR REPLACE FUNCTION refresh_product_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO product_metrics_daily (product_id, date, views, adds_to_cart, purchases)
  SELECT
    (e.metadata->>'product_id')::uuid,
    CURRENT_DATE,
    COUNT(*) FILTER (WHERE e.event_type = 'product_view'),
    COUNT(*) FILTER (WHERE e.event_type = 'add_to_cart'),
    COUNT(*) FILTER (WHERE e.event_type = 'purchase_success')
  FROM events e
  WHERE e.created_at >= CURRENT_DATE
    AND e.entity_id IS NOT NULL
    AND e.event_type IN ('product_view', 'add_to_cart', 'purchase_success')
  GROUP BY (e.metadata->>'product_id')::uuid, CURRENT_DATE
  ON CONFLICT (product_id, date) DO UPDATE SET
    views = EXCLUDED.views,
    adds_to_cart = EXCLUDED.adds_to_cart,
    purchases = EXCLUDED.purchases;
END;
$$;

-- ============================================
-- RPC: cleanup_old_events
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM events WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM user_product_affinity WHERE updated_at < NOW() - INTERVAL '90 days' AND score <= 0;
END;
$$;
```

- [ ] **Step 2: Commit the migration**

```bash
git add backend/supabase/migrations/0003_recommendations.sql
git commit -m "feat: add recommendations database schema with events, metrics, affinity tables and RPCs"
```

---

### Task 2: Backend — Events Module

**Files:**
- Create: `backend/src/modules/events/event.schema.ts`
- Create: `backend/src/modules/events/event.service.ts`
- Create: `backend/src/modules/events/event.controller.ts`
- Create: `backend/src/modules/events/event.routes.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Create `backend/src/modules/events/event.schema.ts`**

```typescript
import { z } from 'zod'

const eventTypeSchema = z.enum([
  'product_view',
  'add_to_cart',
  'wishlist_toggle',
  'search_query',
  'category_view',
  'checkout_start',
  'purchase_success',
])

const eventItemSchema = z.object({
  type: eventTypeSchema,
  entity_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().optional(),
})

export const trackEventsSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  events: z.array(eventItemSchema).min(1).max(50),
})

export type TrackEventsInput = z.infer<typeof trackEventsSchema>
export type EventItemInput = z.infer<typeof eventItemSchema>
```

- [ ] **Step 2: Create `backend/src/modules/events/event.service.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import { handleSupabaseError } from '../../utils/supabase'

interface EventItem {
  type: string
  entity_id?: string
  metadata?: Record<string, unknown>
  timestamp?: string
}

export async function trackEvents(
  sessionId: string,
  userId: string | undefined,
  events: EventItem[],
  supabase: SupabaseClient
) {
  const eventsJson = events.map((evt) => ({
    type: evt.type,
    entity_id: evt.entity_id || null,
    session_id: sessionId,
    user_id: userId || null,
    metadata: evt.metadata || {},
    timestamp: evt.timestamp || new Date().toISOString(),
  }))

  const { error } = await supabase.rpc('track_events', {
    p_events: eventsJson,
  })

  if (error) handleSupabaseError(error, 'trackEvents')
}
```

- [ ] **Step 3: Create `backend/src/modules/events/event.controller.ts`**

```typescript
import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { ApiResponse } from '../../utils/response'
import * as EventService from './event.service'

export async function trackEvents(c: Context<AppEnv>) {
  try {
    const body = c.get('validatedBody')
    const { session_id, user_id, events } = body
    const supabase = c.get('supabase')

    await EventService.trackEvents(session_id, user_id, events, supabase)

    return c.json({}, 204)
  } catch (error: any) {
    return ApiResponse.error(c, error.message || 'Failed to track events', 500)
  }
}
```

- [ ] **Step 4: Create `backend/src/modules/events/event.routes.ts`**

```typescript
import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { validateBody } from '../../middleware/validate'
import { trackEventsSchema } from './event.schema'
import type { ZodSchema } from 'zod'
import { trackEvents } from './event.controller'

const eventRoutes = new Hono<AppEnv>()

eventRoutes.post('/', validateBody(trackEventsSchema as ZodSchema<any>), trackEvents)

export { eventRoutes }
```

- [ ] **Step 5: Register event routes in `backend/src/index.ts`**

Add these imports near the top (after the existing module imports):

```typescript
import { eventRoutes } from './modules/events/event.routes'
```

Add this route registration (after the existing routes, before the docs routes):

```typescript
app.route('/api/v1/events', eventRoutes)
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/events/ backend/src/index.ts
git commit -m "feat: add events module with track_events endpoint and RPC integration"
```

---

### Task 3: Backend — Recommendations Module

**Files:**
- Create: `backend/src/modules/recommendations/recommendation.schema.ts`
- Create: `backend/src/modules/recommendations/recommendation.service.ts`
- Create: `backend/src/modules/recommendations/recommendation.controller.ts`
- Create: `backend/src/modules/recommendations/recommendation.routes.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Create `backend/src/modules/recommendations/recommendation.schema.ts`**

```typescript
import { z } from 'zod'

export const recommendationQuerySchema = z.object({
  context: z.enum(['home', 'product', 'cart', 'shop']),
  product_id: z.string().uuid().optional(),
  session_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(20).default(8),
})

export const trendingQuerySchema = z.object({
  window: z.enum(['24h', '7d']).default('24h'),
  category: z.string().optional(),
  limit: z.coerce.number().int().positive().max(20).default(10),
})

export type RecommendationQueryInput = z.infer<typeof recommendationQuerySchema>
export type TrendingQueryInput = z.infer<typeof trendingQuerySchema>
```

- [ ] **Step 2: Create `backend/src/modules/recommendations/recommendation.service.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import { handleSupabaseError } from '../../utils/supabase'

interface RecommendationProduct {
  id: string
  name: string
  slug: string
  brand_id: string | null
  category_id: string
  base_price: number
  sale_price: number | null
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
  is_featured: boolean
  tags: string[] | null
  reason: string
  reason_label: string
}

interface TrendingProduct {
  id: string
  name: string
  slug: string
  brand_id: string | null
  category_id: string
  base_price: number
  sale_price: number | null
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
  is_featured: boolean
  tags: string[] | null
  trending_score: number
  reason: string
  reason_label: string
}

export async function getRecommendations(
  context: string,
  productId: string | undefined,
  sessionId: string,
  userId: string | undefined,
  limit: number,
  supabase: SupabaseClient
) {
  const { data, error } = await supabase.rpc('get_recommendations', {
    p_context: context,
    p_product_id: productId || null,
    p_session_id: sessionId,
    p_user_id: userId || null,
    p_limit: limit,
  })

  if (error) handleSupabaseError(error, 'getRecommendations')

  const products = (data || []) as RecommendationProduct[]

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brand_id,
    categoryId: p.category_id,
    basePrice: p.base_price,
    salePrice: p.sale_price,
    stockQuantity: p.stock_quantity,
    lowStockThreshold: p.low_stock_threshold,
    isActive: p.is_active,
    isFeatured: p.is_featured,
    tags: p.tags || [],
    reason: p.reason,
    reasonLabel: p.reason_label,
  }))
}

export async function getTrending(
  window: string,
  category: string | undefined,
  limit: number,
  supabase: SupabaseClient
) {
  const { data, error } = await supabase.rpc('get_trending', {
    p_window: window,
    p_category: category || null,
    p_limit: limit,
  })

  if (error) handleSupabaseError(error, 'getTrending')

  const products = (data || []) as TrendingProduct[]

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brand_id,
    categoryId: p.category_id,
    basePrice: p.base_price,
    salePrice: p.sale_price,
    stockQuantity: p.stock_quantity,
    lowStockThreshold: p.low_stock_threshold,
    isActive: p.is_active,
    isFeatured: p.is_featured,
    tags: p.tags || [],
    trendingScore: p.trending_score,
    reason: p.reason,
    reasonLabel: p.reason_label,
  }))
}
```

- [ ] **Step 3: Create `backend/src/modules/recommendations/recommendation.controller.ts`**

```typescript
import type { Context } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { AppError } from '../../utils/supabase'
import { ApiResponse } from '../../utils/response'
import * as RecommendationService from './recommendation.service'

export async function getRecommendations(c: Context<AppEnv>) {
  try {
    const query = c.get('validatedQuery')
    const supabase = c.get('supabase')

    const products = await RecommendationService.getRecommendations(
      query.context,
      query.product_id,
      query.session_id,
      query.user_id,
      query.limit,
      supabase
    )

    return ApiResponse.success(c, 'Recommendations fetched', products)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch recommendations', 500)
  }
}

export async function getTrending(c: Context<AppEnv>) {
  try {
    const query = c.get('validatedQuery')
    const supabase = c.get('supabase')

    const products = await RecommendationService.getTrending(
      query.window,
      query.category,
      query.limit,
      supabase
    )

    return ApiResponse.success(c, 'Trending products fetched', products)
  } catch (error: any) {
    if (error instanceof AppError) {
      return ApiResponse.error(c, error.message, error.statusCode)
    }
    return ApiResponse.error(c, error.message || 'Failed to fetch trending products', 500)
  }
}
```

- [ ] **Step 4: Create `backend/src/modules/recommendations/recommendation.routes.ts`**

```typescript
import { Hono } from 'hono'
import type { AppEnv } from '../../types/bindings'
import { validateQuery } from '../../middleware/validate'
import { recommendationQuerySchema, trendingQuerySchema } from './recommendation.schema'
import type { ZodSchema } from 'zod'
import { getRecommendations, getTrending } from './recommendation.controller'

const recommendationRoutes = new Hono<AppEnv>()

recommendationRoutes.get('/', validateQuery(recommendationQuerySchema as ZodSchema<any>), getRecommendations)
recommendationRoutes.get('/trending', validateQuery(trendingQuerySchema as ZodSchema<any>), getTrending)

export { recommendationRoutes }
```

- [ ] **Step 5: Register recommendation routes in `backend/src/index.ts`**

Add import:

```typescript
import { recommendationRoutes } from './modules/recommendations/recommendation.routes'
```

Add route:

```typescript
app.route('/api/v1/recommendations', recommendationRoutes)
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/recommendations/ backend/src/index.ts
git commit -m "feat: add recommendations module with get_recommendations and get_trending endpoints"
```

---

### Task 4: Frontend — Event Tracking Emitter

**Files:**
- Create: `src/lib/tracking.ts`
- Modify: `src/lib/analytics.ts`

- [ ] **Step 1: Create `src/lib/tracking.ts`**

```typescript
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
  } catch {}
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
    const url = apiBase ? `${apiBase.replace(/\/$/, "")}/${API_ENDPOINT.replace(/^\//, "")}` : API_ENDPOINT;

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

export function trackProductView(payload: { product_id: string; product_slug: string; category?: string; brand?: string }): void {
  track({
    type: "product_view",
    entity_id: payload.product_id,
    metadata: { product_slug: payload.product_slug, category: payload.category, brand: payload.brand },
    timestamp: new Date().toISOString(),
  });
}

export function trackAddToCart(payload: { product_id: string; product_slug: string; quantity?: number; price_npr?: number }): void {
  track({
    type: "add_to_cart",
    entity_id: payload.product_id,
    metadata: { product_slug: payload.product_slug, quantity: payload.quantity, price_npr: payload.price_npr },
    timestamp: new Date().toISOString(),
  });
}

export function trackWishlistToggle(payload: { product_id: string; product_slug: string; action: "add" | "remove" }): void {
  track({
    type: "wishlist_toggle",
    entity_id: payload.product_id,
    metadata: { product_slug: payload.product_slug, action: payload.action },
    timestamp: new Date().toISOString(),
  });
}

export function trackSearchQuery(payload: { query: string; results_count?: number }): void {
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

export function trackCheckoutStart(payload: { cart_value_npr?: number; item_count?: number }): void {
  track({
    type: "checkout_start",
    metadata: { cart_value_npr: payload.cart_value_npr, item_count: payload.item_count },
    timestamp: new Date().toISOString(),
  });
}

export function trackPurchaseSuccess(payload: { order_id: string; cart_value_npr?: number; item_count?: number }): void {
  track({
    type: "purchase_success",
    metadata: { order_id: payload.order_id, cart_value_npr: payload.cart_value_npr, item_count: payload.item_count },
    timestamp: new Date().toISOString(),
  });
}
```

- [ ] **Step 2: Modify `src/lib/analytics.ts` to integrate with tracking**

Add these imports at the top of the file (after the existing declarations):

```typescript
import { trackProductView, trackAddToCart, trackWishlistToggle, trackSearchQuery, trackCheckoutStart } from "./tracking";
```

Inside the `trackEvent` function, after the `window.dataLayer.push(data);` line and before the `const numericValue` line, add:

```typescript
  if (typeof window !== "undefined") {
    switch (event) {
      case "product_viewed":
        trackProductView({ product_id: payload.productId || "", product_slug: payload.productSlug || "", category: payload.category, brand: payload.brand });
        break;
      case "add_to_cart":
        trackAddToCart({ product_id: payload.productId || "", product_slug: payload.productSlug || "", quantity: payload.quantity as number | undefined, price_npr: payload.value });
        break;
      case "wishlist_toggle":
        trackWishlistToggle({ product_id: payload.productId || "", product_slug: payload.productSlug || "", action: (payload.action as string) === "remove" ? "remove" : "add" });
        break;
      case "search_submitted":
        trackSearchQuery({ query: payload.query as string || "", results_count: payload.results as number | undefined });
        break;
      case "checkout_started":
        trackCheckoutStart({ cart_value_npr: payload.value, item_count: payload.itemCount as number | undefined });
        break;
    }
  }
```

Also add `category`, `brand`, `query`, `results`, and `itemCount` to the `AnalyticsPayload` interface:

```typescript
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
```

- [ ] **Step 3: Initialize the tracker in `src/app/layout.tsx`**

Create a new client component `src/components/providers/TrackingProvider.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { initEventTracker } from "@/lib/tracking";

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initEventTracker();
  }, []);

  return <>{children}</>;
}
```

Wrap the children in `src/app/layout.tsx` inside `<AppShell>`:

```tsx
<TrackingProvider>{children}</TrackingProvider>
```

Add the import:

```typescript
import { TrackingProvider } from "@/components/providers/TrackingProvider";
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/tracking.ts src/lib/analytics.ts src/components/providers/TrackingProvider.tsx src/app/layout.tsx
git commit -m "feat: add event tracking emitter with batching, session management, and analytics integration"
```

---

### Task 5: Frontend — Recommendations API Client

**Files:**
- Create: `src/lib/api/recommendations.ts`

- [ ] **Step 1: Create `src/lib/api/recommendations.ts`**

```typescript
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
    _reason: rp.reason,
    _reasonLabel: rp.reasonLabel,
  } as Product & { _reason: string; _reasonLabel: string };
}

export async function fetchRecommendations(params: RecommendationParams): Promise<Product[]> {
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
    const product = PRODUCTS.find((p) => p.id === params.product_id || p.slug === params.product_id);
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api/recommendations.ts
git commit -m "feat: add recommendations API client with fallback to mock data"
```

---

### Task 6: Frontend — ProductRecommendationStrip Component

**Files:**
- Create: `src/components/product/ProductRecommendationStrip.tsx`
- Modify: `src/components/product/ProductCard.tsx` (add urgency badge support)

- [ ] **Step 1: Create `src/components/product/UrgencyBadge.tsx`**

```tsx
"use client";

import { cn } from "@/lib/utils";
import type { Product } from "@/store/useCartStore";

interface UrgencyBadgeProps {
  product: Product & { _fastMoving?: boolean };
  className?: string;
}

export function UrgencyBadge({ product, className }: UrgencyBadgeProps) {
  const isLowStock = product.inStock && product.stockCount > 0 && product.stockCount <= 5;
  const isFastMoving = product._fastMoving === true;

  if (!isLowStock && !isFastMoving) return null;

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] shadow-sm",
        isFastMoving
          ? "bg-teal-100 text-teal-800"
          : "bg-amber-100 text-amber-800",
        className
      )}
    >
      {isFastMoving ? "Fast moving" : `Only ${product.stockCount} left`}
    </span>
  );
}
```

- [ ] **Step 2: Create `src/components/product/ProductRecommendationStrip.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { fetchRecommendations, getSessionId } from "@/lib/api/recommendations";
import type { Product } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";

interface ProductRecommendationStripProps {
  title: string;
  subtitle?: string;
  context: "home" | "product" | "cart" | "shop";
  productId?: string;
  limit?: number;
  showReasonLabels?: boolean;
}

export function ProductRecommendationStrip({
  title,
  subtitle,
  context,
  productId,
  limit = 8,
  showReasonLabels = false,
}: ProductRecommendationStripProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const sessionId = getSessionId();
        const result = await fetchRecommendations({
          context,
          product_id: productId,
          session_id: sessionId,
          user_id: userId,
          limit,
        });
        if (!cancelled) setProducts(result);
      } catch {
        // Fallback is handled inside fetchRecommendations
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [context, productId, limit, userId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            {subtitle && <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">{subtitle}</p>}
            <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">{title}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white">
                  <div className="aspect-[4/5] animate-pulse rounded-t-[1.35rem] bg-brand-bgLight" />
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="h-3 w-20 animate-pulse rounded bg-brand-bgLight" />
                    <div className="h-6 w-4/5 animate-pulse rounded bg-brand-bgLight" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-brand-bgLight" />
                    <div className="mt-auto h-11 w-full animate-pulse rounded-full bg-brand-bgLight" />
                  </div>
                </div>
              ))
            : products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Modify `src/components/product/ProductCard.tsx` to add UrgencyBadge**

In `ProductCard.tsx`, add the import at the top:

```typescript
import { UrgencyBadge } from "@/components/product/UrgencyBadge";
```

Then, in the JSX, right after the existing low-stock span (line 91), add the fast-moving badge. Find the line:

```tsx
{product.stockCount > 0 && product.stockCount <= 5 ? <span className="ml-auto text-xs font-bold text-amber-700">Only {product.stockCount} left</span> : null}
```

Replace it with:

```tsx
{(product as Product & { _fastMoving?: boolean })._fastMoving ? <span className="ml-auto rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-800">Fast moving</span> : product.stockCount > 0 && product.stockCount <= 5 ? <span className="ml-auto text-xs font-bold text-amber-700">Only {product.stockCount} left</span> : null}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/product/UrgencyBadge.tsx src/components/product/ProductRecommendationStrip.tsx src/components/product/ProductCard.tsx
git commit -m "feat: add ProductRecommendationStrip and UrgencyBadge components"
```

---

### Task 7: Frontend — Integrate Recommendation Strips into Pages

**Files:**
- Modify: `src/app/page.tsx` (Home)
- Modify: `src/app/product/[slug]/ProductDetailClient.tsx` (Product)
- Modify: `src/app/cart/page.tsx` → `src/components/cart/CartPageClient.tsx` (Cart)
- Modify: `src/app/shop/ShopPageContent.tsx` (Shop)

- [ ] **Step 1: Modify `src/app/page.tsx`**

Add imports at the top:

```typescript
import { ProductRecommendationStrip } from "@/components/product/ProductRecommendationStrip";
import { RecentlyViewedStrip } from "@/components/product/RecentlyViewedStrip";
```

Insert `<RecentlyViewedStrip />` after `<QuickCategoryPills />` and insert `<ProductRecommendationStrip title="Recommended for You" subtitle="Personalized picks" context="home" />` after `<FeaturedProducts />` and `<ProductRecommendationStrip title="Trending Now" subtitle="Popular this week" context="home" />` after `<TheGlowEdit />`.

The final JSX should be:

```tsx
<>
  <HeroBanner />
  <TrustBadgeMarquee />
  <QuickCategoryPills />
  <RecentlyViewedStrip />
  <FeaturedProducts />
  <ProductRecommendationStrip title="Recommended for You" subtitle="Personalized picks" context="home" />
  <ShopByCategory />
  <NewYearOfferBanner />
  <PromoBannerGrid />
  <TheGlowEdit />
  <ProductRecommendationStrip title="Trending Now" subtitle="Popular this week" context="home" />
  <BrandsMarquee />
  <RoutineBuilderPreview />
  <BrandPhilosophyBanner />
  <BeautyProfileQuiz />
  <BlogPreview />
  <InstagramGallery />
  <NewsletterSignup />
</>
```

- [ ] **Step 2: Modify `src/app/product/[slug]/ProductDetailClient.tsx`**

Add import at the top:

```typescript
import { ProductRecommendationStrip } from "@/components/product/ProductRecommendationStrip";
import { getSessionId } from "@/lib/api/recommendations";
```

Since the product detail page is a server component that passes `related` as a prop, and we want to add API-driven recommendations alongside, we'll add a client-side recommendation strip below the existing "Related products" section. Find the section with the heading "Related products" and add after the related products grid:

```tsx
<ProductRecommendationStrip title="Customers also viewed" subtitle="You might like" context="product" productId={product.id} showReasonLabels />
```

- [ ] **Step 3: Modify the cart page**

Read `src/components/cart/CartPageClient.tsx` to find where to insert the recommendation strip. Add the import:

```typescript
import { ProductRecommendationStrip } from "@/components/product/ProductRecommendationStrip";
```

And add before the checkout section:

```tsx
<ProductRecommendationStrip title="You might also like" subtitle="Complete your order" context="cart" />
```

- [ ] **Step 4: Modify `src/app/shop/ShopPageContent.tsx`**

Read the file first, then add the import and insert the recommendation strip at the top of the shop content:

```typescript
import { ProductRecommendationStrip } from "@/components/product/ProductRecommendationStrip";
```

Add `<ProductRecommendationStrip title="Recommended for You" subtitle="Personalized picks" context="shop" />` at the top of the main content area.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/product/[slug]/ProductDetailClient.tsx src/app/cart/ src/app/shop/ src/components/cart/
git commit -m "feat: integrate recommendation strips into home, product, cart, and shop pages"
```

---

### Task 8: Frontend — Wire Up Event Tracking Calls

**Files:**
- Modify: `src/app/product/[slug]/ProductDetailClient.tsx` (product_view tracking)
- Modify: `src/app/shop/ShopPageContent.tsx` (category_view tracking)
- Modify: `src/components/cart/CartPageClient.tsx` (checkout_start tracking)

- [ ] **Step 1: Ensure product_view is tracked in ProductDetailClient**

The existing `useEffect` in `ProductDetailClient.tsx` already calls `trackEvent("product_viewed", ...)`. Since we integrated the tracking emitter into `analytics.ts` in Task 4, this will automatically also send the event to our backend. No additional changes needed for product_view.

- [ ] **Step 2: Add category_view tracking in ShopPageContent**

In `ShopPageContent.tsx`, add an import for `trackCategoryView`:

```typescript
import { trackCategoryView } from "@/lib/tracking";
```

And add a `useEffect` that fires when a category filter is applied:

```typescript
useEffect(() => {
  if (activeCategory) {
    trackCategoryView({ category_slug: activeCategory });
  }
}, [activeCategory]);
```

(This assumes `ShopPageContent` has an `activeCategory` state. Read the file to confirm the variable name.)

- [ ] **Step 3: Add checkout_start tracking in CartPageClient**

In the cart page client, add an import:

```typescript
import { trackCheckoutStart } from "@/lib/tracking";
```

And call it when the user clicks the checkout button (before navigation):

```typescript
trackCheckoutStart({ cart_value_npr: getSubtotal?.() || 0, item_count: getTotalItems?.() || 0 });
```

- [ ] **Step 4: Commit**

```bash
git add src/app/product/[slug]/ProductDetailClient.tsx src/app/shop/ShopPageContent.tsx src/components/cart/CartPageClient.tsx
git commit -m "feat: wire up category_view and checkout_start event tracking calls"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No lint errors (or only pre-existing ones).

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Verify backend typecheck**

```bash
cd backend && npm run typecheck
```

Expected: No type errors.

- [ ] **Step 5: Commit any fixes**

If any of the above checks reveal issues, fix them and commit:

```bash
git add -A && git commit -m "fix: resolve typecheck and lint issues from recommendations implementation"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Every section of the design spec has a corresponding task
  - Section 1 (Event Tracking) → Task 4 + Task 8
  - Section 2 (Database Schema) → Task 1
  - Section 3 (Backend API) → Task 2 + Task 3
  - Section 4 (Recommendation Logic) → Task 1 (RPCs) + Task 3 (service)
  - Section 5 (Frontend Components) → Task 5 + Task 6 + Task 7
- [x] **Placeholder scan:** No TBDs, TODOs, or "implement later" patterns
- [x] **Type consistency:** All type names (`RecommendedProduct`, `TrendingProduct`, `TrackingEvent`, etc.) are consistent across tasks
- [x] **Fallback strategy:** `fetchRecommendations` falls back to mock data when API unavailable
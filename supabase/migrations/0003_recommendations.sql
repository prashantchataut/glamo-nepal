-- GLAMO Nepal - Recommendations System (Migration 0003)
-- Events, Product Metrics, User Product Affinity + RPCs

-- ============================================
-- EVENTS
-- ============================================

CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'product_view', 'add_to_cart', 'wishlist_toggle',
    'purchase_success', 'page_view', 'search', 'share'
  )),
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_user_id ON events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_entity_type ON events(entity_id, event_type);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON events
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- PRODUCT METRICS DAILY
-- ============================================

CREATE TABLE product_metrics_daily (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  adds_to_cart INTEGER NOT NULL DEFAULT 0,
  purchases INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, date)
);

CREATE INDEX idx_product_metrics_daily_date ON product_metrics_daily(date DESC);
CREATE INDEX idx_product_metrics_daily_product_id ON product_metrics_daily(product_id);

ALTER TABLE product_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON product_metrics_daily
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read" ON product_metrics_daily
  FOR SELECT USING (true);

-- ============================================
-- USER PRODUCT AFFINITY
-- ============================================

CREATE TABLE user_product_affinity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  score REAL NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_product_affinity_identity
  ON user_product_affinity (COALESCE(user_id, session_id), product_id);
CREATE INDEX idx_user_product_affinity_user_id ON user_product_affinity(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_user_product_affinity_session_id ON user_product_affinity(session_id);
CREATE INDEX idx_user_product_affinity_score ON user_product_affinity(score DESC);

ALTER TABLE user_product_affinity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON user_product_affinity
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- RPC: track_events
-- ============================================

CREATE OR REPLACE FUNCTION track_events(p_events JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event JSONB;
  v_user_id UUID;
  v_session_id UUID;
  v_event_type TEXT;
  v_entity_id TEXT;
  v_score REAL;
  v_product_id UUID;
BEGIN
  FOR event IN SELECT * FROM jsonb_array_elements(p_events)
  LOOP
    v_user_id := (event->>'user_id')::UUID;
    v_session_id := (event->>'session_id')::UUID;
    v_event_type := event->>'event_type';
    v_entity_id := event->>'entity_id';

    INSERT INTO events (user_id, session_id, event_type, entity_id, metadata)
    VALUES (
      v_user_id,
      v_session_id,
      v_event_type,
      v_entity_id,
      COALESCE(event->'metadata', '{}'::JSONB)
    );

    IF v_event_type IN ('product_view', 'add_to_cart', 'wishlist_toggle', 'purchase_success')
       AND v_entity_id IS NOT NULL
    THEN
      v_product_id := v_entity_id::UUID;
      v_score := 0;

      CASE v_event_type
        WHEN 'product_view' THEN v_score := 1.0;
        WHEN 'add_to_cart' THEN v_score := 3.0;
        WHEN 'wishlist_toggle' THEN
          IF event->'metadata'->>'action' = 'add' THEN
            v_score := 2.0;
          END IF;
        WHEN 'purchase_success' THEN v_score := 5.0;
      END CASE;

      IF v_score > 0 THEN
        INSERT INTO user_product_affinity (user_id, session_id, product_id, score, last_viewed_at, updated_at)
        VALUES (v_user_id, v_session_id, v_product_id, v_score, now(), now())
        ON CONFLICT ((COALESCE(user_id, session_id)), product_id)
        DO UPDATE SET
          score = user_product_affinity.score + EXCLUDED.score,
          last_viewed_at = GREATEST(user_product_affinity.last_viewed_at, EXCLUDED.last_viewed_at),
          updated_at = now();
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
  short_description TEXT,
  base_price INTEGER,
  sale_price INTEGER,
  currency TEXT,
  category_id UUID,
  brand_id UUID,
  is_featured BOOLEAN,
  image_url TEXT,
  reason TEXT,
  reason_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_half INTEGER := p_limit / 2;
  v_extra INTEGER := p_limit - (p_limit / 2) * 2;
BEGIN
  IF p_context = 'home' THEN
    RETURN QUERY
    WITH affinity_recs AS (
      SELECT p.id, p.name, p.slug, p.short_description,
             p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
             p.is_featured, img.url AS image_url,
             'affinity'::TEXT AS reason,
             'Based on your interests'::TEXT AS reason_label
      FROM products p
      INNER JOIN user_product_affinity a ON a.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
      ) img ON true
      WHERE (a.user_id = p_user_id OR a.session_id = p_session_id)
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.deleted_at IS NULL
      ORDER BY a.score DESC
      LIMIT v_half + v_extra
    ),
    trending_recs AS (
      SELECT p.id, p.name, p.slug, p.short_description,
             p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
             p.is_featured, img.url AS image_url,
             'trending'::TEXT AS reason,
             'Trending now'::TEXT AS reason_label
      FROM products p
      INNER JOIN product_metrics_daily m ON m.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
      ) img ON true
      WHERE p.is_active = true
        AND p.stock_quantity > 0
        AND p.deleted_at IS NULL
        AND m.date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY p.id, p.name, p.slug, p.short_description,
               p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
               p.is_featured, img.url
      ORDER BY (SUM(m.views) * 1 + SUM(m.adds_to_cart) * 3 + SUM(m.purchases) * 5) DESC
      LIMIT v_half
    ),
    all_recs AS (
      SELECT * FROM affinity_recs
      UNION ALL
      SELECT * FROM trending_recs
    ),
    fallback AS (
      SELECT p.id, p.name, p.slug, p.short_description,
             p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
             p.is_featured, img.url AS image_url,
             'featured'::TEXT AS reason,
             'Featured'::TEXT AS reason_label
      FROM products p
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
      ) img ON true
      WHERE p.is_featured = true
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM all_recs)
      LIMIT p_limit
    )
    SELECT * FROM all_recs
    UNION ALL
    SELECT * FROM fallback
    LIMIT p_limit;

  ELSIF p_context = 'product' THEN
    RETURN QUERY
    WITH similar_recs AS (
      SELECT p.id, p.name, p.slug, p.short_description,
             p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
             p.is_featured, img.url AS image_url,
             'similar'::TEXT AS reason,
             'Similar products'::TEXT AS reason_label
      FROM products p
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
      ) img ON true
      WHERE p.category_id = (SELECT category_id FROM products WHERE id = p_product_id)
        AND p.id != p_product_id
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.deleted_at IS NULL
      LIMIT v_half + v_extra
    ),
    also_viewed AS (
      SELECT p.id, p.name, p.slug, p.short_description,
             p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
             p.is_featured, img.url AS image_url,
             'also_viewed'::TEXT AS reason,
             'Customers also viewed'::TEXT AS reason_label
      FROM products p
      INNER JOIN user_product_affinity a ON a.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
      ) img ON true
      WHERE a.session_id IN (
        SELECT DISTINCT a2.session_id
        FROM user_product_affinity a2
        WHERE a2.product_id = p_product_id
      )
        AND p.id != p_product_id
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.deleted_at IS NULL
      GROUP BY p.id, p.name, p.slug, p.short_description,
               p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
               p.is_featured, img.url
      ORDER BY SUM(a.score) DESC
      LIMIT v_half
    ),
    all_recs AS (
      SELECT * FROM similar_recs
      UNION ALL
      SELECT * FROM also_viewed
    ),
    fallback AS (
      SELECT p.id, p.name, p.slug, p.short_description,
             p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
             p.is_featured, img.url AS image_url,
             'featured'::TEXT AS reason,
             'Featured'::TEXT AS reason_label
      FROM products p
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
      ) img ON true
      WHERE p.is_featured = true
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM all_recs)
      LIMIT p_limit
    )
    SELECT * FROM all_recs
    UNION ALL
    SELECT * FROM fallback
    LIMIT p_limit;

  ELSIF p_context = 'cart' THEN
    RETURN QUERY
    WITH affinity_recs AS (
      SELECT p.id, p.name, p.slug, p.short_description,
             p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
             p.is_featured, img.url AS image_url,
             'affinity'::TEXT AS reason,
             'Based on your interests'::TEXT AS reason_label
      FROM products p
      INNER JOIN user_product_affinity a ON a.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
      ) img ON true
      WHERE (a.user_id = p_user_id OR a.session_id = p_session_id)
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.deleted_at IS NULL
      ORDER BY a.score DESC
      LIMIT p_limit
    ),
    fallback AS (
      SELECT p.id, p.name, p.slug, p.short_description,
             p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
             p.is_featured, img.url AS image_url,
             'featured'::TEXT AS reason,
             'Featured'::TEXT AS reason_label
      FROM products p
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
      ) img ON true
      WHERE p.is_featured = true
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM affinity_recs)
      LIMIT p_limit
    )
    SELECT * FROM affinity_recs
    UNION ALL
    SELECT * FROM fallback
    LIMIT p_limit;

  ELSIF p_context = 'shop' THEN
    RETURN QUERY
    WITH affinity_recs AS (
      SELECT p.id, p.name, p.slug, p.short_description,
             p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
             p.is_featured, img.url AS image_url,
             'affinity'::TEXT AS reason,
             'Based on your interests'::TEXT AS reason_label
      FROM products p
      INNER JOIN user_product_affinity a ON a.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
      ) img ON true
      WHERE (a.user_id = p_user_id OR a.session_id = p_session_id)
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.deleted_at IS NULL
      ORDER BY a.score DESC
      LIMIT v_half + v_extra
    ),
    trending_recs AS (
      SELECT p.id, p.name, p.slug, p.short_description,
             p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
             p.is_featured, img.url AS image_url,
             'trending'::TEXT AS reason,
             'Trending now'::TEXT AS reason_label
      FROM products p
      INNER JOIN product_metrics_daily m ON m.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
      ) img ON true
      WHERE p.is_active = true
        AND p.stock_quantity > 0
        AND p.deleted_at IS NULL
        AND m.date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY p.id, p.name, p.slug, p.short_description,
               p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
               p.is_featured, img.url
      ORDER BY (SUM(m.views) * 1 + SUM(m.adds_to_cart) * 3 + SUM(m.purchases) * 5) DESC
      LIMIT v_half
    ),
    all_recs AS (
      SELECT * FROM affinity_recs
      UNION ALL
      SELECT * FROM trending_recs
    ),
    fallback AS (
      SELECT p.id, p.name, p.slug, p.short_description,
             p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
             p.is_featured, img.url AS image_url,
             'featured'::TEXT AS reason,
             'Featured'::TEXT AS reason_label
      FROM products p
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
      ) img ON true
      WHERE p.is_featured = true
        AND p.is_active = true
        AND p.stock_quantity > 0
        AND p.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM all_recs)
      LIMIT p_limit
    )
    SELECT * FROM all_recs
    UNION ALL
    SELECT * FROM fallback
    LIMIT p_limit;
  END IF;
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
  short_description TEXT,
  base_price INTEGER,
  sale_price INTEGER,
  currency TEXT,
  category_id UUID,
  brand_id UUID,
  is_featured BOOLEAN,
  image_url TEXT,
  trending_score BIGINT,
  trend_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.slug, p.short_description,
         p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
         p.is_featured, img.url AS image_url,
         (SUM(m.views) * 1 + SUM(m.adds_to_cart) * 3 + SUM(m.purchases) * 5) AS trending_score,
         CASE
           WHEN (SUM(m.views) * 1 + SUM(m.adds_to_cart) * 3 + SUM(m.purchases) * 5) > 50
           THEN 'Fast moving'::TEXT
           ELSE 'Trending now'::TEXT
         END AS trend_label
  FROM products p
  INNER JOIN product_metrics_daily m ON m.product_id = p.id
  LEFT JOIN LATERAL (
    SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1
  ) img ON true
  WHERE p.is_active = true
    AND p.stock_quantity > 0
    AND p.deleted_at IS NULL
    AND CASE
      WHEN p_window = '24h' THEN m.date = CURRENT_DATE
      WHEN p_window = '7d' THEN m.date >= CURRENT_DATE - INTERVAL '7 days'
      ELSE true
    END
    AND (p_category IS NULL OR p.category_id = (
      SELECT c.id FROM categories c WHERE c.slug = p_category
    ))
  GROUP BY p.id, p.name, p.slug, p.short_description,
           p.base_price, p.sale_price, p.currency, p.category_id, p.brand_id,
           p.is_featured, img.url
  ORDER BY trending_score DESC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- RPC: refresh_product_metrics
-- ============================================

CREATE OR REPLACE FUNCTION refresh_product_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO product_metrics_daily (product_id, date, views, adds_to_cart, purchases)
  SELECT
    e.entity_id::UUID AS product_id,
    CURRENT_DATE AS date,
    SUM(CASE WHEN e.event_type = 'product_view' THEN 1 ELSE 0 END) AS views,
    SUM(CASE WHEN e.event_type = 'add_to_cart' THEN 1 ELSE 0 END) AS adds_to_cart,
    SUM(CASE WHEN e.event_type = 'purchase_success' THEN 1 ELSE 0 END) AS purchases
  FROM events e
  WHERE e.created_at >= CURRENT_DATE
    AND e.created_at < CURRENT_DATE + INTERVAL '1 day'
    AND e.event_type IN ('product_view', 'add_to_cart', 'purchase_success')
    AND e.entity_id IS NOT NULL
  GROUP BY e.entity_id::UUID, CURRENT_DATE
  ON CONFLICT (product_id, date)
  DO UPDATE SET
    views = product_metrics_daily.views + EXCLUDED.views,
    adds_to_cart = product_metrics_daily.adds_to_cart + EXCLUDED.adds_to_cart,
    purchases = product_metrics_daily.purchases + EXCLUDED.purchases;
END;
$$;

-- ============================================
-- RPC: cleanup_old_events
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_events()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM events WHERE created_at < now() - INTERVAL '90 days';
  DELETE FROM user_product_affinity WHERE score = 0 AND updated_at < now() - INTERVAL '90 days';
END;
$$;
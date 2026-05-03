-- GLAMO Nepal - Foundation Migration
-- Run after 0001_initial_schema.sql, 0002_seed_data.sql, 0003_recommendations.sql

-- ============================================
-- NEW TABLES
-- ============================================

-- Payment transactions with idempotency
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL CHECK (provider IN ('KHALTI', 'ESEWA', 'COD')),
  provider_transaction_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NPR',
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'VERIFIED', 'FAILED', 'REFUNDED')),
  provider_payload JSONB,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_idempotency_key ON payment_transactions(idempotency_key);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on payment_transactions" ON payment_transactions
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "User can view own payment transactions" ON payment_transactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.user_id = auth.uid()));

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Product reviews media
CREATE TABLE product_reviews_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  public_id TEXT,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_reviews_media_review_id ON product_reviews_media(review_id);

ALTER TABLE product_reviews_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reviews media" ON product_reviews_media
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert own reviews media" ON product_reviews_media
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = product_reviews_media.review_id AND reviews.user_id = auth.uid()));
CREATE POLICY "Service role full access on reviews media" ON product_reviews_media
  FOR ALL USING (true) WITH CHECK (true);

-- Product tags (normalized from JSONB)
CREATE TABLE product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, tag)
);

CREATE INDEX idx_product_tags_tag ON product_tags(tag);
CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);

ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product tags" ON product_tags
  FOR SELECT USING (true);
CREATE POLICY "Service role full access on product tags" ON product_tags
  FOR ALL USING (true) WITH CHECK (true);

-- Low stock alert subscriptions
CREATE TABLE low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  notified_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_low_stock_alerts_product_id ON low_stock_alerts(product_id) WHERE is_active = true;

ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage own alerts" ON low_stock_alerts
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Service role full access on low stock alerts" ON low_stock_alerts
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- NEW COLUMNS
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_phone TEXT;

-- ============================================
-- NEW INDEXES
-- ============================================

-- Full-text search on products
CREATE INDEX idx_products_search_vector ON products USING gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(short_description,'') || ' ' || coalesce(description,'')));

-- Orders: admin dashboard queries
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_orders_payment_status_filter ON orders(payment_status) WHERE payment_status != 'PAID';
CREATE INDEX idx_orders_coupon_id ON orders(coupon_id) WHERE coupon_id IS NOT NULL;

-- Products: filtered listings
CREATE INDEX idx_products_category_active ON products(category_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_brand_active ON products(brand_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_featured_active ON products(is_featured, is_active) WHERE deleted_at IS NULL;

-- Events: time-series queries
CREATE INDEX idx_events_created_type ON events(created_at DESC, event_type);

-- Affinity: recommendation queries
CREATE INDEX idx_affinity_user_score ON user_product_affinity(user_id, score DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_affinity_session_score ON user_product_affinity(session_id, score DESC);

-- Audit logs: admin queries
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Categories: public read, admin write
CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Brands: public read, admin write
CREATE POLICY "Public read brands" ON brands
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Products: public read active, admin full access
CREATE POLICY "Public read active products" ON products
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Product variants: public read active
CREATE POLICY "Public read active variants" ON product_variants
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Product images: public read
CREATE POLICY "Public read product images" ON product_images
  FOR SELECT USING (true);

-- Inventory logs: admin only
CREATE POLICY "Admin only inventory logs" ON inventory_logs
  FOR SELECT USING (false);
CREATE POLICY "Service role full access on inventory_logs" ON inventory_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Coupons: public read active, admin full access
CREATE POLICY "Public read active coupons" ON coupons
  FOR SELECT USING (is_active = true AND starts_at <= now() AND expires_at >= now());

-- Orders: user can view own, admin full access
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on orders" ON orders
  FOR ALL USING (true) WITH CHECK (true);

-- Order items: user can view own order's items
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Service role full access on order items" ON order_items
  FOR ALL USING (true) WITH CHECK (true);

-- Order status histories: user can view own
CREATE POLICY "Users can view own order status" ON order_status_histories
  FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_histories.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Service role full access on order status" ON order_status_histories
  FOR ALL USING (true) WITH CHECK (true);

-- Reviews: public read approved, users can insert own
CREATE POLICY "Public read approved reviews" ON reviews
  FOR SELECT USING (is_approved = true OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = reviews.user_id AND profiles.id = auth.uid()));
CREATE POLICY "Authenticated users can insert reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on reviews" ON reviews
  FOR ALL USING (true) WITH CHECK (true);

-- Wishlist items: user owns
CREATE POLICY "Users can view own wishlist" ON wishlist_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wishlist" ON wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wishlist" ON wishlist_items
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on wishlist" ON wishlist_items
  FOR ALL USING (true) WITH CHECK (true);

-- Cart items: user owns
CREATE POLICY "Users can view own cart" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON cart_items
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart" ON cart_items
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on cart" ON cart_items
  FOR ALL USING (true) WITH CHECK (true);

-- User addresses: user owns
CREATE POLICY "Users can insert own addresses" ON user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON user_addresses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON user_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Profiles: users can update own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Notifications: user owns
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

-- Newsletter subscribers: public can subscribe, admin can manage
CREATE POLICY "Public can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access on newsletter" ON newsletter_subscribers
  FOR ALL USING (true) WITH CHECK (true);

-- Site settings: public read, admin write
CREATE POLICY "Public read site settings" ON site_settings
  FOR SELECT USING (true);

-- Blog posts: public read published
CREATE POLICY "Public read published blogs" ON blogs
  FOR SELECT USING (is_published = true AND deleted_at IS NULL);

-- Gallery items: public read active
CREATE POLICY "Public read active gallery" ON gallery_items
  FOR SELECT USING (is_active = true);

-- Team members: public read active
CREATE POLICY "Public read active team" ON team_members
  FOR SELECT USING (is_active = true);

-- Banners: public read active
CREATE POLICY "Public read active banners" ON banners
  FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at >= now()));

-- Popups: public read active
CREATE POLICY "Public read active popups" ON popups
  FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at >= now()));
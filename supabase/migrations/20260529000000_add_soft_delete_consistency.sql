-- GLAMO Nepal - Soft-delete consistency
-- Add deleted_at to tables that should support soft-delete but don't

-- Coupons: soft-delete instead of hard-delete for audit trail
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Order items: soft-delete for order modification audit trail
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Cart items: soft-delete for analytics
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Wishlist items: soft-delete for analytics
ALTER TABLE wishlist_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Indexes for soft-delete queries
CREATE INDEX IF NOT EXISTS idx_coupons_deleted_at ON coupons(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_deleted_at ON order_items(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_deleted_at ON cart_items(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wishlist_items_deleted_at ON wishlist_items(deleted_at) WHERE deleted_at IS NOT NULL;
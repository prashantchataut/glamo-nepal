-- Add missing soft-delete and verification columns

-- orders: soft-delete support
ALTER TABLE orders ADD COLUMN deleted_at TEXT;

-- product_variants: soft-delete support
ALTER TABLE product_variants ADD COLUMN deleted_at TEXT;

-- users: phone verification flag
ALTER TABLE users ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0;

-- reviews: soft-delete support
ALTER TABLE reviews ADD COLUMN deleted_at TEXT;
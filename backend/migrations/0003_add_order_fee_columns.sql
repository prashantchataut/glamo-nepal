-- Add cod_fee and gift_wrap_fee columns to orders table
ALTER TABLE orders ADD COLUMN cod_fee INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN gift_wrap_fee INTEGER NOT NULL DEFAULT 0;

-- Add ward and landmark columns to user_addresses table
ALTER TABLE user_addresses ADD COLUMN ward TEXT;
ALTER TABLE user_addresses ADD COLUMN landmark TEXT;
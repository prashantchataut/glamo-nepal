-- GLAMO Nepal - Seed Data
-- Run this after 0001_initial_schema.sql

-- ============================================
-- DEFAULT SITE SETTINGS
-- ============================================

INSERT INTO site_settings (key, value, group_name) VALUES
  ('announcement_texts', '["🌿 Vegan | 100% Cruelty-Free | Dermat Tested", "Free shipping on orders above NPR 2,500 | Call: +977 9818212188", "Authentic beauty products | Naya Baneshwor, Kathmandu"]'::jsonb, 'general'),
  ('free_shipping_threshold', '2500'::jsonb, 'general'),
  ('cod_fee', '50'::jsonb, 'general'),
  ('delivery_fees', '{"Kathmandu": 0, "Lalitpur": 0, "Bhaktapur": 50, "Chitwan": 100, "default": 150}'::jsonb, 'general'),
  ('contact_info', '{"phone": "+977 9818212188", "whatsapp": "9779818212188", "email": "info@glamonepal.com", "address": "Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal", "instagram": "https://www.instagram.com/glamo_nepal/", "instagram_handle": "@glamo_nepal", "hours": "Sun-Fri: 10AM-7PM, Sat: 10AM-5PM"}'::jsonb, 'general'),
  ('maintenance_mode', 'false'::jsonb, 'general'),
  ('max_cart_item_quantity', '10'::jsonb, 'general'),
  ('review_auto_approve', 'false'::jsonb, 'general'),
  ('low_stock_threshold_default', '5'::jsonb, 'general');

-- ============================================
-- DEFAULT CATEGORIES
-- ============================================

INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES
  ('cat_skincare', 'Skincare', 'skincare', 'Premium skincare products for healthy, glowing skin', 1, true),
  ('cat_haircare', 'Haircare', 'haircare', 'Hair care essentials for all hair types', 2, true),
  ('cat_makeup', 'Makeup', 'makeup', 'Makeup products for every occasion', 3, true),
  ('cat_bodycare', 'Body Care', 'body-care', 'Body care products for soft, nourished skin', 4, true),
  ('cat_fragrance', 'Fragrance', 'fragrance', 'Luxury fragrances and perfumes', 5, true);

-- ============================================
-- DEFAULT BRANDS
-- ============================================

INSERT INTO brands (id, name, slug, description, is_active) VALUES
  ('brand_glamo', 'GLAMO', 'glamo', 'GLAMO Nepal - Our in-house curated beauty collection', true),
  ('brand_ordinary', 'The Ordinary', 'the-ordinary', 'Clinical formulations with integrity', true),
  ('brand_inkey', 'The Inkey List', 'the-inkey-list', 'Skincare made easy with knowledge', true),
  ('brand_cerave', 'CeraVe', 'cerave', 'Skincare developed with dermatologists', true);

-- ============================================
-- ADMIN USER (password: ChangeMe@123)
-- ============================================
-- Note: This creates the admin user in auth.users.
-- You must create this user through Supabase Auth signup first,
-- then update their profile role to SUPER_ADMIN.

-- After signing up the admin user via Supabase Auth, run:
-- UPDATE profiles SET role = 'SUPER_ADMIN' WHERE email = 'admin@glamonepal.com';
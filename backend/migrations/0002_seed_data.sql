PRAGMA foreign_keys = ON;

-- Super Admin User
INSERT INTO users (id, email, phone, password_hash, first_name, last_name, role, is_active, email_verified, phone_verified, google_id, created_at, updated_at) VALUES
('u_admin_00000000', 'admin@example.com', '+977-9800000000', '$2a$12$LJ3m4ys3Lk0TSwMcMgPMOejM5V4sJIp9Gg0FDqQr5t1e2sGQ5XK6e', 'GLAMO', 'Admin', 'SUPER_ADMIN', 1, 1, 0, NULL, datetime('now'), datetime('now'));

-- Categories (8 top-level + subcategories)
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active, created_at, updated_at) VALUES
('cat_skincare', 'Skincare', 'skincare', 'Nourish and protect your skin with premium skincare products', NULL, 1, 1, datetime('now'), datetime('now')),
('cat_makeup', 'Makeup', 'makeup', 'Express yourself with our curated makeup collection', NULL, 2, 1, datetime('now'), datetime('now')),
('cat_haircare', 'Hair Care', 'hair-care', 'Transform your hair with our expert hair care range', NULL, 3, 1, datetime('now'), datetime('now')),
('cat_bodycare', 'Body Care', 'body-care', 'Pamper your body with luxurious body care essentials', NULL, 4, 1, datetime('now'), datetime('now')),
('cat_fragrance', 'Fragrance', 'fragrance', 'Discover captivating fragrances for every occasion', NULL, 5, 1, datetime('now'), datetime('now')),
('cat_tools', 'Tools & Brushes', 'tools-brushes', 'Professional-grade tools for flawless application', NULL, 6, 1, datetime('now'), datetime('now')),
('cat_suncare', 'Sun Care', 'sun-care', 'Protect your skin from harmful UV rays', NULL, 7, 1, datetime('now'), datetime('now')),
('cat_mens', 'Men''s Grooming', 'mens-grooming', 'Grooming essentials designed for men', NULL, 8, 1, datetime('now'), datetime('now')),

-- Skincare subcategories
('cat_cleansers', 'Cleansers', 'cleansers', 'Gentle and effective cleansers for every skin type', 'cat_skincare', 1, 1, datetime('now'), datetime('now')),
('cat_moisturizers', 'Moisturizers', 'moisturizers', 'Hydrating moisturizers to keep skin supple', 'cat_skincare', 2, 1, datetime('now'), datetime('now')),
('cat_serums', 'Serums', 'serums', 'Targeted serums for specific skin concerns', 'cat_skincare', 3, 1, datetime('now'), datetime('now')),

-- Makeup subcategories
('cat_lips', 'Lips', 'lips', 'Lipsticks, glosses, and lip care essentials', 'cat_makeup', 1, 1, datetime('now'), datetime('now')),
('cat_eyes', 'Eyes', 'eyes', 'Eye makeup for stunning looks', 'cat_makeup', 2, 1, datetime('now'), datetime('now')),
('cat_face', 'Face', 'face', 'Foundation, concealer, and face makeup', 'cat_makeup', 3, 1, datetime('now'), datetime('now')),

-- Hair Care subcategories
('cat_shampoo', 'Shampoo', 'shampoo', 'Shampoos for clean and healthy hair', 'cat_haircare', 1, 1, datetime('now'), datetime('now')),
('cat_hairoil', 'Hair Oil', 'hair-oil', 'Nourishing oils for strong and shiny hair', 'cat_haircare', 2, 1, datetime('now'), datetime('now')),
('cat_hairtreatments', 'Hair Treatments', 'hair-treatments', 'Deep conditioning and repair treatments', 'cat_haircare', 3, 1, datetime('now'), datetime('now')),

-- Body Care subcategories
('cat_lotions', 'Lotions', 'lotions', 'Body lotions for soft, smooth skin', 'cat_bodycare', 1, 1, datetime('now'), datetime('now')),
('cat_scrubs', 'Scrubs', 'scrubs', 'Exfoliating body scrubs for radiant skin', 'cat_bodycare', 2, 1, datetime('now'), datetime('now')),

-- Fragrance subcategories
('cat_perfumes', 'Perfumes', 'perfumes', 'Long-lasting perfumes and eau de parfum', 'cat_fragrance', 1, 1, datetime('now'), datetime('now')),
('cat_bodymists', 'Body Mists', 'body-mists', 'Light and refreshing body mists', 'cat_fragrance', 2, 1, datetime('now'), datetime('now'));

-- Brands (6)
INSERT INTO brands (id, name, slug, description, is_active, created_at, updated_at) VALUES
('brand_maybelline', 'Maybelline', 'maybelline', 'Make it happen with Maybelline New York — globally loved makeup brand known for trendsetting products', 1, datetime('now'), datetime('now')),
('brand_loreal', 'L''Oreal', 'loreal', 'Because you''re worth it — L''Oreal Paris offers premium beauty and skincare products trusted worldwide', 1, datetime('now'), datetime('now')),
('brand_lakme', 'Lakme', 'lakme', 'India''s #1 beauty brand — Lakme combines international expertise with an understanding of the Indian woman', 1, datetime('now'), datetime('now')),
('brand_himalaya', 'Himalaya', 'himalaya', 'Nature''s answer to beauty — Himalaya offers herbal skincare and wellness products rooted in Ayurveda', 1, datetime('now'), datetime('now')),
('brand_biotique', 'Biotique', 'biotique', 'Swiss science meets Ayurveda — Biotique delivers 100% natural skincare with advanced bio-technology', 1, datetime('now'), datetime('now')),
('brand_ordinary', 'The Ordinary', 'the-ordinary', 'Clinical formulations with integrity — The Ordinary offers science-backed skincare at honest prices', 1, datetime('now'), datetime('now'));

-- Products (20) — prices in paisa (NPR)
INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, base_price, sale_price, cost_price, currency, is_active, is_featured, is_digital, track_inventory, stock_quantity, low_stock_threshold, tags, created_at, updated_at) VALUES
-- Skincare
('prod_001', 'The Ordinary Niacinamide 10% + Zinc 1%', 'the-ordinary-niacinamide-10-zinc-1', 'A high-strength vitamin and mineral blemish formula that visibly reduces the appearance of blemishes and congestion. Niacinamide (Vitamin B3) reduces the appearance of skin blemishes and congestion while Zinc works to control sebum activity.', 'Blemish-fighting serum with 10% Niacinamide', 'TO-NIA-30ML', 'cat_serums', 'brand_ordinary', 150000, 129900, 80000, 'NPR', 1, 1, 0, 1, 150, 10, '["serum","niacinamide","blemish","oil-control"]', datetime('now'), datetime('now')),
('prod_002', 'The Ordinary Hyaluronic Acid 2% + B5', 'the-ordinary-hyaluronic-acid-2-b5', 'Multi-depth hydration formula with low, medium, and high molecular weight hyaluronic acid molecules and a next-generation HA crosspolymer for multi-depth hydration.', 'Deep hydration serum with multi-weight hyaluronic acid', 'TO-HYA-30ML', 'cat_serums', 'brand_ordinary', 135000, NULL, 70000, 'NPR', 1, 0, 0, 1, 200, 10, '["serum","hyaluronic-acid","hydration","anti-aging"]', datetime('now'), datetime('now')),
('prod_003', 'Himalaya Purifying Neem Face Wash', 'himalaya-purifying-neem-face-wash', 'A soap-free herbal formulation that cleans impurities and helps clear pimples. Enriched with Neem and Turmeric to prevent the recurrence of acne.', 'Herbal face wash with neem and turmeric for clear skin', 'HIM-NFW-150ML', 'cat_cleansers', 'brand_himalaya', 35000, 29900, 15000, 'NPR', 1, 1, 0, 1, 300, 15, '["face-wash","neem","acne","herbal"]', datetime('now'), datetime('now')),
('prod_004', 'Biotique Bio Morning Nectar Flawless Skin Cream', 'biotique-morning-nectar-flawless-cream', 'A flawlessly nourishing moisturizer that acts as a lightweight foundation and smooths skin for a flawless finish. Enriched with pure nectar and wheat germ.', 'Lightweight nourishing cream for a flawless morning glow', 'BIO-MNC-50ML', 'cat_moisturizers', 'brand_biotique', 69500, NULL, 35000, 'NPR', 1, 0, 0, 1, 100, 10, '["moisturizer","morning","flawless","nectar"]', datetime('now'), datetime('now')),

-- Makeup
('prod_005', 'Maybelline Fit Me Matte Foundation', 'maybelline-fit-me-matte-foundation', 'Oil-free matte foundation that refines pores and covers imperfections for a natural, flawless look. Available in multiple shades to match every skin tone.', 'Oil-free matte foundation for a poreless, natural look', 'MAY-FIT-30ML', 'cat_face', 'brand_maybelline', 89900, 74900, 45000, 'NPR', 1, 1, 0, 1, 180, 10, '["foundation","matte","oil-free","poreless"]', datetime('now'), datetime('now')),
('prod_006', 'Lakme Absolute Matte Melt Liquid Lipcolor', 'lakme-absolute-matte-melt-lipcolor', 'Ultra-lightweight liquid lipstick with a matte finish that feels like melting velvet. Long-lasting formula that stays put for up to 16 hours.', '16-hour matte liquid lipstick with velvety finish', 'LAK-MML-6ML', 'cat_lips', 'brand_lakme', 75000, NULL, 38000, 'NPR', 1, 1, 0, 1, 120, 10, '["lipstick","matte","liquid-lipstick","long-lasting"]', datetime('now'), datetime('now')),
('prod_007', 'Maybelline Colossal Kajal', 'maybelline-colossal-kajal', 'India''s #1 kajal with 12-hour smudge-proof wear. Intense black formula that glides on smoothly and stays put all day without budging.', '12-hour smudge-proof kajal in intense black', 'MAY-CKJ-035G', 'cat_eyes', 'brand_maybelline', 25000, 19900, 10000, 'NPR', 1, 1, 0, 1, 500, 20, '["kajal","eyeliner","smudge-proof","intense-black"]', datetime('now'), datetime('now')),
('prod_008', 'Lakme Eyeconic Kajal', 'lakme-eyeconic-kajal', 'Smooth twist-up kajal with a rich, dark formula perfect for both bold and subtle eye looks. Waterproof and long-lasting for all-day wear.', 'Smooth twist-up waterproof kajal for bold eye looks', 'LAK-EKJ-035G', 'cat_eyes', 'brand_lakme', 27500, NULL, 12000, 'NPR', 1, 0, 0, 1, 350, 15, '["kajal","eyeliner","waterproof","twist-up"]', datetime('now'), datetime('now')),

-- Hair Care
('prod_009', 'Himalaya Anti-Hair Fall Hair Oil', 'himalaya-anti-hair-fall-oil', 'A herbal hair oil that reduces hair fall and strengthens hair from the roots. Enriched with Bhringaraja and Amla extracts for thicker, healthier hair.', 'Herbal hair oil to reduce hair fall and strengthen roots', 'HIM-AHF-200ML', 'cat_hairoil', 'brand_himalaya', 52000, 44900, 22000, 'NPR', 1, 0, 0, 1, 200, 10, '["hair-oil","anti-hair-fall","herbal","bhringaraja"]', datetime('now'), datetime('now')),
('prod_010', 'L''Oreal Paris Elvive Shampoo', 'loreal-paris-elvive-shampoo', 'Professional-quality shampoo that nourishes and strengthens hair from root to tip. Formulated with Pro-Keratin and Ceramide for visibly healthier hair.', 'Pro-Keratin shampoo for stronger, healthier hair', 'LOR-ELV-400ML', 'cat_shampoo', 'brand_loreal', 68000, NULL, 35000, 'NPR', 1, 0, 0, 1, 250, 10, '["shampoo","keratin","nourishing","strengthening"]', datetime('now'), datetime('now')),
('prod_011', 'Himalaya Gentle Daily Care Shampoo', 'himalaya-gentle-daily-care-shampoo', 'A gentle, herbal shampoo for daily use. Enriched with Amla, Licorice, and Henna to nourish hair and keep it soft and manageable.', 'Gentle herbal shampoo for everyday hair care', 'HIM-GDC-400ML', 'cat_shampoo', 'brand_himalaya', 42000, 35900, 18000, 'NPR', 1, 0, 0, 1, 280, 12, '["shampoo","daily","herbal","gentle"]', datetime('now'), datetime('now')),

-- Body Care
('prod_012', 'Himalaya Nourishing Body Lotion', 'himalaya-nourishing-body-lotion', 'A lightweight, non-greasy body lotion that moisturizes and nourishes skin for up to 24 hours. Enriched with Aloe Vera and Winter Cherry.', '24-hour moisturizing body lotion with aloe vera', 'HIM-NBL-400ML', 'cat_lotions', 'brand_himalaya', 38000, 32900, 16000, 'NPR', 1, 0, 0, 1, 220, 10, '["body-lotion","moisturizing","aloe-vera","non-greasy"]', datetime('now'), datetime('now')),
('prod_013', 'Biotique Bio Papaya Revitalizing Body Scrub', 'biotique-bio-papaya-body-scrub', 'A revitalizing body scrub with pure papaya extract to gently exfoliate dead skin cells and reveal smoother, brighter skin underneath.', 'Papaya body scrub for smooth, revitalized skin', 'BIO-PBS-150ML', 'cat_scrubs', 'brand_biotique', 55000, NULL, 28000, 'NPR', 1, 0, 0, 1, 80, 8, '["body-scrub","papaya","exfoliating","revitalizing"]', datetime('now'), datetime('now')),

-- Fragrance
('prod_014', 'Lakme 9to5 Perfume', 'lakme-9to5-perfume', 'A sophisticated everyday perfume from Lakme with fresh floral notes perfect for the modern working woman. Long-lasting fragrance that stays from 9 to 5.', 'Everyday perfume with fresh floral notes', 'LAK-9P5-50ML', 'cat_perfumes', 'brand_lakme', 199000, 169000, 85000, 'NPR', 1, 0, 0, 1, 50, 5, '["perfume","floral","long-lasting","everyday"]', datetime('now'), datetime('now')),
('prod_015', 'Biotique Floral Body Mist', 'biotique-floral-body-mist', 'A light, refreshing body mist with natural floral extracts. Perfect for a quick refresh anytime during the day. Gentle on skin and alcohol-free.', 'Refreshing floral body mist for all-day freshness', 'BIO-FBM-200ML', 'cat_bodymists', 'brand_biotique', 49900, NULL, 22000, 'NPR', 1, 0, 0, 1, 90, 8, '["body-mist","floral","refreshing","alcohol-free"]', datetime('now'), datetime('now')),

-- Tools & Brushes
('prod_016', 'Makeup Brush Set - 12 Piece', 'makeup-brush-set-12-piece', 'Professional-quality 12-piece makeup brush set with synthetic bristles. Includes brushes for foundation, powder, blush, eyeshadow, blending, and more.', 'Professional 12-piece brush set for flawless makeup', 'MBS-SET-12PC', 'cat_tools', 'brand_maybelline', 129000, 99900, 55000, 'NPR', 1, 1, 0, 1, 60, 5, '["brush-set","makeup-tools","synthetic","professional"]', datetime('now'), datetime('now')),

-- Sun Care
('prod_017', 'L''Oreal Paris UV Defender Sunscreen SPF 50+', 'loreal-uv-defender-sunscreen-spf50', 'Broad-spectrum SPF 50+ sunscreen that protects against UV rays while brightening skin. Lightweight, non-greasy formula suitable for daily use.', 'SPF 50+ lightweight sunscreen for daily sun protection', 'LOR-UVD-50ML', 'cat_suncare', 'brand_loreal', 115000, 99000, 55000, 'NPR', 1, 1, 0, 1, 170, 10, '["sunscreen","spf50","uv-protection","daily-use"]', datetime('now'), datetime('now')),
('prod_018', 'Biotique Bio Sandalwood Sunscreen SPF 30', 'biotique-sandalwood-sunscreen-spf30', 'An Ayurvedic sunscreen with SPF 30 that combines sandalwood and saffron to protect skin from sun damage while maintaining an even skin tone.', 'Ayurvedic SPF 30 sunscreen with sandalwood extracts', 'BIO-SWS-120ML', 'cat_suncare', 'brand_biotique', 62000, NULL, 30000, 'NPR', 1, 0, 0, 1, 100, 8, '["sunscreen","spf30","sandalwood","ayurvedic"]', datetime('now'), datetime('now')),

-- Men's Grooming
('prod_019', 'Himalaya Men Face Wash', 'himalaya-men-face-wash', 'A refreshing face wash specially formulated for men with activated charcoal and wintergreen. Deep cleanses pores and removes excess oil.', 'Charcoal face wash designed for men''s skin', 'HIM-MFW-100ML', 'cat_mens', 'brand_himalaya', 29900, NULL, 12000, 'NPR', 1, 0, 0, 1, 250, 12, '["face-wash","men","charcoal","oil-control"]', datetime('now'), datetime('now')),
('prod_020', 'L''Oreal Men Expert Charcoal Moisturizer', 'loreal-men-expert-charcoal-moisturizer', 'A lightweight moisturizer with activated charcoal that purifies skin and reduces shine. Specially designed for men''s skin concerns.', 'Charcoal moisturizer for men to reduce shine and purify', 'LOR-MEC-50ML', 'cat_mens', 'brand_loreal', 89000, 75000, 42000, 'NPR', 1, 0, 0, 1, 80, 8, '["moisturizer","men","charcoal","oil-control"]', datetime('now'), datetime('now'));

-- Site Settings
INSERT INTO site_settings (id, key, value, "group") VALUES
('ss_001', 'site_name', 'GLAMO Nepal', 'general'),
('ss_002', 'site_tagline', 'Your Beauty, Our Passion', 'general'),
('ss_003', 'site_description', 'Nepal''s premier online beauty destination — authentic skincare, makeup, hair care, and fragrance products delivered to your doorstep.', 'general'),
('ss_004', 'contact_email', 'hello@glamonepal.com', 'contact'),
('ss_005', 'contact_phone', '+977-01-4567890', 'contact'),
('ss_006', 'contact_address', 'Jhamsikhel, Lalitpur, Nepal', 'contact'),
('ss_007', 'instagram_handle', '@glamonepal', 'social'),
('ss_008', 'instagram_url', 'https://instagram.com/glamonepal', 'social'),
('ss_009', 'currency', 'NPR', 'shop'),
('ss_010', 'free_shipping_threshold', '250000', 'shop'),
('ss_011', 'flat_shipping_fee', '5000', 'shop'),
('ss_012', 'tax_rate', '0', 'shop');

-- Hero Banners (2)
INSERT INTO banners (id, title, subtitle, image_url, link_url, position, sort_order, is_active, created_at, updated_at) VALUES
('ban_001', 'Summer Glow Sale', 'Up to 40% off on all skincare essentials', '/images/banners/summer-glow.jpg', '/categories/skincare', 'HERO', 1, 1, datetime('now'), datetime('now')),
('ban_002', 'New Arrivals: The Ordinary', 'Science-backed skincare now available in Nepal', '/images/banners/ordinary-launch.jpg', '/brands/the-ordinary', 'HERO', 2, 1, datetime('now'), datetime('now'));

-- Welcome Popup (1)
INSERT INTO popups (id, title, content, image_url, link_url, trigger, delay_ms, is_active, created_at, updated_at) VALUES
('pop_001', 'Welcome to GLAMO!', 'Get 10% off your first order with code WELCOME10. Discover authentic beauty products delivered across Nepal.', '/images/popups/welcome.jpg', '/categories', 'ON_LOAD', 3000, 1, datetime('now'), datetime('now'));

-- Team Members (3)
INSERT INTO team_members (id, name, role, bio, image_url, sort_order, is_active, created_at, updated_at) VALUES
('tm_001', 'Aarati Shrestha', 'Founder & CEO', 'Beauty entrepreneur with 10+ years in the cosmetics industry. Passionate about making authentic beauty products accessible in Nepal.', '/images/team/aarati.jpg', 1, 1, datetime('now'), datetime('now')),
('tm_002', 'Rajesh Thapa', 'Head of Operations', 'Supply chain expert ensuring every product reaches our customers in perfect condition. Previously managed logistics for leading retail brands.', '/images/team/rajesh.jpg', 2, 1, datetime('now'), datetime('now')),
('tm_003', 'Priya Maharjan', 'Beauty Advisor', 'Certified dermatologist and beauty consultant helping our customers find the perfect products for their skin type.', '/images/team/priya.jpg', 3, 1, datetime('now'), datetime('now'));
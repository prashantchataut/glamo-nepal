import { createClient } from '@libsql/client'
import { randomUUID } from 'crypto'

async function seed() {
  const dbUrl = process.env.TURSO_DB_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  const isLocalFile = dbUrl?.startsWith('file:')
  if (!dbUrl || (!authToken && !isLocalFile)) {
    console.error('TURSO_DB_URL environment variable is required')
    console.error('(TURSO_AUTH_TOKEN is optional for local file: URLs)')
    process.exit(1)
  }

  const db = isLocalFile ? createClient({ url: dbUrl }) : createClient({ url: dbUrl, authToken })

  console.log('Seeding database...')

  const now = new Date().toISOString()

  // ─── Site Settings ────────────────────────────────────────────────────────────
  const settings = [
    { key: 'site_name', value: 'GLAMO Nepal', group: 'general' },
    { key: 'site_description', value: 'Premium Beauty & Cosmetics', group: 'general' },
    { key: 'currency', value: 'NPR', group: 'general' },
    { key: 'free_shipping_threshold', value: '2500', group: 'shipping' },
    { key: 'cod_fee', value: '50', group: 'shipping' },
    { key: 'contact_email', value: 'hello@glamonepal.com', group: 'contact' },
    { key: 'contact_phone', value: '+977-01-4567890', group: 'contact' },
    { key: 'social_instagram', value: 'https://www.instagram.com/glamo_nepal/', group: 'social' },
    { key: 'social_facebook', value: 'https://www.facebook.com/glamonepal', group: 'social' },
  ]

  for (const s of settings) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO site_settings (id, key, value, group_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), s.key, s.value, s.group, now, now],
    })
  }
  console.log(`✓ ${settings.length} site settings`)

  // ─── Categories ────────────────────────────────────────────────────────────────
  const categories = [
    { id: 'cat-skincare', name: 'Skincare', slug: 'skincare' },
    { id: 'cat-makeup', name: 'Makeup', slug: 'makeup' },
    { id: 'cat-haircare', name: 'Hair Care', slug: 'hair-care' },
    { id: 'cat-bodycare', name: 'Body Care', slug: 'body-care' },
    { id: 'cat-fragrance', name: 'Fragrance', slug: 'fragrance' },
    { id: 'cat-tools', name: 'Beauty Tools', slug: 'beauty-tools' },
  ]

  for (const cat of categories) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO categories (id, name, slug, description, is_active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
      args: [cat.id, cat.name, cat.slug, `${cat.name} products curated for Nepal`, categories.indexOf(cat) + 1, now, now],
    })
  }
  console.log(`✓ ${categories.length} categories`)

  // ─── Brands ──────────────────────────────────────────────────────────────────────
  const brands = [
    { id: 'brand-glamo', name: 'GLAMO', slug: 'glamo' },
    { id: 'brand-nepal-organic', name: 'Nepal Organic', slug: 'nepal-organic' },
    { id: 'brand-himalayan', name: 'Himalayan Beauty', slug: 'himalayan-beauty' },
    { id: 'brand-korean', name: 'K-Beauty Nepal', slug: 'k-beauty-nepal' },
  ]

  for (const brand of brands) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO brands (id, name, slug, description, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)`,
      args: [brand.id, brand.name, brand.slug, `${brand.name} brand`, now, now],
    })
  }
  console.log(`✓ ${brands.length} brands`)

  // ─── Admin User ────────────────────────────────────────────────────────────────
  console.log('✓ Admin user will be created on first login via Firebase Auth')

  // ─── Sample Banners ───────────────────────────────────────────────────────────
  const banners = [
    { id: 'banner-hero-1', title: 'Welcome to GLAMO', subtitle: 'Premium Beauty & Cosmetics in Nepal', position: 'hero', sortOrder: 1 },
    { id: 'banner-hero-2', title: 'New Arrivals', subtitle: 'Discover our latest collection', position: 'hero', sortOrder: 2 },
    { id: 'banner-promo-1', title: 'Free Shipping Over रु 2500', subtitle: 'On all orders across Nepal', position: 'promo', sortOrder: 1 },
  ]

  for (const banner of banners) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO banners (id, title, subtitle, image_url, position, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [banner.id, banner.title, banner.subtitle, '/placeholder-banner.jpg', banner.position, banner.sortOrder, now, now],
    })
  }
  console.log(`✓ ${banners.length} banners`)

  // ─── Sample Popups ────────────────────────────────────────────────────────────
  await db.execute({
    sql: `INSERT OR REPLACE INTO popups (id, title, content, trigger_type, delay_ms, cookie_days, is_active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
    args: ['popup-newsletter-1', 'Get 10% Off Your First Order!', 'Subscribe to our newsletter and get an exclusive discount code.', 'TIME_DELAY', 5000, 7, now, now],
  })
  console.log('✓ 1 popup')

  // ─── Sample Team Members ──────────────────────────────────────────────────────
  const team = [
    { id: 'team-1', name: 'Aasha Sharma', role: 'Founder & CEO', sort_order: 1 },
    { id: 'team-2', name: 'Priya Thapa', role: 'Head of Product', sort_order: 2 },
    { id: 'team-3', name: 'Rajesh Karki', role: 'Customer Experience Lead', sort_order: 3 },
  ]

  for (const member of team) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO team_members (id, name, role, bio, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [member.id, member.name, member.role, `${member.name} brings passion and expertise to GLAMO Nepal.`, member.sort_order, now, now],
    })
  }
  console.log(`✓ ${team.length} team members`)

  // ─── Sample Gallery Items ──────────────────────────────────────────────────────
  const galleryItems = [
    { id: 'gallery-1', title: 'Skincare Collection', category: 'skincare', sortOrder: 1 },
    { id: 'gallery-2', title: 'Makeup Essentials', category: 'makeup', sortOrder: 2 },
    { id: 'gallery-3', title: 'Hair Care Routine', category: 'haircare', sortOrder: 3 },
  ]

  for (const item of galleryItems) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO gallery_items (id, title, description, image_url, category, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [item.id, item.title, `${item.title} showcase`, '/placeholder-gallery.jpg', item.category, item.sortOrder, now, now],
    })
  }
  console.log(`✓ ${galleryItems.length} gallery items`)

  console.log('\nSeed complete! Your database is ready to use.')
  console.log('\nNext steps:')
  console.log('1. Create an admin user through the app (sign up, then update role in database)')
  console.log('2. Add product images via the admin panel')
  console.log('3. Configure payment gateway keys (Khalti, eSewa) in Netlify environment variables')
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
/**
 * Idempotent seed of REAL, purchasable products into the backend.
 *
 * Why this exists:
 *   The frontend storefront has a mock catalog (src/lib/data/catalog-products.ts)
 *   with ids like `p001`. The backend DB originally had a *different* set of
 *   products (prod_001…). Orders are placed by `productId`/`slug`, so for order
 *   tracking to work end-to-end the backend must contain a product whose id and
 *   slug match the frontend entry the customer added to the cart. This script
 *   guarantees that for COSRX Snail 96 Mucin and two other real SKUs.
 *
 * Re-run safety:
 *   Every insert uses INSERT OR REPLACE, so re-running updates stock/prices
 *   in place instead of creating duplicates.
 *
 * Run:
 *   cd backend && npx tsx --env-file=.env src/scripts/seed-real-products.ts
 *   (TURSO_DB_URL / TURSO_AUTH_TOKEN are read from backend/.env)
 */
import { createClient } from '@libsql/client'

// Prices are stored as paisa (NPR * 100) — see backend/src/utils/price.ts.
interface RealProduct {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  sku: string
  categoryId: string
  brandId: string
  basePrice: number // paisa
  salePrice: number | null // paisa
  costPrice: number // paisa
  isFeatured: number
  stockQuantity: number
  lowStockThreshold: number
  tags: string[]
  attributes: Record<string, unknown>
  imageUrl: string
}

const REAL_PRODUCTS: RealProduct[] = [
  {
    id: 'p001',
    name: 'COSRX Advanced Snail 96 Mucin Power Essence',
    slug: 'cosrx-advanced-snail-96-mucin-power-essence',
    description:
      'A cult Korean essence with 96% snail secretion filtrate for a plump, hydrated-looking complexion. Lightweight, non-sticky and layers beautifully under moisturiser and SPF — a K-beauty routine staple for Kathmandu weather.',
    shortDescription: '96% snail mucin hydrating essence — K-beauty staple',
    sku: 'GLM-COSRX-SNAIL-100',
    categoryId: 'cat-skincare',
    brandId: 'brand-cosrx',
    basePrice: 325000,
    salePrice: 289000,
    costPrice: 205000,
    isFeatured: 1,
    stockQuantity: 12,
    lowStockThreshold: 5,
    tags: ['Hydration', 'Barrier Repair', 'K-Beauty', 'best-seller'],
    attributes: {
      size: '100 ml',
      origin: 'Korea',
      subCategory: 'Serums',
      skinType: ['All Skin Types', 'Combination'],
      benefits: ['Cushiony hydrating essence', 'Layers well under cream', 'K-beauty routine staple'],
      ingredients: ['Snail secretion filtrate', 'Betaine', 'Allantoin'],
      howToUse: ['Pat onto clean skin after toner', 'Follow with moisturizer', 'Use morning or night'],
      badge: 'Best Seller',
      isBestSeller: true,
      isFeatured: true,
      madeInNepal: false,
      rating: 4.8,
      reviewsCount: 421,
    },
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&q=86&fit=crop&auto=format',
  },
  {
    id: 'p003',
    name: 'Beauty of Joseon Relief Sun : Rice + Probiotics SPF50+',
    slug: 'beauty-of-joseon-relief-sun-spf50',
    description:
      'A lightweight Korean chemical sunscreen with rice extract and probiotics for a comfortable, skin-like finish with no obvious white cast. Creamy but never heavy — perfect for everyday city wear in Nepal.',
    shortDescription: 'Rice + probiotic SPF50+ — no white cast, daily wear',
    sku: 'GLM-BOJ-RSUN-50',
    categoryId: 'cat-skincare',
    brandId: 'brand-beauty-of-joseon',
    basePrice: 279000,
    salePrice: 245000,
    costPrice: 165000,
    isFeatured: 1,
    stockQuantity: 42,
    lowStockThreshold: 8,
    tags: ['Sun Protection', 'No White Cast', 'K-Beauty', 'best-seller'],
    attributes: {
      size: '50 ml',
      origin: 'Korea',
      subCategory: 'Sunscreens',
      skinType: ['All Skin Types', 'Oily', 'Sensitive'],
      benefits: ['Comfortable daily SPF', 'Soft skin-like finish', 'No obvious white cast'],
      ingredients: ['Rice extract', 'Probiotics', 'Modern UV filters'],
      howToUse: ['Apply two-finger amount as last AM step', 'Reapply during outdoor days'],
      badge: 'Best Seller',
      isBestSeller: true,
      isFeatured: true,
      madeInNepal: false,
      rating: 4.9,
      reviewsCount: 512,
    },
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=86&fit=crop&auto=format',
  },
  {
    id: 'p025',
    name: 'Plum Rice Water Hybrid Sunscreen SPF 50',
    slug: 'plum-rice-water-hybrid-sunscreen-spf-50',
    description:
      'A brightening hybrid SPF50 with niacinamide and rice water — lightweight, blends in without a white cast, and sits comfortably under light makeup. A budget-friendly daily sunscreen for Nepal commute days.',
    shortDescription: 'Rice water + niacinamide hybrid SPF50, no white cast',
    sku: 'GLM-SUN-PLM-50',
    categoryId: 'cat-skincare',
    brandId: 'brand-plum',
    basePrice: 80000,
    salePrice: 69500,
    costPrice: 38000,
    isFeatured: 1,
    stockQuantity: 36,
    lowStockThreshold: 8,
    tags: ['Sun Protection', 'No White Cast', 'Brightening', 'new-arrival'],
    attributes: {
      size: '50 g',
      origin: 'India',
      subCategory: 'Sunscreens',
      skinType: ['All Skin Types', 'Combination', 'Oily'],
      benefits: ['Hybrid daily SPF finish', 'Comfortable for commute days', 'Pairs well under light makeup'],
      ingredients: ['Niacinamide', 'Rice water', 'Hybrid UV filters'],
      howToUse: ['Use as the last morning skincare step', 'Apply a two-finger amount', 'Reapply during long outdoor exposure'],
      badge: 'New',
      isNewArrival: true,
      isFeatured: true,
      madeInNepal: false,
      rating: 4.5,
      reviewsCount: 164,
    },
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=86&fit=crop&auto=format',
  },
]

interface RefEntity {
  id: string
  name: string
  slug: string
  description: string
}

// Brands & categories referenced by the real products. Seeded first so the
// products' foreign keys resolve. INSERT OR REPLACE makes this safe to re-run.
const REF_BRANDS: RefEntity[] = [
  { id: 'brand-cosrx', name: 'COSRX', slug: 'cosrx', description: 'Korean skincare built on minimal, effective formulations — a K-beauty staple.' },
  { id: 'brand-beauty-of-joseon', name: 'Beauty of Joseon', slug: 'beauty-of-joseon', description: 'K-beauty brand inspired by traditional Korean hanbang ingredients.' },
  { id: 'brand-plum', name: 'Plum', slug: 'plum', description: '100% vegan & cruelty-free Indian skincare and makeup.' },
]

const REF_CATEGORIES: RefEntity[] = [
  { id: 'cat-skincare', name: 'Skincare', slug: 'skincare', description: 'Cleansers, serums, moisturizers and SPF chosen for Nepal\'s climate.' },
]

async function main() {
  const dbUrl = process.env.TURSO_DB_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  const isLocalFile = dbUrl?.startsWith('file:')
  if (!dbUrl || (!authToken && !isLocalFile)) {
    console.error('TURSO_DB_URL (and TURSO_AUTH_TOKEN unless file: URL) must be set in backend/.env')
    process.exit(1)
  }

  const db = isLocalFile ? createClient({ url: dbUrl }) : createClient({ url: dbUrl, authToken })
  const now = new Date().toISOString()

  try {
    console.log('Seeding real, purchasable products (idempotent)…\n')

    // 1. Reference entities — brands & categories --------------------------------
    // NOTE: We use INSERT ... ON CONFLICT DO NOTHING (not INSERT OR REPLACE) here
    // because INSERT OR REPLACE performs a DELETE+INSERT internally, which trips
    // the FOREIGN KEY constraint when products already reference these rows on a
    // re-run. Inserting only when absent keeps re-runs safe.
    for (const cat of REF_CATEGORIES) {
      await db.execute({
        sql: `INSERT INTO categories (id, name, slug, description, is_active, sort_order, created_at, updated_at)
              VALUES (?, ?, ?, ?, 1, 1, ?, ?)
              ON CONFLICT(id) DO NOTHING`,
        args: [cat.id, cat.name, cat.slug, cat.description, now, now],
      })
    }
    console.log(`✓ ${REF_CATEGORIES.length} reference categories (skip if present)`)

    for (const brand of REF_BRANDS) {
      await db.execute({
        sql: `INSERT INTO brands (id, name, slug, description, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, 1, ?, ?)
              ON CONFLICT(id) DO NOTHING`,
        args: [brand.id, brand.name, brand.slug, brand.description, now, now],
      })
    }
    console.log(`✓ ${REF_BRANDS.length} reference brands (skip if present)`)

    // 2. Products ----------------------------------------------------------------
    // Products have no inbound FKs from other seeded tables, so INSERT OR REPLACE
    // is safe here and gives us idempotent upserts of stock/price on re-runs.
    for (const p of REAL_PRODUCTS) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO products
              (id, name, slug, description, short_description, sku, category_id, brand_id,
               base_price, sale_price, cost_price, currency, is_active, is_featured, is_digital,
               track_inventory, stock_quantity, low_stock_threshold, tags, attributes, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NPR', 1, ?, 0, 1, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.id, p.name, p.slug, p.description, p.shortDescription, p.sku, p.categoryId, p.brandId,
          p.basePrice, p.salePrice, p.costPrice,
          p.isFeatured,
          p.stockQuantity, p.lowStockThreshold,
          JSON.stringify(p.tags), JSON.stringify(p.attributes),
          now, now,
        ],
      })

      // 3. Primary image — INSERT OR REPLACE on a stable id keeps it idempotent.
      await db.execute({
        sql: `INSERT OR REPLACE INTO product_images
              (id, product_id, url, alt_text, sort_order, is_primary, created_at)
              VALUES (?, ?, ?, ?, 0, 1, ?)`,
        args: [`img-${p.id}`, p.id, p.imageUrl, p.name, now],
      })

      console.log(`  ✓ ${p.id}  ${p.name}  (stock=${p.stockQuantity})`)
    }

    // 4. Verify ------------------------------------------------------------------
    const verify = await db.execute({
      sql: `SELECT id, slug, sku, stock_quantity, base_price, sale_price
            FROM products WHERE id IN (${REAL_PRODUCTS.map(() => '?').join(',')})
            ORDER BY id`,
      args: REAL_PRODUCTS.map((p) => p.id),
    })
    console.log(`\nVerification — ${verify.rows.length}/${REAL_PRODUCTS.length} products present in DB:`)
    for (const row of verify.rows) {
      const r = row as Record<string, unknown>
      console.log(`   ${r.id}  ${r.slug}  sku=${r.sku}  stock=${r.stock_quantity}  base=${r.base_price}  sale=${r.sale_price}`)
    }

    if (verify.rows.length !== REAL_PRODUCTS.length) {
      console.error('\n⚠️  Some products did not persist. Review errors above.')
      process.exit(1)
    }

    console.log('\n✅ Real products seeded. They are now purchasable and will appear in order tracking.')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    // db.close() returns void on @libsql/client (not a Promise), so guard it.
    try {
      const maybe = db.close() as unknown as Promise<void> | void
      if (maybe && typeof (maybe as Promise<void>).then === 'function') {
        await maybe
      }
    } catch {
      /* connection cleanup is best-effort */
    }
  }
}

main()

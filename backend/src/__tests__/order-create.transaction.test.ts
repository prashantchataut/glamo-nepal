import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'
import { createOrder } from '../modules/orders/order.service'
import type { CreateOrderInput } from '../modules/orders/order.schema'

describe('createOrder transaction regression', () => {
  let db: Client
  let dbPath: string

  beforeAll(async () => {
    const fileName = `glamo-order-create-test-${randomUUID()}.db`
    dbPath = `file:C:/Users/MMT/AppData/Local/Temp/${fileName}`
    db = createClient({ url: dbPath })

    // Helper: split SQL file into statements and strip comment lines.
    const parseSqlFile = (contents: string): string[] =>
      contents
        .split(';')
        .map((chunk) =>
          chunk
            .split('\n')
            .filter((line) => !line.trim().startsWith('--'))
            .join('\n')
            .trim(),
        )
        .filter((s) => s.length > 0)

    const isAlreadyAppliedError = (message: string): boolean => {
      const m = message.toLowerCase()
      return (
        m.includes('already exists') ||
        m.includes('duplicate column name') ||
        m.includes('cannot add a column with non-constant default')
      )
    }

    // Run base schema and additive numbered migrations against the temp file DB.
    // Migration 0001_initial_schema.sql redefines tables and conflicts with
    // schema.sql on a fresh DB, and 0002_seed_data.sql inserts demo data, so
    // both are skipped. schema.sql is the current source of truth.
    // __dirname is src/__tests__, so repo root is two levels up.
    const repoRoot = path.join(__dirname, '../..')

    const schemaPath = path.join(repoRoot, 'src/scripts/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    for (const statement of parseSqlFile(schema)) {
      try {
        await db.execute({ sql: statement, args: [] })
      } catch (error: any) {
        if (!isAlreadyAppliedError(error?.message ?? '')) throw error
      }
    }

    const migrationsDir = path.join(repoRoot, 'migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql') && !f.startsWith('0001') && !f.includes('seed_data'))
      .sort()
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      for (const statement of parseSqlFile(sql)) {
        try {
          await db.execute({ sql: statement, args: [] })
        } catch (error: any) {
          if (!isAlreadyAppliedError(error?.message ?? '')) throw error
        }
      }
    }

    // Seed a minimal category, brand, and product for the test.
    const categoryId = randomUUID()
    const brandId = randomUUID()
    const productId = randomUUID()
    await db.execute({
      sql: `INSERT INTO categories (id, name, slug, is_active, sort_order) VALUES (?, ?, ?, 1, 1)`,
      args: [categoryId, 'Test Category', 'test-category'],
    })
    await db.execute({
      sql: `INSERT INTO brands (id, name, slug, is_active) VALUES (?, ?, ?, 1)`,
      args: [brandId, 'Test Brand', 'test-brand'],
    })
    await db.execute({
      sql: `INSERT INTO products (id, name, slug, sku, category_id, brand_id, base_price, stock_quantity, track_inventory, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      args: [productId, 'Test Product', 'test-product', 'TEST-001', categoryId, brandId, 10000, 10],
    })

    // Stash the seeded product id for the test body.
    ;(globalThis as any).__testProductId = productId
  }, 60_000)

  afterAll(() => {
    try {
      db.close()
    } catch {
      // ignore
    }
    // Clean up the temp SQLite files created by the libsql node client.
    const windowsPath = dbPath.replace('file:C:', 'C:')
    for (const ext of ['', '-shm', '-wal']) {
      try {
        fs.rmSync(windowsPath + ext, { force: true })
      } catch {
        // ignore cleanup errors
      }
    }
  })

  it('inserts order, order items, status history and decrements stock atomically', async () => {
    // Use the product seeded in beforeAll.
    const productId = (globalThis as any).__testProductId as string
    expect(productId).toBeTruthy()
    const productBefore = await db.execute({
      sql: 'SELECT id, name, sku, base_price, stock_quantity FROM products WHERE id = ?',
      args: [productId],
    })
    expect(productBefore.rows.length).toBe(1)
    const product = productBefore.rows[0] as Record<string, unknown>
    const price = (product.base_price as number) / 100
    const quantity = 1

    const payload: CreateOrderInput = {
      customer: { name: 'Test Customer', phone: '9800000000' },
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9800000000',
        address1: 'Street 1',
        city: 'Kathmandu',
        district: 'Kathmandu',
        province: 'Bagmati',
        country: 'Nepal',
      },
      paymentMethod: 'CASH_ON_DELIVERY',
      deliveryFee: 0,
      subtotal: price,
      grandTotal: price * 1.03, // COD fee 3%, server rounds independently; within tolerance
      items: [{ productId, quantity, price }],
    }

    const order = await createOrder(payload, db)

    expect(order).toBeTruthy()
    expect(order.id).toBeTruthy()

    const orderRow = await db.execute({
      sql: 'SELECT COUNT(*) as cnt FROM orders WHERE id = ?',
      args: [order.id],
    })
    expect((orderRow.rows[0] as Record<string, unknown>).cnt).toBe(1)

    const itemRow = await db.execute({
      sql: 'SELECT COUNT(*) as cnt FROM order_items WHERE order_id = ? AND product_id = ? AND quantity = ?',
      args: [order.id, productId, quantity],
    })
    expect((itemRow.rows[0] as Record<string, unknown>).cnt).toBe(1)

    const productAfter = await db.execute({
      sql: 'SELECT stock_quantity FROM products WHERE id = ?',
      args: [productId],
    })
    expect((productAfter.rows[0] as Record<string, unknown>).stock_quantity).toBe(
      (product.stock_quantity as number) - quantity,
    )

    const historyRow = await db.execute({
      sql: 'SELECT COUNT(*) as cnt FROM order_status_histories WHERE order_id = ? AND status = ?',
      args: [order.id, 'PENDING'],
    })
    expect((historyRow.rows[0] as Record<string, unknown>).cnt).toBe(1)
  }, 30_000)
})

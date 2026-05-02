import { generateOrderNumber } from '../../utils/orderNumber'
import { toDisplayPrice, toStoredPrice } from '../../utils/price'
import { buildPaginationResult, parsePagination } from '../../utils/pagination'
import type { CreateOrderInput, OrderFilterInput, UpdateOrderStatusInput } from './order.schema'

interface UserRow { id: string; email: string | null; phone: string | null; first_name: string | null; last_name: string | null }
interface ProductRow { id: string; name: string; sku: string | null; slug: string; base_price: number; sale_price: number | null; stock_quantity: number; track_inventory: number }
interface ProductImageRow { url: string | null }
interface VariantRow { id: string; name: string; sku: string | null; price: number; sale_price: number | null; stock_quantity: number; is_active: number }
interface OrderRow {
  id: string
  order_number: string
  user_id: string
  status: string
  payment_status: string
  payment_method: string
  payment_id: string | null
  subtotal: number
  shipping_charge: number
  discount_amount: number
  total_amount: number
  coupon_id: string | null
  shipping_address: string
  billing_address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
interface OrderItemRow {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  variant_name: string | null
  sku: string | null
  quantity: number
  unit_price: number
  total_price: number
  image_url: string | null
}

function paymentMethodToDb(method: string) {
  const normalized = method.toUpperCase().replace(/\s+/g, '_')
  if (normalized === 'COD' || normalized === 'CASH_ON_DELIVERY') return 'CASH_ON_DELIVERY'
  if (normalized === 'CARD' || normalized === 'CARDS') return 'BANK_TRANSFER'
  if (normalized === 'KHALTI') return 'KHALTI'
  if (normalized === 'ESEWA') return 'ESEWA'
  if (normalized === 'BANK_TRANSFER') return 'BANK_TRANSFER'
  return 'CASH_ON_DELIVERY'
}

function splitName(name?: string) {
  const clean = (name || 'GLAMO Customer').trim()
  const parts = clean.split(/\s+/)
  return { firstName: parts[0] || 'GLAMO', lastName: parts.slice(1).join(' ') || 'Customer' }
}

function addressToJson(address: CreateOrderInput['shippingAddress'], fallbackName?: string, fallbackPhone?: string) {
  return JSON.stringify({
    fullName: address.fullName || fallbackName || 'GLAMO Customer',
    phone: address.phone || fallbackPhone || '',
    address1: address.address1 || address.addressLine1 || '',
    address2: address.address2 || address.addressLine2 || '',
    city: address.city,
    ward: address.ward || '',
    district: address.district || '',
    province: address.province || '',
    postalCode: address.postalCode || '',
    country: address.country || 'Nepal',
    landmark: address.landmark || '',
  })
}

function parseAddress(address: string | null) {
  if (!address) return null
  try { return JSON.parse(address) } catch { return { address1: address } }
}

function formatOrder(row: OrderRow, items: OrderItemRow[] = [], user?: UserRow | null) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customer: user ? {
      id: user.id,
      name: [user.first_name, user.last_name].filter(Boolean).join(' ') || 'GLAMO Customer',
      email: user.email,
      phone: user.phone,
    } : null,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    paymentId: row.payment_id,
    subtotal: toDisplayPrice(row.subtotal),
    shippingCharge: toDisplayPrice(row.shipping_charge),
    discountAmount: toDisplayPrice(row.discount_amount),
    totalAmount: toDisplayPrice(row.total_amount),
    shippingAddress: parseAddress(row.shipping_address),
    billingAddress: parseAddress(row.billing_address),
    notes: row.notes,
    items: items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      name: item.product_name,
      variantName: item.variant_name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: toDisplayPrice(item.unit_price),
      totalPrice: toDisplayPrice(item.total_price),
      imageUrl: item.image_url,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function findOrCreateCustomer(data: CreateOrderInput, db: D1Database, authUserId?: string) {
  if (authUserId) return authUserId
  const customer = data.customer
  if (!customer) throw new Error('CUSTOMER_REQUIRED')

  let existing: UserRow | null = null
  if (customer.email) {
    existing = await db.prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL').bind(customer.email.toLowerCase()).first<UserRow>()
  }
  if (!existing && customer.phone) {
    existing = await db.prepare('SELECT * FROM users WHERE phone = ? AND deleted_at IS NULL').bind(customer.phone).first<UserRow>()
  }
  if (existing) return existing.id

  const { firstName, lastName } = splitName(customer.name)
  const id = crypto.randomUUID()
  const email = customer.email?.toLowerCase() || `guest+${Date.now()}-${Math.floor(Math.random() * 100000)}@glamonepal.local`
  await db.prepare(
    `INSERT INTO users (id, email, phone, first_name, last_name, role, is_active, email_verified, phone_verified)
     VALUES (?, ?, ?, ?, ?, 'CUSTOMER', 1, ?, ?)`
  ).bind(id, email, customer.phone, firstName, lastName, customer.email ? 1 : 0, 0).run()
  return id
}


function simpleSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'glamo-product'
}

function frontendCategorySlug(value?: string) {
  const slug = simpleSlug(value || 'skincare')
  if (slug === 'haircare') return 'hair-care'
  if (slug === 'bodycare') return 'body-care'
  if (slug === 'tools') return 'tools-brushes'
  return slug
}

async function ensureCheckoutCategory(db: D1Database, category?: string) {
  const preferred = frontendCategorySlug(category)
  let row = await db.prepare('SELECT id FROM categories WHERE slug = ? AND deleted_at IS NULL AND is_active = 1').bind(preferred).first<{ id: string }>()
  if (row?.id) return row.id

  row = await db.prepare('SELECT id FROM categories WHERE deleted_at IS NULL AND is_active = 1 ORDER BY sort_order ASC, name ASC LIMIT 1').first<{ id: string }>()
  if (row?.id) return row.id

  const id = 'cat_checkout'
  await db.prepare(
    `INSERT OR IGNORE INTO categories (id, name, slug, description, sort_order, is_active)
     VALUES (?, 'GLAMO Checkout', 'glamo-checkout', 'Products created from checkout payloads', 999, 1)`
  ).bind(id).run()
  return id
}

async function ensureCheckoutBrand(db: D1Database, brand?: string) {
  if (!brand) return null
  const slug = simpleSlug(brand)
  let row = await db.prepare('SELECT id FROM brands WHERE slug = ? AND deleted_at IS NULL AND is_active = 1').bind(slug).first<{ id: string }>()
  if (row?.id) return row.id

  const id = `brand_${slug}`.slice(0, 80)
  await db.prepare(
    `INSERT OR IGNORE INTO brands (id, name, slug, description, is_active)
     VALUES (?, ?, ?, ?, 1)`
  ).bind(id, brand, slug, `Checkout-created brand profile for ${brand}`).run()
  row = await db.prepare('SELECT id FROM brands WHERE id = ? OR slug = ?').bind(id, slug).first<{ id: string }>()
  return row?.id || null
}

async function createCheckoutProduct(line: CreateOrderInput['items'][number], db: D1Database) {
  const payload = line.product
  const productIdentifier = line.productId || payload?.id || `checkout_${crypto.randomUUID()}`
  const name = payload?.name || `GLAMO product ${productIdentifier}`
  const slug = payload?.slug || simpleSlug(`${name}-${productIdentifier}`)
  const sku = payload?.sku || productIdentifier.toUpperCase()
  const basePrice = toStoredPrice(Number(payload?.price || 0))
  if (!basePrice) throw new Error(`PRODUCT_NOT_FOUND:${productIdentifier}`)

  const categoryId = await ensureCheckoutCategory(db, payload?.category)
  const brandId = await ensureCheckoutBrand(db, payload?.brand)

  await db.prepare(
    `INSERT OR IGNORE INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, base_price, sale_price, currency, is_active, is_featured, is_digital, track_inventory, stock_quantity, low_stock_threshold, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'NPR', 1, 0, 0, 0, 9999, 5, ?)`
  ).bind(productIdentifier, name, slug, `Checkout catalog item: ${name}`, name, sku, categoryId, brandId, basePrice, JSON.stringify(['checkout', payload?.category || 'beauty'])).run()

  if (payload?.image) {
    await db.prepare(
      `INSERT OR IGNORE INTO product_images (id, product_id, url, alt_text, sort_order, is_primary)
       VALUES (?, ?, ?, ?, 0, 1)`
    ).bind(`img_${productIdentifier}`.slice(0, 90), productIdentifier, payload.image, name).run()
  }

  const product = await db.prepare('SELECT * FROM products WHERE id = ? OR slug = ? OR sku = ?').bind(productIdentifier, slug, sku).first<ProductRow>()
  if (!product) throw new Error(`PRODUCT_NOT_FOUND:${productIdentifier}`)
  return product
}

async function getProductForLine(line: CreateOrderInput['items'][number], db: D1Database) {
  const productIdentifier = line.productId || line.product?.id || ''
  const sku = line.product?.sku || ''
  const slug = line.product?.slug || ''
  let product: ProductRow | null = null
  if (productIdentifier) product = await db.prepare('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL AND is_active = 1').bind(productIdentifier).first<ProductRow>()
  if (!product && sku) product = await db.prepare('SELECT * FROM products WHERE sku = ? AND deleted_at IS NULL AND is_active = 1').bind(sku).first<ProductRow>()
  if (!product && slug) product = await db.prepare('SELECT * FROM products WHERE slug = ? AND deleted_at IS NULL AND is_active = 1').bind(slug).first<ProductRow>()
  if (!product && line.product) product = await createCheckoutProduct(line, db)
  if (!product) throw new Error(`PRODUCT_NOT_FOUND:${productIdentifier || sku || slug}`)
  return product
}

async function getVariantForLine(line: CreateOrderInput['items'][number], product: ProductRow, db: D1Database) {
  if (!line.variantId) return null
  const variant = await db.prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ? AND deleted_at IS NULL').bind(line.variantId, product.id).first<VariantRow>()
  if (!variant || !variant.is_active) throw new Error('VARIANT_NOT_FOUND')
  return variant
}

async function getPrimaryImage(productId: string, db: D1Database) {
  const image = await db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC LIMIT 1').bind(productId).first<ProductImageRow>()
  return image?.url || null
}

async function getOrderItems(orderId: string, db: D1Database) {
  const result = await db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC').bind(orderId).all<OrderItemRow>()
  return result.results
}

export async function createOrder(data: CreateOrderInput, db: D1Database, authUserId?: string) {
  const userId = await findOrCreateCustomer(data, db, authUserId)
  const orderId = crypto.randomUUID()
  const orderNumber = generateOrderNumber()
  const paymentMethod = paymentMethodToDb(data.paymentMethod)
  const lineItems = [] as Array<{ product: ProductRow; variant: VariantRow | null; image: string | null; quantity: number; unitPrice: number; totalPrice: number }>
  let subtotal = 0

  for (const line of data.items) {
    const product = await getProductForLine(line, db)
    const variant = await getVariantForLine(line, product, db)
    const available = variant ? variant.stock_quantity : product.stock_quantity
    if ((variant || product.track_inventory) && available < line.quantity) throw new Error(`INSUFFICIENT_STOCK:${product.name}`)
    const unitPrice = variant ? (variant.sale_price ?? variant.price) : (product.sale_price ?? product.base_price)
    const totalPrice = unitPrice * line.quantity
    subtotal += totalPrice
    lineItems.push({ product, variant, image: await getPrimaryImage(product.id, db), quantity: line.quantity, unitPrice, totalPrice })
  }

  const shippingCharge = data.deliveryFee !== undefined ? toStoredPrice(data.deliveryFee) : 0
  const discountAmount = 0
  const requestedTotal = data.grandTotal !== undefined ? toStoredPrice(data.grandTotal) : null
  const calculatedTotal = Math.max(0, subtotal + shippingCharge - discountAmount)
  const totalAmount = requestedTotal && requestedTotal >= calculatedTotal ? requestedTotal : calculatedTotal
  const shippingAddress = addressToJson(data.shippingAddress, data.customer?.name, data.customer?.phone)
  const billingAddress = data.billingAddress ? addressToJson(data.billingAddress, data.customer?.name, data.customer?.phone) : null
  const notes = data.notes || data.orderNotes || null

  const statements: D1PreparedStatement[] = []
  statements.push(db.prepare(
    `INSERT INTO orders (id, order_number, user_id, status, payment_status, payment_method, subtotal, shipping_charge, discount_amount, total_amount, shipping_address, billing_address, notes)
     VALUES (?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(orderId, orderNumber, userId, paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING', paymentMethod, subtotal, shippingCharge, discountAmount, totalAmount, shippingAddress, billingAddress, notes))

  statements.push(db.prepare('INSERT INTO order_status_histories (id, order_id, status, comment, changed_by) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), orderId, 'PENDING', 'Order received', userId))

  for (const line of lineItems) {
    statements.push(db.prepare(
      `INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, variant_name, sku, quantity, unit_price, total_price, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), orderId, line.product.id, line.variant?.id || null, line.product.name, line.variant?.name || null, line.variant?.sku || line.product.sku, line.quantity, line.unitPrice, line.totalPrice, line.image))

    if (line.variant) {
      statements.push(db.prepare('UPDATE product_variants SET stock_quantity = stock_quantity - ?, updated_at = datetime(\'now\') WHERE id = ?').bind(line.quantity, line.variant.id))
    } else if (line.product.track_inventory) {
      statements.push(db.prepare('UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = datetime(\'now\') WHERE id = ?').bind(line.quantity, line.product.id))
    }
  }

  await db.batch(statements)
  const row = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first<OrderRow>()
  const items = await getOrderItems(orderId, db)
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>()
  return formatOrder(row!, items, user)
}

export async function listOrders(filters: OrderFilterInput, db: D1Database, user?: { id: string; role: string }) {
  const { page, limit, skip: offset } = parsePagination({ page: String(filters.page || 1), limit: String(filters.limit || 20) })
  const conditions: string[] = []
  const params: unknown[] = []
  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user.role)
  if (!isAdmin && user) {
    conditions.push('o.user_id = ?')
    params.push(user.id)
  } else if (filters.userId) {
    conditions.push('o.user_id = ?')
    params.push(filters.userId)
  }
  if (filters.status) { conditions.push('o.status = ?'); params.push(filters.status.toUpperCase()) }
  if (filters.paymentStatus) { conditions.push('o.payment_status = ?'); params.push(filters.paymentStatus.toUpperCase()) }
  if (filters.paymentMethod) { conditions.push('o.payment_method = ?'); params.push(paymentMethodToDb(filters.paymentMethod)) }
  if (filters.dateFrom) { conditions.push('o.created_at >= ?'); params.push(filters.dateFrom) }
  if (filters.dateTo) { conditions.push('o.created_at <= ?'); params.push(filters.dateTo) }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const count = await db.prepare(`SELECT COUNT(*) as count FROM orders o ${where}`).bind(...params).first<{ count: number }>()
  const rows = await db.prepare(`SELECT * FROM orders o ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`).bind(...params, limit, offset).all<OrderRow>()
  const orders = []
  for (const row of rows.results) {
    const items = await getOrderItems(row.id, db)
    orders.push(formatOrder(row, items))
  }
  return { orders, pagination: buildPaginationResult(count?.count || 0, page, limit) }
}

export async function getOrder(id: string, db: D1Database, user?: { id: string; role: string }) {
  const row = await db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').bind(id, id).first<OrderRow>()
  if (!row) throw new Error('ORDER_NOT_FOUND')
  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user.role)
  if (user && !isAdmin && row.user_id !== user.id) throw new Error('ORDER_FORBIDDEN')
  const items = await getOrderItems(row.id, db)
  const customer = await db.prepare('SELECT * FROM users WHERE id = ?').bind(row.user_id).first<UserRow>()
  return formatOrder(row, items, customer)
}

export async function updateOrderStatus(id: string, data: UpdateOrderStatusInput, db: D1Database, adminId: string) {
  const row = await db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').bind(id, id).first<OrderRow>()
  if (!row) throw new Error('ORDER_NOT_FOUND')
  await db.batch([
    db.prepare('UPDATE orders SET status = ?, payment_status = COALESCE(?, payment_status), updated_at = datetime(\'now\') WHERE id = ?').bind(data.status, data.paymentStatus || null, row.id),
    db.prepare('INSERT INTO order_status_histories (id, order_id, status, comment, changed_by) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), row.id, data.status, data.comment || null, adminId),
  ])
  return getOrder(row.id, db)
}

export async function cancelOrder(id: string, db: D1Database, user: { id: string; role: string }, reason = 'Customer requested cancellation') {
  const row = await db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').bind(id, id).first<OrderRow>()
  if (!row) throw new Error('ORDER_NOT_FOUND')
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user.role)
  if (!isAdmin && row.user_id !== user.id) throw new Error('ORDER_FORBIDDEN')
  if (['SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(row.status)) throw new Error('ORDER_NOT_CANCELLABLE')
  await db.batch([
    db.prepare('UPDATE orders SET status = \'CANCELLED\', cancelled_at = datetime(\'now\'), cancel_reason = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(reason, row.id),
    db.prepare('INSERT INTO order_status_histories (id, order_id, status, comment, changed_by) VALUES (?, ?, \'CANCELLED\', ?, ?)').bind(crypto.randomUUID(), row.id, reason, user.id),
  ])
  return getOrder(row.id, db, user)
}

export async function markOrderPaymentVerified(id: string, provider: string, token: string, db: D1Database) {
  const row = await db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').bind(id, id).first<OrderRow>()
  if (!row) throw new Error('ORDER_NOT_FOUND')
  const paymentMethod = paymentMethodToDb(provider)
  const nextStatus = row.status === 'PENDING' ? 'CONFIRMED' : row.status
  await db.batch([
    db.prepare("UPDATE orders SET payment_status = 'COMPLETED', payment_method = ?, payment_id = ?, status = ?, updated_at = datetime('now') WHERE id = ?").bind(paymentMethod, token, nextStatus, row.id),
    db.prepare('INSERT INTO order_status_histories (id, order_id, status, comment, changed_by) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), row.id, nextStatus, `Payment verified via ${provider}`, row.user_id),
  ])
  const updated = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(row.id).first<OrderRow>()
  const items = await getOrderItems(row.id, db)
  const customer = await db.prepare('SELECT * FROM users WHERE id = ?').bind(row.user_id).first<UserRow>()
  return formatOrder(updated!, items, customer)
}

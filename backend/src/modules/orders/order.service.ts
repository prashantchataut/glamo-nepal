import type { Client, InValue } from '@libsql/client'
import { AppError, handleDbError, assertFound, safeJsonParse, safeJsonStringify, fromSqliteBool, toSqliteBool } from '../../utils/turso-helpers'
import { createAuditLog } from '../../utils/audit'
import { generateOrderNumber } from '../../utils/orderNumber'
import { toDisplayPrice, toStoredPrice } from '../../utils/price'
import { parsePagination, buildPaginationResult } from '../../utils/pagination'
import { getEnv } from '../../utils/env'
import type { AppEnv } from '../../types/bindings'
import type { Context } from 'hono'
import type { CreateOrderInput, UpdateOrderStatusInput, OrderFilterInput } from './order.schema'

interface ProductRow {
  id: string
  name: string
  sku: string | null
  slug: string
  base_price: number
  sale_price: number | null
  stock_quantity: number
  track_inventory: number
  is_active: number
}

interface VariantRow {
  id: string
  name: string
  sku: string | null
  price: number
  sale_price: number | null
  stock_quantity: number
  is_active: number
}

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
  shipping_address: string | null
  billing_address: string | null
  notes: string | null
  cancelled_at: string | null
  cancel_reason: string | null
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

interface StatusHistoryRow {
  id: string
  order_id: string
  status: string
  comment: string | null
  changed_by: string | null
  created_at: string
}

interface UserRow {
  id: string
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
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

function normalizeAddress(address: CreateOrderInput['shippingAddress'], fallbackName?: string, fallbackPhone?: string): Record<string, unknown> {
  return {
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
  }
}

function formatOrder(row: Record<string, unknown>, items: OrderItemRow[] = [], history: StatusHistoryRow[] = [], profile?: UserRow | null) {
  const shippingAddress = safeJsonParse<Record<string, unknown>>(row.shipping_address as string | null, {} as Record<string, unknown>) || null
  const billingAddress = safeJsonParse<Record<string, unknown>>(row.billing_address as string | null, {} as Record<string, unknown>) || null

  return {
    id: row.id as string,
    orderNumber: row.order_number as string,
    userId: row.user_id as string,
    customer: profile ? {
      id: profile.id,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'GLAMO Customer',
      email: profile.email,
      phone: profile.phone,
    } : null,
    status: row.status as string,
    paymentStatus: row.payment_status as string,
    paymentMethod: row.payment_method as string,
    paymentId: row.payment_id as string | null,
    subtotal: toDisplayPrice(row.subtotal as number),
    shippingCharge: toDisplayPrice(row.shipping_charge as number),
    discountAmount: toDisplayPrice(row.discount_amount as number),
    totalAmount: toDisplayPrice(row.total_amount as number),
    shippingAddress,
    billingAddress,
    notes: row.notes as string | null,
    cancelledAt: row.cancelled_at as string | null,
    cancelReason: row.cancel_reason as string | null,
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
    statusHistory: history.map((h) => ({
      id: h.id,
      status: h.status,
      comment: h.comment,
      changedBy: h.changed_by,
      createdAt: h.created_at,
    })),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

async function findOrCreateCustomer(data: CreateOrderInput, db: Client, authUserId?: string) {
  if (authUserId) return authUserId
  const customer = data.customer
  if (!customer) throw new AppError('Customer details are required for guest checkout', 400, 'CUSTOMER_REQUIRED')

  let existingUser: UserRow | null = null
  if (customer.email) {
    const result = await db.execute({
      sql: 'SELECT id, email, phone, first_name, last_name FROM users WHERE LOWER(email) = ? AND deleted_at IS NULL LIMIT 1',
      args: [customer.email.toLowerCase()],
    })
    if (result.rows.length > 0) {
      existingUser = result.rows[0] as unknown as UserRow
    }
  }
  if (!existingUser && customer.phone) {
    const result = await db.execute({
      sql: 'SELECT id, email, phone, first_name, last_name FROM users WHERE phone = ? AND deleted_at IS NULL LIMIT 1',
      args: [customer.phone],
    })
    if (result.rows.length > 0) {
      existingUser = result.rows[0] as unknown as UserRow
    }
  }
  if (existingUser) return existingUser.id

  const { firstName, lastName } = splitName(customer.name)
  const email = customer.email?.toLowerCase() || `guest+${Date.now()}-${Math.floor(Math.random() * 100000)}@glamonepal.local`
  const id = crypto.randomUUID()

  try {
    await db.execute({
      sql: `INSERT INTO users (id, email, phone, first_name, last_name, role, is_active, email_verified, phone_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'CUSTOMER', 1, ?, 0, datetime('now'), datetime('now'))`,
      args: [id, email, customer.phone ?? null, firstName, lastName, customer.email ? 1 : 0],
    })
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint')) {
      if (customer.email) {
        const retry = await db.execute({
          sql: 'SELECT id FROM users WHERE LOWER(email) = ? AND deleted_at IS NULL LIMIT 1',
          args: [customer.email.toLowerCase()],
        })
        if (retry.rows.length > 0) return (retry.rows[0] as any).id as string
      }
      throw new AppError('A customer with this information already exists', 409, 'CUSTOMER_EXISTS')
    }
    handleDbError(error, 'findOrCreateCustomer.insert')
  }
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

async function ensureCheckoutCategory(db: Client, category?: string) {
  const preferred = frontendCategorySlug(category)
  const existing = await db.execute({
    sql: 'SELECT id FROM categories WHERE slug = ? AND deleted_at IS NULL AND is_active = 1 LIMIT 1',
    args: [preferred],
  })
  if (existing.rows.length > 0) return (existing.rows[0] as any).id as string

  const fallback = await db.execute({
    sql: 'SELECT id FROM categories WHERE deleted_at IS NULL AND is_active = 1 ORDER BY sort_order ASC LIMIT 1',
    args: [],
  })
  if (fallback.rows.length > 0) return (fallback.rows[0] as any).id as string

  const id = 'cat_checkout'
  try {
    await db.execute({
      sql: `INSERT INTO categories (id, name, slug, description, sort_order, is_active, created_at, updated_at)
            VALUES (?, 'GLAMO Checkout', ?, 'Products created from checkout payloads', 999, 1, datetime('now'), datetime('now'))`,
      args: [id, 'glamo-checkout'],
    })
  } catch (error: any) {
    if (!error?.message?.includes('UNIQUE constraint')) handleDbError(error, 'ensureCheckoutCategory.insert')
  }
  return id
}

async function ensureCheckoutBrand(db: Client, brand?: string) {
  if (!brand) return null
  const slug = simpleSlug(brand)
  const existing = await db.execute({
    sql: 'SELECT id FROM brands WHERE slug = ? AND deleted_at IS NULL AND is_active = 1 LIMIT 1',
    args: [slug],
  })
  if (existing.rows.length > 0) return (existing.rows[0] as any).id as string

  const id = `brand_${slug}`.slice(0, 80)
  try {
    await db.execute({
      sql: `INSERT INTO brands (id, name, slug, description, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      args: [id, brand, slug, `Checkout-created brand profile for ${brand}`],
    })
  } catch (error: any) {
    if (!error?.message?.includes('UNIQUE constraint')) handleDbError(error, 'ensureCheckoutBrand.insert')
  }

  const created = await db.execute({
    sql: 'SELECT id FROM brands WHERE id = ?',
    args: [id],
  })
  return created.rows.length > 0 ? (created.rows[0] as any).id as string : null
}

async function createCheckoutProduct(line: CreateOrderInput['items'][number], db: Client) {
  const payload = line.product
  const productIdentifier = line.productId || payload?.id || `checkout_${crypto.randomUUID()}`
  const name = payload?.name || `GLAMO product ${productIdentifier}`
  const slug = payload?.slug || simpleSlug(`${name}-${productIdentifier}`)
  const sku = payload?.sku || productIdentifier.toUpperCase()
  const basePrice = toStoredPrice(Number(payload?.price || 0))
  if (!basePrice) throw new AppError(`Product not found: ${productIdentifier}`, 404, 'PRODUCT_NOT_FOUND')

  const categoryId = await ensureCheckoutCategory(db, payload?.category)
  const brandId = await ensureCheckoutBrand(db, payload?.brand)

  try {
    await db.execute({
      sql: `INSERT INTO products (id, name, slug, description, short_description, sku, category_id, brand_id, base_price, currency, is_active, is_featured, is_digital, track_inventory, stock_quantity, low_stock_threshold, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NPR', 1, 0, 0, 0, 9999, 5, ?, datetime('now'), datetime('now'))`,
      args: [
        productIdentifier, name, slug, `Checkout catalog item: ${name}`, name, sku,
        categoryId, brandId, basePrice,
        safeJsonStringify(['checkout', payload?.category || 'beauty']),
      ],
    })
  } catch (error: any) {
    if (!error?.message?.includes('UNIQUE constraint')) handleDbError(error, 'createCheckoutProduct.insert')
  }

  if (payload?.image) {
    const imageId = `img_${productIdentifier}`.slice(0, 90)
    try {
      await db.execute({
        sql: `INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary, created_at)
              VALUES (?, ?, ?, ?, 0, 1, datetime('now'))`,
        args: [imageId, productIdentifier, payload.image, name],
      })
    } catch (error) {
      if (!(error as any)?.message?.includes('UNIQUE constraint')) console.error('Failed to insert checkout product image:', error)
    }
  }

  const product = await db.execute({
    sql: 'SELECT * FROM products WHERE (id = ? OR slug = ? OR sku = ?) AND deleted_at IS NULL AND is_active = 1 LIMIT 1',
    args: [productIdentifier, slug, sku],
  })
  if (product.rows.length === 0) throw new AppError(`Product not found: ${productIdentifier}`, 404, 'PRODUCT_NOT_FOUND')
  return product.rows[0] as unknown as ProductRow
}

async function getProductForLine(line: CreateOrderInput['items'][number], db: Client) {
  const productIdentifier = line.productId || line.product?.id || ''
  const sku = line.product?.sku || ''
  const slug = line.product?.slug || ''

  let product: ProductRow | null = null

  if (productIdentifier) {
    const result = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL AND is_active = 1 LIMIT 1',
      args: [productIdentifier],
    })
    if (result.rows.length > 0) product = result.rows[0] as unknown as ProductRow
  }
  if (!product && sku) {
    const result = await db.execute({
      sql: 'SELECT * FROM products WHERE sku = ? AND deleted_at IS NULL AND is_active = 1 LIMIT 1',
      args: [sku],
    })
    if (result.rows.length > 0) product = result.rows[0] as unknown as ProductRow
  }
  if (!product && slug) {
    const result = await db.execute({
      sql: 'SELECT * FROM products WHERE slug = ? AND deleted_at IS NULL AND is_active = 1 LIMIT 1',
      args: [slug],
    })
    if (result.rows.length > 0) product = result.rows[0] as unknown as ProductRow
  }
  if (!product && line.product) {
    product = await createCheckoutProduct(line, db)
  }
  if (!product) throw new AppError(`Product not found: ${productIdentifier || sku || slug}`, 404, 'PRODUCT_NOT_FOUND')
  return product
}

async function getVariantForLine(line: CreateOrderInput['items'][number], product: ProductRow, db: Client) {
  if (!line.variantId) return null
  const result = await db.execute({
    sql: 'SELECT * FROM product_variants WHERE id = ? AND product_id = ? AND deleted_at IS NULL LIMIT 1',
    args: [line.variantId, product.id],
  })
  if (result.rows.length === 0) throw new AppError('Selected product variant is unavailable', 404, 'VARIANT_NOT_FOUND')
  const variant = result.rows[0] as unknown as VariantRow
  if (!fromSqliteBool(variant.is_active)) throw new AppError('Selected product variant is unavailable', 404, 'VARIANT_NOT_FOUND')
  return variant
}

async function getPrimaryImage(productId: string, db: Client) {
  const result = await db.execute({
    sql: 'SELECT url FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC LIMIT 1',
    args: [productId],
  })
  return result.rows.length > 0 ? (result.rows[0] as any).url as string | null : null
}

async function getOrderItems(orderId: string, db: Client) {
  const result = await db.execute({
    sql: 'SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC',
    args: [orderId],
  })
  return result.rows as unknown as OrderItemRow[]
}

async function getStatusHistory(orderId: string, db: Client) {
  const result = await db.execute({
    sql: 'SELECT * FROM order_status_histories WHERE order_id = ? ORDER BY created_at ASC',
    args: [orderId],
  })
  return result.rows as unknown as StatusHistoryRow[]
}

async function getProfile(userId: string, db: Client) {
  const result = await db.execute({
    sql: 'SELECT id, email, phone, first_name, last_name FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    args: [userId],
  })
  return result.rows.length > 0 ? result.rows[0] as unknown as UserRow : null
}

async function fetchOrderWithRelations(orderId: string, db: Client) {
  const orderResult = await db.execute({
    sql: 'SELECT * FROM orders WHERE (id = ? OR order_number = ?) AND deleted_at IS NULL LIMIT 1',
    args: [orderId, orderId],
  })
  if (orderResult.rows.length === 0) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
  const row = orderResult.rows[0]

  const [items, history, profile] = await Promise.all([
    getOrderItems((row as any).id as string, db),
    getStatusHistory((row as any).id as string, db),
    getProfile((row as any).user_id as string, db),
  ])

  return formatOrder(row, items, history, profile)
}

export async function createOrder(data: CreateOrderInput, db: Client, authUserId?: string, c?: Context<AppEnv>) {
  const userId = await findOrCreateCustomer(data, db, authUserId)
  const orderId = crypto.randomUUID()
  const orderNumber = generateOrderNumber()
  const paymentMethod = paymentMethodToDb(data.paymentMethod)

  const lineItems: Array<{
    product: ProductRow
    variant: VariantRow | null
    image: string | null
    quantity: number
    unitPrice: number
    totalPrice: number
  }> = []
  let subtotal = 0

  for (const line of data.items) {
    const product = await getProductForLine(line, db)
    const variant = await getVariantForLine(line, product, db)
    const available = variant ? variant.stock_quantity : product.stock_quantity
    if ((variant || fromSqliteBool(product.track_inventory)) && available < line.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}`, 409, 'INSUFFICIENT_STOCK')
    }
    const unitPrice = variant ? (variant.sale_price ?? variant.price) : (product.sale_price ?? product.base_price)
    const totalPrice = unitPrice * line.quantity
    subtotal += totalPrice
    const image = await getPrimaryImage(product.id, db)
    lineItems.push({ product, variant, image, quantity: line.quantity, unitPrice, totalPrice })
  }

  const shippingCharge = data.deliveryFee !== undefined ? toStoredPrice(data.deliveryFee) : 0
  const isCOD = data.paymentMethod ? ['CASH_ON_DELIVERY', 'COD', 'cod', 'Cash on Delivery'].includes(data.paymentMethod) : false
  const codFee = isCOD && c ? parseInt(getEnv(c, 'COD_FEE') || '50', 10) : (isCOD ? 50 : 0)
  const discountAmount = 0
  const requestedTotal = data.grandTotal !== undefined ? toStoredPrice(data.grandTotal) : null
  const calculatedTotal = Math.max(0, subtotal + shippingCharge + codFee - discountAmount)
  const totalAmount = requestedTotal && requestedTotal >= calculatedTotal ? requestedTotal : calculatedTotal
  const shippingAddress = normalizeAddress(data.shippingAddress, data.customer?.name, data.customer?.phone)
  const billingAddress = data.billingAddress ? normalizeAddress(data.billingAddress, data.customer?.name, data.customer?.phone) : null
  const notes = data.notes || data.orderNotes || null

  try {
    await db.execute({
      sql: `INSERT INTO orders (id, order_number, user_id, status, payment_status, payment_method, subtotal, shipping_charge, discount_amount, total_amount, shipping_address, billing_address, notes, created_at, updated_at)
            VALUES (?, ?, ?, 'PENDING', 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        orderId, orderNumber, userId, paymentMethod,
        subtotal, shippingCharge, discountAmount, totalAmount,
        safeJsonStringify(shippingAddress), safeJsonStringify(billingAddress), notes,
      ],
    })
  } catch (error) {
    handleDbError(error, 'createOrder.insertOrder')
  }

  try {
    await db.execute({
      sql: `INSERT INTO order_status_histories (id, order_id, status, comment, changed_by, created_at)
            VALUES (?, ?, 'PENDING', 'Order received', ?, datetime('now'))`,
      args: [crypto.randomUUID(), orderId, userId],
    })
  } catch (error) {
    console.error('Failed to insert initial status history:', error)
  }

  const orderItemInserts = lineItems.map((line) => ({
    id: crypto.randomUUID(),
    order_id: orderId,
    product_id: line.product.id,
    variant_id: line.variant?.id || null,
    product_name: line.product.name,
    variant_name: line.variant?.name || null,
    sku: line.variant?.sku || line.product.sku,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    total_price: line.totalPrice,
    image_url: line.image,
  }))

  for (const item of orderItemInserts) {
    try {
      await db.execute({
        sql: `INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, variant_name, sku, quantity, unit_price, total_price, image_url, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [item.id, item.order_id, item.product_id, item.variant_id, item.product_name, item.variant_name, item.sku, item.quantity, item.unit_price, item.total_price, item.image_url],
      })
    } catch (error) {
      handleDbError(error, 'createOrder.insertItems')
    }
  }

  for (const line of lineItems) {
    if (line.variant) {
      try {
        await db.execute({
          sql: 'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
          args: [line.quantity, line.variant.id],
        })
      } catch {
        await db.execute({
          sql: 'UPDATE product_variants SET stock_quantity = ? WHERE id = ?',
          args: [line.variant.stock_quantity - line.quantity, line.variant.id],
        })
      }
    } else if (fromSqliteBool(line.product.track_inventory)) {
      try {
        await db.execute({
          sql: 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          args: [line.quantity, line.product.id],
        })
      } catch {
        await db.execute({
          sql: 'UPDATE products SET stock_quantity = ? WHERE id = ?',
          args: [line.product.stock_quantity - line.quantity, line.product.id],
        })
      }
    }
  }

  return fetchOrderWithRelations(orderId, db)
}

export async function listOrders(filters: OrderFilterInput, db: Client, user?: { id: string; role: string }) {
  const { page, limit, skip } = parsePagination({ page: String(filters.page || 1), limit: String(filters.limit || 20) })
  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user.role)

  const conditions: string[] = ['o.deleted_at IS NULL']
  const args: InValue[] = []

  if (!isAdmin && user) {
    conditions.push('o.user_id = ?')
    args.push(user.id)
  } else if (filters.userId) {
    conditions.push('o.user_id = ?')
    args.push(filters.userId)
  }

  if (filters.status) {
    conditions.push('o.status = ?')
    args.push(filters.status.toUpperCase())
  }
  if (filters.paymentStatus) {
    conditions.push('o.payment_status = ?')
    args.push(filters.paymentStatus.toUpperCase())
  }
  if (filters.paymentMethod) {
    conditions.push('o.payment_method = ?')
    args.push(paymentMethodToDb(filters.paymentMethod))
  }
  if (filters.startDate) {
    conditions.push('o.created_at >= ?')
    args.push(filters.startDate)
  }
  if (filters.endDate) {
    conditions.push('o.created_at <= ?')
    args.push(filters.endDate)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
    args,
  })
  const total = Number((countResult.rows[0] as any).total)

  const dataResult = await db.execute({
    sql: `SELECT o.* FROM orders o ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, skip],
  })

  const orders = []
  for (const row of dataResult.rows) {
    const items = await getOrderItems((row as any).id as string, db)
    orders.push(formatOrder(row, items))
  }

  return { orders, pagination: buildPaginationResult(total, page, limit) }
}

export async function getOrder(orderId: string, db: Client, user?: { id: string; role: string }) {
  const result = await db.execute({
    sql: 'SELECT * FROM orders WHERE (id = ? OR order_number = ?) AND deleted_at IS NULL LIMIT 1',
    args: [orderId, orderId],
  })
  if (result.rows.length === 0) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
  const row = result.rows[0]

  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user.role)
  if (user && !isAdmin && (row as any).user_id !== user.id) {
    throw new AppError('You cannot access this order', 403, 'ORDER_FORBIDDEN')
  }

  const [items, history, profile] = await Promise.all([
    getOrderItems((row as any).id as string, db),
    getStatusHistory((row as any).id as string, db),
    getProfile((row as any).user_id as string, db),
  ])

  return formatOrder(row, items, history, profile)
}

export async function updateOrderStatus(orderId: string, data: UpdateOrderStatusInput, db: Client, adminUserId: string) {
  const fetchResult = await db.execute({
    sql: 'SELECT * FROM orders WHERE (id = ? OR order_number = ?) AND deleted_at IS NULL LIMIT 1',
    args: [orderId, orderId],
  })
  if (fetchResult.rows.length === 0) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
  const row = fetchResult.rows[0]
  const rowId = (row as any).id as string

  const updateFields = ['status = ?', 'updated_at = datetime(\'now\')']
  const updateArgs: InValue[] = [data.status]

  if (data.paymentStatus) {
    updateFields.push('payment_status = ?')
    updateArgs.push(data.paymentStatus)
  }
  updateArgs.push(rowId)

  try {
    await db.execute({
      sql: `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      args: updateArgs,
    })
  } catch (error) {
    handleDbError(error, 'updateOrderStatus.update')
  }

  try {
    await db.execute({
      sql: `INSERT INTO order_status_histories (id, order_id, status, comment, changed_by, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      args: [crypto.randomUUID(), rowId, data.status, data.comment || null, adminUserId],
    })
  } catch (error) {
    console.error('Failed to insert status history:', error)
  }

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UPDATE_STATUS',
    entity: 'orders',
    entityId: rowId,
    changes: { status: data.status, paymentStatus: data.paymentStatus },
  })

  return fetchOrderWithRelations(rowId, db)
}

export async function cancelOrder(orderId: string, db: Client, user: { id: string; role: string }, reason = 'Customer requested cancellation') {
  const fetchResult = await db.execute({
    sql: 'SELECT * FROM orders WHERE (id = ? OR order_number = ?) AND deleted_at IS NULL LIMIT 1',
    args: [orderId, orderId],
  })
  if (fetchResult.rows.length === 0) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
  const row = fetchResult.rows[0]
  const rowId = (row as any).id as string

  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user.role)
  if (!isAdmin && (row as any).user_id !== user.id) {
    throw new AppError('You cannot cancel this order', 403, 'ORDER_FORBIDDEN')
  }
  if (['SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes((row as any).status as string)) {
    throw new AppError('This order can no longer be cancelled', 409, 'ORDER_NOT_CANCELLABLE')
  }

  try {
    await db.execute({
      sql: `UPDATE orders SET status = 'CANCELLED', cancelled_at = datetime('now'), cancel_reason = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [reason, rowId],
    })
  } catch (error) {
    handleDbError(error, 'cancelOrder.update')
  }

  try {
    await db.execute({
      sql: `INSERT INTO order_status_histories (id, order_id, status, comment, changed_by, created_at)
            VALUES (?, ?, 'CANCELLED', ?, ?, datetime('now'))`,
      args: [crypto.randomUUID(), rowId, reason, user.id],
    })
  } catch (error) {
    console.error('Failed to insert cancellation history:', error)
  }

  await createAuditLog(db, {
    userId: user.id,
    action: 'CANCEL',
    entity: 'orders',
    entityId: rowId,
    changes: { status: 'CANCELLED', reason },
  })

  return fetchOrderWithRelations(rowId, db)
}

export async function verifyCheckoutPayment(orderId: string, provider: string, token: string, db: Client, env?: { KHALTI_SECRET_KEY?: string; ESEWA_SECRET_KEY?: string; ESEWA_MERCHANT_CODE?: string }) {
  const fetchResult = await db.execute({
    sql: 'SELECT * FROM orders WHERE (id = ? OR order_number = ?) AND deleted_at IS NULL LIMIT 1',
    args: [orderId, orderId],
  })
  if (fetchResult.rows.length === 0) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
  const row = fetchResult.rows[0]
  const rowId = (row as any).id as string
  const currentStatus = (row as any).status as string
  const orderTotal = Number((row as any).total_amount || 0)
  const paymentMethod = paymentMethodToDb(provider)
  const nextStatus = currentStatus === 'PENDING' ? 'CONFIRMED' : currentStatus

  let verifiedTransactionId = token
  const normalizedProvider = provider.toLowerCase()

  if (normalizedProvider === 'khalti' && env?.KHALTI_SECRET_KEY) {
    const { verifyKhaltiPayment } = await import('../../utils/payment-verify')
    const result = await verifyKhaltiPayment(token, env.KHALTI_SECRET_KEY)
    if (!result.verified) {
      throw new AppError(result.message || 'Khalti payment verification failed', 400, 'PAYMENT_VERIFICATION_FAILED')
    }
    verifiedTransactionId = result.transactionId
  } else if (normalizedProvider === 'esewa' && env?.ESEWA_SECRET_KEY && env?.ESEWA_MERCHANT_CODE) {
    const { verifyEsewaPayment } = await import('../../utils/payment-verify')
    const result = await verifyEsewaPayment(token, env.ESEWA_MERCHANT_CODE, env.ESEWA_SECRET_KEY, orderTotal)
    if (!result.verified) {
      throw new AppError(result.message || 'eSewa payment verification failed', 400, 'PAYMENT_VERIFICATION_FAILED')
    }
    verifiedTransactionId = result.transactionId
  } else if (normalizedProvider !== 'cod' && normalizedProvider !== 'card' && normalizedProvider !== 'cards') {
    console.warn(`Payment verification skipped for ${provider}: no credentials configured. Token stored as-is.`)
  }

  try {
    await db.execute({
      sql: `UPDATE orders SET payment_status = 'PAID', payment_method = ?, payment_id = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [paymentMethod, verifiedTransactionId, nextStatus, rowId],
    })
  } catch (error) {
    handleDbError(error, 'verifyCheckoutPayment.update')
  }

  try {
    await db.execute({
      sql: `INSERT INTO order_status_histories (id, order_id, status, comment, changed_by, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      args: [crypto.randomUUID(), rowId, nextStatus, `Payment verified via ${provider}`, (row as any).user_id as string],
    })
  } catch (error) {
    console.error('Failed to insert payment verification history:', error)
  }

  return fetchOrderWithRelations(rowId, db)
}
import type { Client, InValue } from '@libsql/client'
import { AppError, handleDbError, assertFound, safeJsonParse, safeJsonStringify, fromSqliteBool, toSqliteBool, withTransaction } from '../../utils/turso-helpers'
import { createAuditLog } from '../../utils/audit'
import { generateOrderNumber } from '../../utils/orderNumber'
import { toDisplayPrice, toStoredPrice } from '../../utils/price'
import { parsePagination, buildPaginationResult } from '../../utils/pagination'
import { getEnv } from '../../utils/env'
import { sendEmail, orderConfirmation, orderStatusUpdate } from '../../utils/email'
import { calculateDeliveryFee } from '../../utils/delivery'
import { validateCoupon } from '../coupons/coupon.service'
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
  cod_fee: number
  gift_wrap_fee: number
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
    codFee: toDisplayPrice(row.cod_fee as number || 0),
    giftWrapFee: toDisplayPrice(row.gift_wrap_fee as number || 0),
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

  const shippingDistrict = String(data.shippingAddress?.district || data.shippingAddress?.city || '')
  const shippingProvince = String(data.shippingAddress?.province || '')
  const serverDeliveryFee = calculateDeliveryFee(toDisplayPrice(subtotal), shippingDistrict, shippingProvince)
  const shippingCharge = toStoredPrice(serverDeliveryFee)
  if (data.deliveryFee !== undefined) {
    const clientDeliveryFee = toStoredPrice(data.deliveryFee)
    if (Math.abs(clientDeliveryFee - shippingCharge) > toStoredPrice(5)) {
      throw new AppError('Delivery fee mismatch — please refresh and try again', 400, 'DELIVERY_FEE_MISMATCH')
    }
  }
  const isCOD = data.paymentMethod ? ['CASH_ON_DELIVERY', 'COD', 'cod', 'Cash on Delivery'].includes(data.paymentMethod) : false
  const codFeeEnv = c ? getEnv(c, 'COD_FEE') : (process.env.COD_FEE || '50')
  const codFee = isCOD ? toStoredPrice(parseInt(codFeeEnv, 10)) : 0
  const giftWrapFee = data.giftWrap ? toStoredPrice(100) : 0
  let discountAmount = 0
  let couponId: string | null = null
  if (data.couponCode) {
    try {
      const cartTotalDisplay = toDisplayPrice(subtotal)
      const couponResult = await validateCoupon(data.couponCode, cartTotalDisplay, db)
      discountAmount = toStoredPrice(couponResult.discountAmount)
      couponId = couponResult.id
    } catch (err: any) {
      if (err instanceof AppError && err.code?.startsWith('COUPON_')) {
        throw err
      }
    }
  }
  const totalAmount = Math.max(0, subtotal + shippingCharge + codFee + giftWrapFee - discountAmount)

  const clientSubtotal = data.subtotal !== undefined ? toStoredPrice(data.subtotal) : null
  const clientGrandTotal = data.grandTotal !== undefined ? toStoredPrice(data.grandTotal) : null
  const tolerance = 2
  if (clientSubtotal !== null && Math.abs(clientSubtotal - subtotal) > tolerance) {
    throw new AppError('Subtotal mismatch — prices may have changed, please refresh and try again', 400, 'PRICE_MISMATCH')
  }
  if (clientGrandTotal !== null && Math.abs(clientGrandTotal - totalAmount) > tolerance) {
    throw new AppError('Total mismatch — prices may have changed, please refresh and try again', 400, 'PRICE_MISMATCH')
  }

  const shippingAddress = normalizeAddress(data.shippingAddress, data.customer?.name, data.customer?.phone)
  const billingAddress = data.billingAddress ? normalizeAddress(data.billingAddress, data.customer?.name, data.customer?.phone) : null
  const notes = data.notes || data.orderNotes || null

  const result = await withTransaction(db, async (tx) => {
    const userId = await findOrCreateCustomer(data, tx, authUserId)
    const orderId = crypto.randomUUID()
    const orderNumber = generateOrderNumber()
    const paymentMethod = paymentMethodToDb(data.paymentMethod)

await tx.execute({
      sql: `INSERT INTO orders (id, order_number, user_id, status, payment_status, payment_method, subtotal, shipping_charge, cod_fee, gift_wrap_fee, discount_amount, total_amount, coupon_id, shipping_address, billing_address, notes, created_at, updated_at)
            VALUES (?, ?, ?, 'PENDING', 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        orderId, orderNumber, userId, paymentMethod,
        subtotal, shippingCharge, codFee, giftWrapFee, discountAmount, totalAmount, couponId,
        safeJsonStringify(shippingAddress), safeJsonStringify(billingAddress), notes,
      ],
    })

    await tx.execute({
      sql: `INSERT INTO order_status_histories (id, order_id, status, comment, changed_by, created_at)
            VALUES (?, ?, 'PENDING', 'Order received', ?, datetime('now'))`,
      args: [crypto.randomUUID(), orderId, userId],
    })

    for (const line of lineItems) {
      await tx.execute({
        sql: `INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, variant_name, sku, quantity, unit_price, total_price, image_url, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [crypto.randomUUID(), orderId, line.product.id, line.variant?.id || null, line.product.name, line.variant?.name || null, line.variant?.sku || line.product.sku, line.quantity, line.unitPrice, line.totalPrice, line.image],
      })
    }

    for (const line of lineItems) {
      if (line.variant) {
        const updateResult = await tx.execute({
          sql: 'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
          args: [line.quantity, line.variant.id, line.quantity],
        })
        if (updateResult.rowsAffected === 0) {
          throw new AppError(`Insufficient stock for ${line.product.name}`, 409, 'INSUFFICIENT_STOCK')
        }
      } else if (fromSqliteBool(line.product.track_inventory)) {
        const updateResult = await tx.execute({
          sql: 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
          args: [line.quantity, line.product.id, line.quantity],
        })
        if (updateResult.rowsAffected === 0) {
          throw new AppError(`Insufficient stock for ${line.product.name}`, 409, 'INSUFFICIENT_STOCK')
        }
      }
    }

    return { orderId, userId }
  })

  const order = await fetchOrderWithRelations(result.orderId, db)

  if (c) {
    try {
      const resendKey = getEnv(c, 'RESEND_API_KEY')
      if (resendKey && order.customer?.email && order.shippingAddress) {
        const addr = order.shippingAddress as Record<string, unknown>
        sendEmail(order.customer.email, `Order Confirmed - #${order.orderNumber}`, orderConfirmation({
          orderNumber: order.orderNumber,
          items: order.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.totalPrice })),
          total: order.totalAmount,
          shippingAddress: [addr.fullName, addr.address1 || addr.addressLine1, addr.city, addr.district, addr.province].filter(Boolean).join(', '),
        }), { RESEND_API_KEY: resendKey } as any).catch(err => console.error('Failed to send order confirmation email:', err))
      }
    } catch (err) {
      console.error('Failed to send order confirmation email:', err)
    }
  }

  return order
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

  const orderIds = dataResult.rows.map((row) => (row as any).id as string)
  const allItemsResult = orderIds.length > 0
    ? await db.execute({
        sql: `SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(', ')}) ORDER BY created_at ASC`,
        args: orderIds,
      })
    : { rows: [] as any[] }

  const itemsByOrderId = new Map<string, OrderItemRow[]>()
  for (const itemRow of allItemsResult.rows) {
    const item = itemRow as unknown as OrderItemRow
    const existing = itemsByOrderId.get(item.order_id) || []
    existing.push(item)
    itemsByOrderId.set(item.order_id, existing)
  }

  const orders = dataResult.rows.map((row) => {
    const items = itemsByOrderId.get((row as any).id as string) || []
    return formatOrder(row, items)
  })

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

export async function updateOrderStatus(orderId: string, data: UpdateOrderStatusInput, db: Client, adminUserId: string, c?: Context<AppEnv>) {
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

  const updatedOrder = await fetchOrderWithRelations(rowId, db)

  if (c) {
    try {
      const resendKey = getEnv(c, 'RESEND_API_KEY')
      if (resendKey && updatedOrder.customer?.email) {
        sendEmail(
          updatedOrder.customer.email,
          `Order Update - #${updatedOrder.orderNumber}`,
          orderStatusUpdate(
            { orderNumber: updatedOrder.orderNumber, items: updatedOrder.items.map(i => ({ name: i.name })) },
            data.status,
          ),
          { RESEND_API_KEY: resendKey } as any,
        ).catch(err => console.error('Failed to send status update email:', err))
      }
    } catch (err) {
      console.error('Failed to send status update email:', err)
    }
  }

  return updatedOrder
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

  try {
    const orderItems = await getOrderItems(rowId, db)
    for (const item of orderItems) {
      if (item.variant_id) {
        await db.execute({
          sql: 'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
          args: [item.quantity, item.variant_id],
        })
      }
      const productResult = await db.execute({
        sql: 'SELECT track_inventory FROM products WHERE id = ?',
        args: [item.product_id],
      })
      if (productResult.rows.length > 0 && fromSqliteBool((productResult.rows[0] as any).track_inventory)) {
        await db.execute({
          sql: 'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
          args: [item.quantity, item.product_id],
        })
      }
    }
  } catch (error) {
    console.error('Failed to restore inventory after cancellation:', error)
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

export async function getPublicOrder(orderNumber: string, db: Client, verificationEmail?: string, verificationPhone?: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM orders WHERE order_number = ? AND deleted_at IS NULL LIMIT 1',
    args: [orderNumber],
  })
  if (result.rows.length === 0) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
  const row = result.rows[0]

  if (verificationEmail || verificationPhone) {
    const userId = (row as any).user_id as string
    const userResult = await db.execute({
      sql: 'SELECT email, phone FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      args: [userId],
    })
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0] as any
      const emailMatch = verificationEmail && user.email && user.email.toLowerCase() === verificationEmail.toLowerCase()
      const phoneMatch = verificationPhone && user.phone && user.phone === verificationPhone
      if (!emailMatch && !phoneMatch) {
        throw new AppError('Order verification failed. Please provide the email or phone used when placing the order.', 403, 'ORDER_VERIFICATION_FAILED')
      }
    }
  } else {
    const redacted = { ...row }
    const shippingAddr = safeJsonParse<Record<string, unknown>>((redacted as any).shipping_address as string | null, {} as Record<string, unknown>)
    const safeAddress: Record<string, unknown> = {}
    if (shippingAddr) {
      safeAddress.city = shippingAddr.city
      safeAddress.province = shippingAddr.province
      safeAddress.country = shippingAddr.country
    }
    ;(redacted as any).shipping_address = safeJsonStringify(safeAddress)
    ;(redacted as any).billing_address = null
    ;(redacted as any).payment_id = null
    ;(redacted as any).user_id = null
  }

  const [items, history] = await Promise.all([
    getOrderItems((row as any).id as string, db),
    getStatusHistory((row as any).id as string, db),
  ])

  return formatOrder(row, items, history, null)
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
  } else if (normalizedProvider === 'cod') {
    throw new AppError('COD orders cannot be marked as paid through payment verification', 400, 'INVALID_PAYMENT_METHOD')
  } else if (normalizedProvider !== 'card' && normalizedProvider !== 'cards') {
    throw new AppError(`Payment verification not available for ${provider}. No credentials configured.`, 400, 'PAYMENT_PROVIDER_NOT_CONFIGURED')
  } else {
    throw new AppError('Card payment verification is not yet implemented. Please contact support.', 400, 'PAYMENT_PROVIDER_NOT_CONFIGURED')
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
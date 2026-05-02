import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'
import { createAuditLog } from '../../utils/audit'
import { generateOrderNumber } from '../../utils/orderNumber'
import { toDisplayPrice, toStoredPrice } from '../../utils/price'
import { parsePagination, buildPaginationResult } from '../../utils/pagination'
import type { CreateOrderInput, UpdateOrderStatusInput, OrderFilterInput } from './order.schema'

interface ProductRow {
  id: string
  name: string
  sku: string | null
  slug: string
  base_price: number
  sale_price: number | null
  stock_quantity: number
  track_inventory: boolean
}

interface VariantRow {
  id: string
  name: string
  sku: string | null
  price: number
  sale_price: number | null
  stock_quantity: number
  is_active: boolean
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
  shipping_address: Record<string, unknown> | null
  billing_address: Record<string, unknown> | null
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

interface ProfileRow {
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

function formatOrder(row: OrderRow, items: OrderItemRow[] = [], history: StatusHistoryRow[] = [], profile?: ProfileRow | null) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customer: profile ? {
      id: profile.id,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'GLAMO Customer',
      email: profile.email,
      phone: profile.phone,
    } : null,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    paymentId: row.payment_id,
    subtotal: toDisplayPrice(row.subtotal),
    shippingCharge: toDisplayPrice(row.shipping_charge),
    discountAmount: toDisplayPrice(row.discount_amount),
    totalAmount: toDisplayPrice(row.total_amount),
    shippingAddress: row.shipping_address,
    billingAddress: row.billing_address,
    notes: row.notes,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function findOrCreateCustomer(data: CreateOrderInput, supabase: SupabaseClient, authUserId?: string) {
  if (authUserId) return authUserId
  const customer = data.customer
  if (!customer) throw new AppError('Customer details are required for guest checkout', 400, 'CUSTOMER_REQUIRED')

  let existingProfile: ProfileRow | null = null
  if (customer.email) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', customer.email.toLowerCase())
      .is('deleted_at', null)
      .maybeSingle<ProfileRow>()
    existingProfile = data
  }
  if (!existingProfile && customer.phone) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', customer.phone)
      .is('deleted_at', null)
      .maybeSingle<ProfileRow>()
    existingProfile = data
  }
  if (existingProfile) return existingProfile.id

  const { firstName, lastName } = splitName(customer.name)
  const email = customer.email?.toLowerCase() || `guest+${Date.now()}-${Math.floor(Math.random() * 100000)}@glamonepal.local`
  const id = crypto.randomUUID()

  const { error } = await supabase.from('profiles').insert({
    id,
    email,
    phone: customer.phone,
    first_name: firstName,
    last_name: lastName,
    role: 'CUSTOMER',
    is_active: true,
    email_verified: !!customer.email,
    phone_verified: false,
  })
  if (error) handleSupabaseError(error, 'findOrCreateCustomer.insert')
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

async function ensureCheckoutCategory(supabase: SupabaseClient, category?: string) {
  const preferred = frontendCategorySlug(category)
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', preferred)
    .is('deleted_at', null)
    .eq('is_active', true)
    .maybeSingle<{ id: string }>()
  if (existing?.id) return existing.id

  const { data: fallback } = await supabase
    .from('categories')
    .select('id')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>()
  if (fallback?.id) return fallback.id

  const id = 'cat_checkout'
  const { error } = await supabase.from('categories').insert({
    id,
    name: 'GLAMO Checkout',
    slug: 'glamo-checkout',
    description: 'Products created from checkout payloads',
    sort_order: 999,
    is_active: true,
  })
  if (error && error.code !== '23505') handleSupabaseError(error, 'ensureCheckoutCategory.insert')
  return id
}

async function ensureCheckoutBrand(supabase: SupabaseClient, brand?: string) {
  if (!brand) return null
  const slug = simpleSlug(brand)
  const { data: existing } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .eq('is_active', true)
    .maybeSingle<{ id: string }>()
  if (existing?.id) return existing.id

  const id = `brand_${slug}`.slice(0, 80)
  const { error } = await supabase.from('brands').insert({
    id,
    name: brand,
    slug,
    description: `Checkout-created brand profile for ${brand}`,
    is_active: true,
  })
  if (error && error.code !== '23505') handleSupabaseError(error, 'ensureCheckoutBrand.insert')

  const { data: created } = await supabase
    .from('brands')
    .select('id')
    .eq('id', id)
    .maybeSingle<{ id: string }>()
  return created?.id || null
}

async function createCheckoutProduct(line: CreateOrderInput['items'][number], supabase: SupabaseClient) {
  const payload = line.product
  const productIdentifier = line.productId || payload?.id || `checkout_${crypto.randomUUID()}`
  const name = payload?.name || `GLAMO product ${productIdentifier}`
  const slug = payload?.slug || simpleSlug(`${name}-${productIdentifier}`)
  const sku = payload?.sku || productIdentifier.toUpperCase()
  const basePrice = toStoredPrice(Number(payload?.price || 0))
  if (!basePrice) throw new AppError(`Product not found: ${productIdentifier}`, 404, 'PRODUCT_NOT_FOUND')

  const categoryId = await ensureCheckoutCategory(supabase, payload?.category)
  const brandId = await ensureCheckoutBrand(supabase, payload?.brand)

  const { error: productError } = await supabase.from('products').insert({
    id: productIdentifier,
    name,
    slug,
    description: `Checkout catalog item: ${name}`,
    short_description: name,
    sku,
    category_id: categoryId,
    brand_id: brandId,
    base_price: basePrice,
    currency: 'NPR',
    is_active: true,
    is_featured: false,
    is_digital: false,
    track_inventory: false,
    stock_quantity: 9999,
    low_stock_threshold: 5,
    tags: ['checkout', payload?.category || 'beauty'],
  })
  if (productError && productError.code !== '23505') handleSupabaseError(productError, 'createCheckoutProduct.insert')

  if (payload?.image) {
    const imageId = `img_${productIdentifier}`.slice(0, 90)
    await supabase.from('product_images').insert({
      id: imageId,
      product_id: productIdentifier,
      url: payload.image,
      alt_text: name,
      sort_order: 0,
      is_primary: true,
    }).then(({ error }) => {
      if (error && error.code !== '23505') console.error('Failed to insert checkout product image:', error)
    })
  }

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .or(`id.eq.${productIdentifier},slug.eq.${slug},sku.eq.${sku}`)
    .is('deleted_at', null)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle<ProductRow>()
  if (fetchError) handleSupabaseError(fetchError, 'createCheckoutProduct.fetch')
  if (!product) throw new AppError(`Product not found: ${productIdentifier}`, 404, 'PRODUCT_NOT_FOUND')
  return product
}

async function getProductForLine(line: CreateOrderInput['items'][number], supabase: SupabaseClient) {
  const productIdentifier = line.productId || line.product?.id || ''
  const sku = line.product?.sku || ''
  const slug = line.product?.slug || ''

  let product: ProductRow | null = null

  if (productIdentifier) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', productIdentifier)
      .is('deleted_at', null)
      .eq('is_active', true)
      .maybeSingle<ProductRow>()
    product = data
  }
  if (!product && sku) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .is('deleted_at', null)
      .eq('is_active', true)
      .maybeSingle<ProductRow>()
    product = data
  }
  if (!product && slug) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .eq('is_active', true)
      .maybeSingle<ProductRow>()
    product = data
  }
  if (!product && line.product) {
    product = await createCheckoutProduct(line, supabase)
  }
  if (!product) throw new AppError(`Product not found: ${productIdentifier || sku || slug}`, 404, 'PRODUCT_NOT_FOUND')
  return product
}

async function getVariantForLine(line: CreateOrderInput['items'][number], product: ProductRow, supabase: SupabaseClient) {
  if (!line.variantId) return null
  const { data: variant, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('id', line.variantId)
    .eq('product_id', product.id)
    .is('deleted_at', null)
    .maybeSingle<VariantRow>()
  if (error) handleSupabaseError(error, 'getVariantForLine')
  if (!variant || !variant.is_active) throw new AppError('Selected product variant is unavailable', 404, 'VARIANT_NOT_FOUND')
  return variant
}

async function getPrimaryImage(productId: string, supabase: SupabaseClient) {
  const { data } = await supabase
    .from('product_images')
    .select('url')
    .eq('product_id', productId)
    .order('is_primary', { ascending: false })
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle<{ url: string | null }>()
  return data?.url || null
}

async function getOrderItems(orderId: string, supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) handleSupabaseError(error, 'getOrderItems')
  return (data ?? []) as OrderItemRow[]
}

async function getStatusHistory(orderId: string, supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('order_status_histories')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) handleSupabaseError(error, 'getStatusHistory')
  return (data ?? []) as StatusHistoryRow[]
}

async function getProfile(userId: string, supabase: SupabaseClient) {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, phone, first_name, last_name')
    .eq('id', userId)
    .maybeSingle<ProfileRow>()
  return data ?? null
}

async function fetchOrderWithRelations(orderId: string, supabase: SupabaseClient) {
  const { data: row, error } = await supabase
    .from('orders')
    .select('*')
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .limit(1)
    .maybeSingle<OrderRow>()
  if (error) handleSupabaseError(error, 'fetchOrder')
  if (!row) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')

  const [items, history, profile] = await Promise.all([
    getOrderItems(row.id, supabase),
    getStatusHistory(row.id, supabase),
    getProfile(row.user_id, supabase),
  ])

  return formatOrder(row, items, history, profile)
}

export async function createOrder(data: CreateOrderInput, supabase: SupabaseClient, authUserId?: string) {
  const userId = await findOrCreateCustomer(data, supabase, authUserId)
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
    const product = await getProductForLine(line, supabase)
    const variant = await getVariantForLine(line, product, supabase)
    const available = variant ? variant.stock_quantity : product.stock_quantity
    if ((variant || product.track_inventory) && available < line.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}`, 409, 'INSUFFICIENT_STOCK')
    }
    const unitPrice = variant ? (variant.sale_price ?? variant.price) : (product.sale_price ?? product.base_price)
    const totalPrice = unitPrice * line.quantity
    subtotal += totalPrice
    const image = await getPrimaryImage(product.id, supabase)
    lineItems.push({ product, variant, image, quantity: line.quantity, unitPrice, totalPrice })
  }

  const shippingCharge = data.deliveryFee !== undefined ? toStoredPrice(data.deliveryFee) : 0
  const discountAmount = 0
  const requestedTotal = data.grandTotal !== undefined ? toStoredPrice(data.grandTotal) : null
  const calculatedTotal = Math.max(0, subtotal + shippingCharge - discountAmount)
  const totalAmount = requestedTotal && requestedTotal >= calculatedTotal ? requestedTotal : calculatedTotal
  const shippingAddress = normalizeAddress(data.shippingAddress, data.customer?.name, data.customer?.phone)
  const billingAddress = data.billingAddress ? normalizeAddress(data.billingAddress, data.customer?.name, data.customer?.phone) : null
  const notes = data.notes || data.orderNotes || null

  const { error: orderError } = await supabase.from('orders').insert({
    id: orderId,
    order_number: orderNumber,
    user_id: userId,
    status: 'PENDING',
    payment_status: 'PENDING',
    payment_method: paymentMethod,
    subtotal,
    shipping_charge: shippingCharge,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    shipping_address: shippingAddress,
    billing_address: billingAddress,
    notes,
  })
  if (orderError) handleSupabaseError(orderError, 'createOrder.insertOrder')

  const { error: historyError } = await supabase.from('order_status_histories').insert({
    id: crypto.randomUUID(),
    order_id: orderId,
    status: 'PENDING',
    comment: 'Order received',
    changed_by: userId,
  })
  if (historyError) console.error('Failed to insert initial status history:', historyError)

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

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemInserts)
  if (itemsError) handleSupabaseError(itemsError, 'createOrder.insertItems')

  for (const line of lineItems) {
    if (line.variant) {
      const { error } = await supabase.rpc('decrement_stock_variant', {
        variant_id: line.variant.id,
        qty: line.quantity,
      })
      if (error) {
        await supabase
          .from('product_variants')
          .update({ stock_quantity: line.variant.stock_quantity - line.quantity })
          .eq('id', line.variant.id)
      }
    } else if (line.product.track_inventory) {
      const { error } = await supabase.rpc('decrement_stock_product', {
        product_id_param: line.product.id,
        qty: line.quantity,
      })
      if (error) {
        await supabase
          .from('products')
          .update({ stock_quantity: line.product.stock_quantity - line.quantity })
          .eq('id', line.product.id)
      }
    }
  }

  return fetchOrderWithRelations(orderId, supabase)
}

export async function listOrders(filters: OrderFilterInput, supabase: SupabaseClient, user?: { id: string; role: string }) {
  const { page, limit } = parsePagination({ page: String(filters.page || 1), limit: String(filters.limit || 20) })
  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user.role)

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (!isAdmin && user) {
    query = query.eq('user_id', user.id)
  } else if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters.status) query = query.eq('status', filters.status.toUpperCase())
  if (filters.paymentStatus) query = query.eq('payment_status', filters.paymentStatus.toUpperCase())
  if (filters.paymentMethod) query = query.eq('payment_method', paymentMethodToDb(filters.paymentMethod))
  if (filters.startDate) query = query.gte('created_at', filters.startDate)
  if (filters.endDate) query = query.lte('created_at', filters.endDate)

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data: rows, error, count } = await query
  if (error) handleSupabaseError(error, 'listOrders')

  const orders = []
  for (const row of (rows ?? []) as OrderRow[]) {
    const items = await getOrderItems(row.id, supabase)
    orders.push(formatOrder(row as OrderRow, items))
  }

  return { orders, pagination: buildPaginationResult(count ?? 0, page, limit) }
}

export async function getOrder(orderId: string, supabase: SupabaseClient, user?: { id: string; role: string }) {
  const { data: row, error } = await supabase
    .from('orders')
    .select('*')
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .limit(1)
    .maybeSingle<OrderRow>()
  if (error) handleSupabaseError(error, 'getOrder')
  if (!row) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')

  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user.role)
  if (user && !isAdmin && row.user_id !== user.id) {
    throw new AppError('You cannot access this order', 403, 'ORDER_FORBIDDEN')
  }

  const [items, history, profile] = await Promise.all([
    getOrderItems(row.id, supabase),
    getStatusHistory(row.id, supabase),
    getProfile(row.user_id, supabase),
  ])

  return formatOrder(row, items, history, profile)
}

export async function updateOrderStatus(orderId: string, data: UpdateOrderStatusInput, supabase: SupabaseClient, adminUserId: string) {
  const { data: row, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .limit(1)
    .maybeSingle<OrderRow>()
  if (fetchError) handleSupabaseError(fetchError, 'updateOrderStatus.fetch')
  if (!row) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')

  const updateData: Record<string, unknown> = {
    status: data.status,
    updated_at: new Date().toISOString(),
  }
  if (data.paymentStatus) updateData.payment_status = data.paymentStatus

  const { error: updateError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', row.id)
  if (updateError) handleSupabaseError(updateError, 'updateOrderStatus.update')

  const { error: historyError } = await supabase.from('order_status_histories').insert({
    id: crypto.randomUUID(),
    order_id: row.id,
    status: data.status,
    comment: data.comment || null,
    changed_by: adminUserId,
  })
  if (historyError) console.error('Failed to insert status history:', historyError)

  await createAuditLog(supabase, {
    userId: adminUserId,
    action: 'UPDATE_STATUS',
    entity: 'orders',
    entityId: row.id,
    changes: { status: data.status, paymentStatus: data.paymentStatus },
  })

  return fetchOrderWithRelations(row.id, supabase)
}

export async function cancelOrder(orderId: string, supabase: SupabaseClient, user: { id: string; role: string }, reason = 'Customer requested cancellation') {
  const { data: row, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .limit(1)
    .maybeSingle<OrderRow>()
  if (fetchError) handleSupabaseError(fetchError, 'cancelOrder.fetch')
  if (!row) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')

  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user.role)
  if (!isAdmin && row.user_id !== user.id) {
    throw new AppError('You cannot cancel this order', 403, 'ORDER_FORBIDDEN')
  }
  if (['SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(row.status)) {
    throw new AppError('This order can no longer be cancelled', 409, 'ORDER_NOT_CANCELLABLE')
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'CANCELLED',
      cancelled_at: now,
      cancel_reason: reason,
      updated_at: now,
    })
    .eq('id', row.id)
  if (updateError) handleSupabaseError(updateError, 'cancelOrder.update')

  const { error: historyError } = await supabase.from('order_status_histories').insert({
    id: crypto.randomUUID(),
    order_id: row.id,
    status: 'CANCELLED',
    comment: reason,
    changed_by: user.id,
  })
  if (historyError) console.error('Failed to insert cancellation history:', historyError)

  await createAuditLog(supabase, {
    userId: user.id,
    action: 'CANCEL',
    entity: 'orders',
    entityId: row.id,
    changes: { status: 'CANCELLED', reason },
  })

  return fetchOrderWithRelations(row.id, supabase)
}

export async function verifyCheckoutPayment(orderId: string, provider: string, token: string, supabase: SupabaseClient) {
  const { data: row, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .limit(1)
    .maybeSingle<OrderRow>()
  if (fetchError) handleSupabaseError(fetchError, 'verifyCheckoutPayment.fetch')
  if (!row) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')

  const paymentMethod = paymentMethodToDb(provider)
  const nextStatus = row.status === 'PENDING' ? 'CONFIRMED' : row.status

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'PAID',
      payment_method: paymentMethod,
      payment_id: token,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
  if (updateError) handleSupabaseError(updateError, 'verifyCheckoutPayment.update')

  const { error: historyError } = await supabase.from('order_status_histories').insert({
    id: crypto.randomUUID(),
    order_id: row.id,
    status: nextStatus,
    comment: `Payment verified via ${provider}`,
    changed_by: row.user_id,
  })
  if (historyError) console.error('Failed to insert payment verification history:', historyError)

  return fetchOrderWithRelations(row.id, supabase)
}
import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, notFound, unauthorized, forbidden, paginated } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseClient, createSupabaseAdminClient, requireAuth, isAdmin } from '../../_shared/auth.ts';
import { createOrderSchema, updateOrderStatusSchema, orderFilterSchema, idParamSchema, validateBody, validateQuery, validateParams } from '../../_shared/validation.ts';
import { ROLES } from '../../_shared/types.ts';
import type { AppEnv } from '../../_shared/types.ts';

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GLM-${timestamp}-${random}`;
}

const app = new Hono<AppEnv>();

app.use('*', cors());

app.post('/', requireAuth(), validateBody(createOrderSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody') as z.infer<typeof createOrderSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const idempotencyKey = c.req.header('X-Idempotency-Key');
  if (idempotencyKey) {
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id, order_number')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingOrder) {
      const { data: fullOrder } = await supabaseAdmin
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', existingOrder.id)
        .single();

      return success(fullOrder, 200, 'Order already exists');
    }
  }

  const orderItems: Array<{
    product_id: string;
    variant_id: string | null;
    product_name: string;
    variant_name: string | null;
    sku: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    image_url: string | null;
  }> = [];
  let subtotal = 0;

  for (const item of body.items) {
    let product: Record<string, unknown> | null = null;
    let variant: Record<string, unknown> | null = null;

    if (item.productId) {
      const { data } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, sku, base_price, sale_price, is_active, track_inventory, stock_quantity')
        .eq('id', item.productId)
        .single();
      product = data;
    } else if (item.product?.id) {
      const { data } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, sku, base_price, sale_price, is_active, track_inventory, stock_quantity')
        .eq('id', item.product.id)
        .single();
      product = data;
    } else if (item.product?.slug) {
      const { data } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, sku, base_price, sale_price, is_active, track_inventory, stock_quantity')
        .eq('slug', item.product.slug)
        .single();
      product = data;
    }

    if (!product || !product.is_active) {
      return error(`Product not found or unavailable: ${item.productId || item.product?.id || item.product?.slug}`, 400);
    }

    if (product.track_inventory && (product.stock_quantity as number) < item.quantity) {
      return error(`Insufficient stock for product: ${product.name}`, 400);
    }

    if (item.variantId) {
      const { data } = await supabaseAdmin
        .from('product_variants')
        .select('id, name, sku, price, sale_price, stock_quantity, is_active')
        .eq('id', item.variantId)
        .single();
      variant = data;
    }

    const unitPrice = variant
      ? ((variant.sale_price as number) ?? (variant.price as number))
      : ((product.sale_price as number) ?? (product.base_price as number));

    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    let imageUrl: string | null = null;
    if (item.product?.image) {
      imageUrl = item.product.image;
    } else {
      const { data: primaryImage } = await supabaseAdmin
        .from('product_images')
        .select('url')
        .eq('product_id', product.id)
        .eq('is_primary', true)
        .maybeSingle();
      imageUrl = primaryImage?.url ?? null;
    }

    orderItems.push({
      product_id: product.id as string,
      variant_id: item.variantId ?? (variant?.id as string | null) ?? null,
      product_name: item.product?.name ?? (product.name as string),
      variant_name: variant ? (variant.name as string) : null,
      sku: variant ? (variant.sku as string | null) : (product.sku as string | null),
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: lineTotal,
      image_url: imageUrl,
    });
  }

  const shippingCharge = body.deliveryFee ?? 0;
  let discountAmount = 0;
  let couponId: string | null = null;

  if (body.couponCode) {
    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', body.couponCode)
      .eq('is_active', true)
      .single();

    if (coupon) {
      const now = new Date().toISOString();
      if (coupon.starts_at <= now && coupon.expires_at >= now) {
        if (!coupon.usage_limit || coupon.usage_count < coupon.usage_limit) {
          if (!coupon.min_order_amount || subtotal >= coupon.min_order_amount) {
            if (coupon.type === 'PERCENTAGE') {
              discountAmount = Math.round(subtotal * coupon.value) / 100;
            } else {
              discountAmount = coupon.value;
            }
            if (coupon.max_discount && discountAmount > coupon.max_discount) {
              discountAmount = coupon.max_discount;
            }
            couponId = coupon.id;
          }
        }
      }
    }
  }

  const totalAmount = Math.max(0, subtotal + shippingCharge - discountAmount);

  const shippingAddress = {
    fullName: body.shippingAddress.fullName ?? body.customer?.name ?? '',
    phone: body.shippingAddress.phone ?? body.customer?.phone ?? '',
    address1: body.shippingAddress.address1 ?? body.shippingAddress.addressLine1 ?? '',
    address2: body.shippingAddress.address2 ?? body.shippingAddress.addressLine2 ?? '',
    city: body.shippingAddress.city,
    district: body.shippingAddress.district ?? '',
    province: body.shippingAddress.province ?? '',
    postalCode: body.shippingAddress.postalCode ?? '',
    country: body.shippingAddress.country ?? 'Nepal',
  };

  const billingAddress = body.billingAddress ? {
    fullName: body.billingAddress.fullName ?? shippingAddress.fullName,
    phone: body.billingAddress.phone ?? shippingAddress.phone,
    address1: body.billingAddress.address1 ?? body.billingAddress.addressLine1 ?? shippingAddress.address1,
    address2: body.billingAddress.address2 ?? body.billingAddress.addressLine2 ?? shippingAddress.address2,
    city: body.billingAddress.city ?? shippingAddress.city,
    district: body.billingAddress.district ?? shippingAddress.district,
    province: body.billingAddress.province ?? shippingAddress.province,
    postalCode: body.billingAddress.postalCode ?? shippingAddress.postalCode,
    country: body.billingAddress.country ?? shippingAddress.country,
  } : null;

  const orderNumber = generateOrderNumber();

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      status: 'PENDING',
      payment_status: 'PENDING',
      payment_method: (body.paymentMethod as string).toUpperCase().replace(' ', '_'),
      subtotal,
      shipping_charge: shippingCharge,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      coupon_id: couponId,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      notes: body.notes ?? body.orderNotes ?? null,
      shipping_phone: shippingAddress.phone,
      billing_phone: billingAddress?.phone ?? null,
      idempotency_key: idempotencyKey ?? null,
    })
    .select()
    .single();

  if (orderError) {
    console.error('Order creation error:', orderError);
    return error('Failed to create order', 500, [orderError.message]);
  }

  const orderItemsInsert = orderItems.map((item) => ({
    ...item,
    order_id: order.id,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItemsInsert);

  if (itemsError) {
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    console.error('Order items error:', itemsError);
    return error('Failed to create order items', 500, [itemsError.message]);
  }

  await supabaseAdmin
    .from('order_status_histories')
    .insert({
      order_id: order.id,
      status: 'PENDING',
      comment: 'Order placed',
      changed_by: user.id,
    });

  if (couponId) {
    await supabaseAdmin.rpc('increment_coupon_usage', { coupon_id_arg: couponId });
  }

  for (const item of orderItems) {
    if (item.variant_id) {
      await supabaseAdmin.rpc('decrease_variant_stock', {
        variant_id_arg: item.variant_id,
        quantity_arg: item.quantity,
      });
    } else {
      await supabaseAdmin
        .from('products')
        .update({ stock_quantity: supabaseAdmin.rpc('decrement', { x: item.quantity }) })
        .eq('id', item.product_id);
    }
  }

  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id);

  const { data: fullOrder } = await supabaseAdmin
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', order.id)
    .single();

  return success(fullOrder, 201, 'Order created successfully');
});

app.get('/', requireAuth(), validateQuery(orderFilterSchema), async (c) => {
  const user = c.get('user');
  const query = c.get('validatedQuery') as z.infer<typeof orderFilterSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  let ordersQuery = supabase
    .from('orders')
    .select('*, items:order_items(*)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (query.status) ordersQuery = ordersQuery.eq('status', query.status);
  if (query.paymentStatus) ordersQuery = ordersQuery.eq('payment_status', query.paymentStatus);

  const from = (query.page - 1) * query.limit;
  const to = from + query.limit - 1;
  ordersQuery = ordersQuery.range(from, to);

  const { data: orders, count, error: fetchError } = await ordersQuery;

  if (fetchError) {
    return error('Failed to fetch orders', 500);
  }

  return paginated(orders ?? [], count ?? 0, query.page, query.limit);
});

app.get('/:id', requireAuth(), validateParams(idParamSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.get('validatedParams') as { id: string };
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const token = extractToken(c.req.raw)!;

  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: order, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('*, items:order_items(*), status_history:order_status_histories(*)')
    .eq('id', id)
    .single();

  if (fetchError || !order) {
    return notFound('Order');
  }

  if (order.user_id !== user.id && !isAdmin(user)) {
    return forbidden('You do not have access to this order');
  }

  return success(order);
});

app.get('/admin/all', requireAuth(), async (c) => {
  const user = c.get('user');
  if (!isAdmin(user)) {
    return forbidden('Admin access required');
  }

  const query = c.req.query();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const page = parseInt(query.page || '1');
  const limit = parseInt(query.limit || '20');

  let ordersQuery = supabaseAdmin
    .from('orders')
    .select('*, items:order_items(*)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (query.status) ordersQuery = ordersQuery.eq('status', query.status);
  if (query.paymentStatus) ordersQuery = ordersQuery.eq('payment_status', query.paymentStatus);
  if (query.paymentMethod) ordersQuery = ordersQuery.eq('payment_method', query.paymentMethod);
  if (query.userId) ordersQuery = ordersQuery.eq('user_id', query.userId);
  if (query.startDate) ordersQuery = ordersQuery.gte('created_at', query.startDate);
  if (query.endDate) ordersQuery = ordersQuery.lte('created_at', query.endDate);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  ordersQuery = ordersQuery.range(from, to);

  const { data: orders, count, error: fetchError } = await ordersQuery;

  if (fetchError) {
    return error('Failed to fetch orders', 500);
  }

  return paginated(orders ?? [], count ?? 0, page, limit);
});

app.put('/admin/:id/status', requireAuth(), validateParams(idParamSchema), validateBody(updateOrderStatusSchema), async (c) => {
  const user = c.get('user');
  if (!isAdmin(user)) {
    return forbidden('Admin access required');
  }

  const { id } = c.get('validatedParams') as { id: string };
  const body = c.get('validatedBody') as z.infer<typeof updateOrderStatusSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('id', id)
    .single();

  if (!existingOrder) {
    return notFound('Order');
  }

  const updateData: Record<string, unknown> = { status: body.status };
  if (body.paymentStatus) updateData.payment_status = body.paymentStatus;

  if (body.status === 'CANCELLED') {
    updateData.cancelled_at = new Date().toISOString();
  }

  const { data: order, error: updateError } = await supabaseAdmin
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return error('Failed to update order status', 400, [updateError.message]);
  }

  await supabaseAdmin
    .from('order_status_histories')
    .insert({
      order_id: id,
      status: body.status,
      comment: body.comment ?? `Status updated to ${body.status}`,
      changed_by: user.id,
    });

  return success(order);
});

Deno.serve(app.fetch);
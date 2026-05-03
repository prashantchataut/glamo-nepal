import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, notFound, unauthorized, forbidden } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseClient, createSupabaseAdminClient } from '../../_shared/auth.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.post('/', async (c) => {
  const token = extractToken(c.req.raw);
  if (!token) {
    return unauthorized('No token provided');
  }

  const user = await verifyUser(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    token
  );
  if (!user) {
    return unauthorized('Invalid or expired token');
  }

  const body = await c.req.json();
  const { orderId } = body;

  if (!orderId) {
    return error('Order ID is required', 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, user_id, status, payment_status, total_amount')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return notFound('Order');
  }

  if (order.user_id !== user.id) {
    return forbidden('You do not own this order');
  }

  if (order.status !== 'PENDING') {
    return error('Order is not in PENDING status', 400);
  }

  if (order.payment_status === 'PAID') {
    return error('Order has already been paid', 400);
  }

  const idempotencyKey = crypto.randomUUID();

  const { data: existingTxn } = await supabaseAdmin
    .from('payment_transactions')
    .select('id')
    .eq('order_id', orderId)
    .eq('provider', 'COD')
    .eq('status', 'PENDING')
    .maybeSingle();

  if (existingTxn) {
    return error('A pending COD transaction already exists for this order', 409);
  }

  const { data: transaction, error: txnError } = await supabaseAdmin
    .from('payment_transactions')
    .insert({
      order_id: orderId,
      provider: 'COD',
      idempotency_key: idempotencyKey,
      amount: order.total_amount,
      currency: 'NPR',
      status: 'PENDING',
    })
    .select()
    .single();

  if (txnError || !transaction) {
    console.error('COD transaction creation error:', txnError);
    return error('Failed to create COD payment transaction', 500);
  }

  await supabaseAdmin
    .from('orders')
    .update({
      payment_method: 'CASH_ON_DELIVERY',
      payment_status: 'PENDING',
      status: 'CONFIRMED',
    })
    .eq('id', orderId);

  await supabaseAdmin
    .from('order_status_histories')
    .insert({
      order_id: orderId,
      status: 'CONFIRMED',
      comment: 'Order confirmed with Cash on Delivery',
      changed_by: user.id,
    });

  return success({
    transactionId: transaction.id,
    idempotencyKey,
    orderId: order.id,
    orderNumber: order.order_number,
    amount: order.total_amount,
    paymentMethod: 'CASH_ON_DELIVERY',
    status: 'CONFIRMED',
  }, 200, 'COD order confirmed successfully');
});

Deno.serve(app.fetch);
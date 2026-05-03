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

  const esewaSecretKey = Deno.env.get('ESEWA_SECRET_KEY');
  const esewaMerchantCode = Deno.env.get('ESEWA_MERCHANT_CODE');

  if (!esewaSecretKey || !esewaMerchantCode) {
    return error('Payment gateway not configured', 500);
  }

  const idempotencyKey = crypto.randomUUID();

  const { data: existingTxn } = await supabaseAdmin
    .from('payment_transactions')
    .select('id')
    .eq('order_id', orderId)
    .eq('provider', 'ESEWA')
    .eq('status', 'PENDING')
    .maybeSingle();

  if (existingTxn) {
    return error('A pending eSewa payment already exists for this order. Please verify or cancel it first.', 409);
  }

  const { data: transaction, error: txnError } = await supabaseAdmin
    .from('payment_transactions')
    .insert({
      order_id: orderId,
      provider: 'ESEWA',
      idempotency_key: idempotencyKey,
      amount: order.total_amount,
      currency: 'NPR',
      status: 'PENDING',
    })
    .select()
    .single();

  if (txnError || !transaction) {
    console.error('Payment transaction creation error:', txnError);
    return error('Failed to create payment transaction', 500);
  }

  const totalAmount = String(order.total_amount);
  const productCode = esewaMerchantCode;
  const transactionUuid = idempotencyKey;

  const signatureInput = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(esewaSecretKey);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureData = encoder.encode(signatureInput);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, signatureData);
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://glamonepal.com';

  await supabaseAdmin
    .from('orders')
    .update({ payment_method: 'ESEWA' })
    .eq('id', orderId);

  return success({
    transactionId: transaction.id,
    idempotencyKey,
    amount: order.total_amount,
    productCode,
    transactionUuid,
    signature,
    esewaPaymentUrl: 'https://epay.esewa.com.np/api/v2/epay/main',
    successUrl: `${frontendUrl}/payment/esewa/callback`,
    failureUrl: `${frontendUrl}/payment/esewa/callback?status=failure`,
  }, 200, 'eSewa payment initiated');
});

Deno.serve(app.fetch);
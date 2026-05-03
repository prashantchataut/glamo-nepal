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

  const khaltiSecretKey = Deno.env.get('KHALTI_SECRET_KEY');
  if (!khaltiSecretKey) {
    return error('Payment gateway not configured', 500);
  }

  const idempotencyKey = crypto.randomUUID();

  const { data: existingTxn } = await supabaseAdmin
    .from('payment_transactions')
    .select('id')
    .eq('order_id', orderId)
    .eq('provider', 'KHALTI')
    .eq('status', 'PENDING')
    .maybeSingle();

  if (existingTxn) {
    return error('A pending Khalti payment already exists for this order. Please verify or cancel it first.', 409);
  }

  const { data: transaction, error: txnError } = await supabaseAdmin
    .from('payment_transactions')
    .insert({
      order_id: orderId,
      provider: 'KHALTI',
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

  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://glamonepal.com';
  const amountInPaisa = order.total_amount * 100;

  const khaltiPayload = {
    return_url: `${frontendUrl}/payment/khalti/callback`,
    website_url: frontendUrl,
    amount: amountInPaisa,
    purchase_order_id: order.order_number,
    purchase_order_name: `Order ${order.order_number}`,
    transaction_id: idempotencyKey,
  };

  try {
    const khaltiResponse = await fetch('https://a.khalti.com/api/v2/epayment/initiate/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${khaltiSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(khaltiPayload),
    });

    const khaltiData = await khaltiResponse.json();

    if (!khaltiResponse.ok) {
      console.error('Khalti initiate error:', khaltiData);

      await supabaseAdmin
        .from('payment_transactions')
        .update({ status: 'FAILED', provider_payload: khaltiData })
        .eq('id', transaction.id);

      return error('Failed to initiate Khalti payment', 502, [khaltiData.detail || 'Khalti gateway error']);
    }

    await supabaseAdmin
      .from('payment_transactions')
      .update({
        provider_transaction_id: khaltiData.pidx,
        provider_payload: khaltiData,
      })
      .eq('id', transaction.id);

    await supabaseAdmin
      .from('orders')
      .update({ payment_method: 'KHALTI' })
      .eq('id', orderId);

    return success({
      transactionId: transaction.id,
      idempotencyKey,
      pidx: khaltiData.pidx,
      paymentUrl: khaltiData.payment_url,
      amount: order.total_amount,
      amountInPaisa,
    }, 200, 'Khalti payment initiated');
  } catch (err) {
    console.error('Khalti initiate exception:', err);

    await supabaseAdmin
      .from('payment_transactions')
      .update({ status: 'FAILED', provider_payload: { error: String(err) } })
      .eq('id', transaction.id);

    return error('Failed to connect to Khalti payment gateway', 502);
  }
});

Deno.serve(app.fetch);
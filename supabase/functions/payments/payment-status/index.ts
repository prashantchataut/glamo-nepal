import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, notFound, unauthorized, forbidden } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseAdminClient, isAdmin } from '../../_shared/auth.ts';
import { idParamSchema } from '../../_shared/validation.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.get('/:orderId', async (c) => {
  const orderId = c.req.param('orderId');

  const parsed = idParamSchema.safeParse({ id: orderId });
  if (!parsed.success) {
    return error('Invalid order ID format', 400);
  }

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, user_id, status, payment_status, payment_method, total_amount')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return notFound('Order');
  }

  if (order.user_id !== user.id && !isAdmin(user)) {
    return forbidden('You do not have access to this order');
  }

  const { data: transactions, error: txnError } = await supabaseAdmin
    .from('payment_transactions')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (txnError) {
    console.error('Payment transactions fetch error:', txnError);
    return error('Failed to fetch payment transactions', 500);
  }

  const latestTransaction = transactions?.[0] || null;

  return success({
    orderId: order.id,
    orderNumber: order.order_number,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    totalAmount: order.total_amount,
    orderStatus: order.status,
    latestTransaction: latestTransaction ? {
      id: latestTransaction.id,
      provider: latestTransaction.provider,
      status: latestTransaction.status,
      amount: latestTransaction.amount,
      currency: latestTransaction.currency,
      providerTransactionId: latestTransaction.provider_transaction_id,
      idempotencyKey: latestTransaction.idempotency_key,
      verifiedAt: latestTransaction.verified_at,
      createdAt: latestTransaction.created_at,
    } : null,
    allTransactions: (transactions || []).map((t) => ({
      id: t.id,
      provider: t.provider,
      status: t.status,
      amount: t.amount,
      currency: t.currency,
      providerTransactionId: t.provider_transaction_id,
      createdAt: t.created_at,
    })),
  });
});

Deno.serve(app.fetch);
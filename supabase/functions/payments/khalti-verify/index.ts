import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, notFound } from '../../_shared/response.ts';
import { createSupabaseAdminClient } from '../../_shared/auth.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.post('/', async (c) => {
  const body = await c.req.json();
  const { pidx, idempotencyKey } = body;

  if (!pidx && !idempotencyKey) {
    return error('pidx or idempotencyKey is required', 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const khaltiSecretKey = Deno.env.get('KHALTI_SECRET_KEY')!;

  if (!khaltiSecretKey) {
    return error('Payment gateway not configured', 500);
  }

  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  let transactionQuery = supabaseAdmin
    .from('payment_transactions')
    .select('*, orders(*)')
    .eq('provider', 'KHALTI');

  if (idempotencyKey) {
    transactionQuery = transactionQuery.eq('idempotency_key', idempotencyKey);
  } else {
    transactionQuery = transactionQuery.eq('provider_transaction_id', pidx);
  }

  const { data: transaction, error: txnError } = await transactionQuery.single();

  if (txnError || !transaction) {
    return notFound('Payment transaction');
  }

  if (transaction.status === 'VERIFIED') {
    return success({
      transactionId: transaction.id,
      status: 'VERIFIED',
      orderId: transaction.order_id,
    }, 200, 'Payment already verified');
  }

  if (transaction.status === 'FAILED') {
    return error('Payment has already failed', 400);
  }

  try {
    const lookupResponse = await fetch('https://a.khalti.com/api/v2/epayment/lookup/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${khaltiSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx: pidx || transaction.provider_transaction_id }),
    });

    const lookupData = await lookupResponse.json();

    if (!lookupResponse.ok) {
      console.error('Khalti lookup error:', lookupData);
      return error('Failed to verify payment with Khalti', 502, [lookupData.detail || 'Khalti verification error']);
    }

    if (lookupData.status !== 'Completed') {
      if (lookupData.status === 'Expired' || lookupData.status === 'Refunded') {
        await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: lookupData.status === 'Refunded' ? 'REFUNDED' : 'FAILED',
            provider_payload: lookupData,
          })
          .eq('id', transaction.id);

        return error(`Payment ${lookupData.status.toLowerCase()}`, 400);
      }

      return error(`Payment status: ${lookupData.status}`, 400);
    }

    const order = transaction.orders;
    const expectedAmount = order.total_amount * 100;

    if (lookupData.total_amount !== expectedAmount) {
      console.error('Amount mismatch:', {
        expected: expectedAmount,
        received: lookupData.total_amount,
        orderId: transaction.order_id,
      });

      await supabaseAdmin
        .from('payment_transactions')
        .update({
          status: 'FAILED',
          provider_payload: { ...lookupData, fraud_detected: true, expected_amount: expectedAmount },
        })
        .eq('id', transaction.id);

      return error('Amount verification failed', 400);
    }

    await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'VERIFIED',
        provider_transaction_id: lookupData.transaction_id || lookupData.pidx || pidx,
        provider_payload: lookupData,
        verified_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'PAID',
        status: 'CONFIRMED',
      })
      .eq('id', transaction.order_id);

    await supabaseAdmin
      .from('order_status_histories')
      .insert({
        order_id: transaction.order_id,
        status: 'CONFIRMED',
        comment: 'Payment verified via Khalti',
      });

    return success({
      transactionId: transaction.id,
      status: 'VERIFIED',
      orderId: transaction.order_id,
      khaltiTransactionId: lookupData.transaction_id,
    }, 200, 'Payment verified successfully');
  } catch (err) {
    console.error('Khalti verify exception:', err);
    return error('Failed to verify payment with Khalti', 502);
  }
});

Deno.serve(app.fetch);
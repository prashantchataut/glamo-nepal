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
  const { transactionUuid, productCode, totalAmount, status, signedPayload } = body;

  if (!transactionUuid) {
    return error('transactionUuid is required', 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const esewaSecretKey = Deno.env.get('ESEWA_SECRET_KEY');
  const esewaMerchantCode = Deno.env.get('ESEWA_MERCHANT_CODE');

  if (!esewaSecretKey || !esewaMerchantCode) {
    return error('Payment gateway not configured', 500);
  }

  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: transaction, error: txnError } = await supabaseAdmin
    .from('payment_transactions')
    .select('*, orders(*)')
    .eq('idempotency_key', transactionUuid)
    .eq('provider', 'ESEWA')
    .single();

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

  if (signedPayload) {
    try {
      const decodedPayload = atob(signedPayload);
      const payload = JSON.parse(decodedPayload);

      const signatureInput = `total_amount=${payload.total_amount || totalAmount},transaction_uuid=${payload.transaction_uuid || transactionUuid},product_code=${payload.product_code || productCode || esewaMerchantCode}`;
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
      const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

      const receivedSignature = payload.signature || '';
      if (receivedSignature !== expectedSignature) {
        console.error('eSewa signature mismatch:', {
          expected: expectedSignature,
          received: receivedSignature,
        });

        await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: 'FAILED',
            provider_payload: { ...payload, signature_verification_failed: true },
          })
          .eq('id', transaction.id);

        return error('Payment signature verification failed', 400);
      }
    } catch (err) {
      console.error('eSewa signature verification error:', err);
      return error('Invalid signed payload', 400);
    }
  }

  if (status && status !== 'COMPLETE') {
    await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'FAILED',
        provider_payload: body,
      })
      .eq('id', transaction.id);

    return error(`Payment status: ${status}`, 400);
  }

  const order = transaction.orders;
  const expectedAmount = order.total_amount;
  const receivedAmount = Number(totalAmount || 0);

  if (receivedAmount !== expectedAmount) {
    console.error('Amount mismatch:', {
      expected: expectedAmount,
      received: receivedAmount,
      orderId: transaction.order_id,
    });

    await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'FAILED',
        provider_payload: { ...body, fraud_detected: true, expected_amount: expectedAmount },
      })
      .eq('id', transaction.id);

    return error('Amount verification failed', 400);
  }

  await supabaseAdmin
    .from('payment_transactions')
    .update({
      status: 'VERIFIED',
      provider_transaction_id: body.refId || transactionUuid,
      provider_payload: body,
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
      comment: 'Payment verified via eSewa',
    });

  return success({
    transactionId: transaction.id,
    status: 'VERIFIED',
    orderId: transaction.order_id,
  }, 200, 'Payment verified successfully');
});

Deno.serve(app.fetch);
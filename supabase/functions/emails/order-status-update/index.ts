import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createSupabaseAdminClient } from '../../_shared/auth.ts';
import { sendEmail } from '../../_shared/email.ts';
import { renderOrderStatusUpdateEmail } from '../../_shared/email-templates/order-status-update.ts';
import type { OrderStatusUpdateData } from '../../_shared/email-templates/order-status-update.ts';
import { renderOrderCancelledEmail } from '../../_shared/email-templates/order-cancelled.ts';
import type { OrderCancelledData } from '../../_shared/email-templates/order-cancelled.ts';
import { success, error, notFound } from '../../_shared/response.ts';

const app = new Hono();

app.use('*', cors());

app.post('/', async (c) => {
  const body = await c.req.json<{ orderId: string; newStatus: string; comment?: string; trackingCarrier?: string; trackingNumber?: string; trackingUrl?: string }>();

  if (!body?.orderId) {
    return error('orderId is required', 400);
  }
  if (!body?.newStatus) {
    return error('newStatus is required', 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://glamonepal.com';
  const supabase = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', body.orderId)
    .single();

  if (orderError || !order) {
    return notFound('Order');
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, variant_name, quantity')
    .eq('order_id', body.orderId);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('id', order.user_id)
    .single();

  if (profileError || !profile) {
    return notFound('User profile');
  }

  if (!profile.email) {
    return error('User has no email address', 400);
  }

  const customerName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Customer';

  let emailHtml: string;
  let subject: string;

  if (body.newStatus === 'CANCELLED') {
    const cancelledData: OrderCancelledData = {
      orderNumber: order.order_number,
      customerName,
      cancellationReason: body.comment || order.notes || 'Order cancelled',
      items: (items || []).map((item: Record<string, unknown>) => ({
        name: item.product_name as string,
        variantName: (item.variant_name as string) ?? undefined,
        quantity: item.quantity as number,
        totalPrice: item.unit_price as number,
      })),
      orderUrl: `${frontendUrl}/account/orders/${order.order_number}`,
    };
    emailHtml = renderOrderCancelledEmail(cancelledData);
    subject = `Order Cancelled — #${order.order_number}`;
  } else {
    const statusData: OrderStatusUpdateData = {
      orderNumber: order.order_number,
      customerName,
      newStatus: body.newStatus,
      comment: body.comment,
      trackingInfo: body.trackingNumber ? {
        carrier: body.trackingCarrier,
        trackingNumber: body.trackingNumber,
        trackingUrl: body.trackingUrl,
      } : undefined,
      items: (items || []).map((item: Record<string, unknown>) => ({
        name: item.product_name as string,
        variantName: (item.variant_name as string) ?? undefined,
        quantity: item.quantity as number,
      })),
      orderUrl: `${frontendUrl}/account/orders/${order.order_number}`,
    };
    emailHtml = renderOrderStatusUpdateEmail(statusData);
    subject = `Order #${order.order_number} — ${body.newStatus}`;
  }

  const result = await sendEmail(
    {
      to: profile.email,
      subject,
      html: emailHtml,
    },
    resendApiKey
  );

  if (!result.success) {
    return error('Failed to send order status update email', 500, [result.error ?? '']);
  }

  return success({ emailId: result.id }, 200, 'Order status update email sent');
});

Deno.serve(app.fetch);
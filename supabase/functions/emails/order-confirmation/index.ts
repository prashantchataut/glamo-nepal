import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createSupabaseAdminClient } from '../../_shared/auth.ts';
import { sendEmail, orderConfirmationTemplate } from '../../_shared/email.ts';
import { success, error, notFound } from '../../_shared/response.ts';

const app = new Hono();

app.use('*', cors());

app.post('/', async (c) => {
  const body = await c.req.json<{ orderId: string }>();

  if (!body?.orderId) {
    return error('orderId is required', 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
  const supabase = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', body.orderId)
    .single();

  if (orderError || !order) {
    return notFound('Order');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', order.user_id)
    .single();

  if (profileError || !profile) {
    return notFound('User profile');
  }

  const recipientEmail = profile.email;
  if (!recipientEmail) {
    return error('User has no email address', 400);
  }

  const shippingAddr = order.shipping_address as Record<string, string>;
  const shippingLine = [
    shippingAddr?.fullName,
    shippingAddr?.address1,
    shippingAddr?.city,
    shippingAddr?.district,
    shippingAddr?.country,
  ].filter(Boolean).join(', ');

  const emailHtml = orderConfirmationTemplate({
    orderNumber: order.order_number,
    items: (order.items as Array<Record<string, unknown>>).map((item) => ({
      name: (item.product_name as string) ?? '',
      quantity: item.quantity as number,
      price: item.unit_price as number,
    })),
    total: order.total_amount as number,
    shippingAddress: shippingLine,
  });

  const result = await sendEmail(
    {
      to: recipientEmail,
      subject: `Order Confirmation #${order.order_number}`,
      html: emailHtml,
    },
    resendApiKey
  );

  if (!result.success) {
    return error('Failed to send order confirmation email', 500, [result.error ?? '']);
  }

  return success({ emailId: result.id }, 200, 'Order confirmation email sent');
});

Deno.serve(app.fetch);
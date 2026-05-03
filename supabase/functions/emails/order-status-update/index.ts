import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createSupabaseAdminClient } from '../../_shared/auth.ts';
import { sendEmail, orderStatusUpdateTemplate, orderCancelledTemplate } from '../../_shared/email.ts';
import { success, error, notFound } from '../../_shared/response.ts';

const app = new Hono();

app.use('*', cors());

app.post('/', async (c) => {
  const body = await c.req.json<{ orderId: string; newStatus: string }>();

  if (!body?.orderId) {
    return error('orderId is required', 400);
  }
  if (!body?.newStatus) {
    return error('newStatus is required', 400);
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

  let emailHtml: string;
  let subject: string;

  if (body.newStatus === 'CANCELLED') {
    emailHtml = orderCancelledTemplate(
      order.order_number as string,
      order.notes as string | null
    );
    subject = `Order Cancelled #${order.order_number}`;
  } else {
    emailHtml = orderStatusUpdateTemplate(
      {
        orderNumber: order.order_number as string,
        items: (order.items as Array<Record<string, unknown>>).map((item) => ({
          name: (item.product_name as string) ?? '',
        })),
      },
      body.newStatus
    );
    subject = `Order Update #${order.order_number} — ${body.newStatus}`;
  }

  const result = await sendEmail(
    {
      to: recipientEmail,
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
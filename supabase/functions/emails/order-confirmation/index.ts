import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createSupabaseAdminClient } from '../../_shared/auth.ts';
import { sendEmail } from '../../_shared/email.ts';
import { renderOrderConfirmationEmail } from '../../_shared/email-templates/order-confirmation.ts';
import type { OrderConfirmationData } from '../../_shared/email-templates/order-confirmation.ts';
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
    .select('*')
    .eq('order_id', body.orderId)
    .order('created_at', { ascending: true });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, phone')
    .eq('id', order.user_id)
    .single();

  if (profileError || !profile) {
    return notFound('User profile');
  }

  if (!profile.email) {
    return error('User has no email address', 400);
  }

  const customerName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Customer';
  const shippingAddr = (order.shipping_address || {}) as Record<string, string>;

  const emailData: OrderConfirmationData = {
    orderNumber: order.order_number,
    customerName,
    items: (items || []).map((item: Record<string, unknown>) => ({
      name: (item.product_name as string) ?? '',
      variantName: (item.variant_name as string) ?? undefined,
      quantity: item.quantity as number,
      unitPrice: item.unit_price as number,
      totalPrice: item.total_price as number,
      imageUrl: (item.image_url as string) ?? undefined,
    })),
    subtotal: order.subtotal,
    shippingCharge: order.shipping_charge,
    discountAmount: order.discount_amount,
    totalAmount: order.total_amount,
    shippingAddress: {
      fullName: (shippingAddr.fullName as string) || customerName,
      phone: (shippingAddr.phone as string) || order.shipping_phone || '',
      address1: (shippingAddr.address1 as string) || (shippingAddr.addressLine1 as string) || '',
      address2: (shippingAddr.address2 as string) || (shippingAddr.addressLine2 as string) || undefined,
      city: (shippingAddr.city as string) || '',
      district: (shippingAddr.district as string) || undefined,
      province: (shippingAddr.province as string) || undefined,
      postalCode: (shippingAddr.postalCode as string) || undefined,
      country: (shippingAddr.country as string) || 'Nepal',
    },
    paymentMethod: order.payment_method,
    orderDate: new Date(order.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    orderUrl: `${frontendUrl}/account/orders/${order.order_number}`,
  };

  const emailHtml = renderOrderConfirmationEmail(emailData);

  const result = await sendEmail(
    {
      to: profile.email,
      subject: `Order Confirmed — #${order.order_number}`,
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
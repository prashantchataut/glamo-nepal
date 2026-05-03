import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createSupabaseAdminClient } from '../../_shared/auth.ts';
import { sendEmail, lowStockAlertTemplate } from '../../_shared/email.ts';
import { success, error, notFound } from '../../_shared/response.ts';

const app = new Hono();

app.use('*', cors());

app.post('/', async (c) => {
  const body = await c.req.json<{ productId?: string }>();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
  const supabase = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  let productsQuery = supabase
    .from('products')
    .select('id, name, sku, stock_quantity, low_stock_threshold, is_active')
    .eq('is_active', true);

  if (body?.productId) {
    productsQuery = productsQuery.eq('id', body.productId);
  }

  const { data: allProducts, error: productsError } = await productsQuery;

  if (productsError || !allProducts || allProducts.length === 0) {
    return notFound('Product');
  }

  const lowStockProducts = allProducts.filter(
    (p: Record<string, unknown>) =>
      (p.stock_quantity as number) < ((p.low_stock_threshold as number) ?? 10)
  );

  if (lowStockProducts.length === 0) {
    return success({ lowStockCount: 0 }, 200, 'No low stock products found');
  }

  const { data: siteSettings } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'admin_email')
    .maybeSingle();

  const adminEmail = siteSettings?.value ?? Deno.env.get('ADMIN_EMAIL') ?? 'admin@glamonepal.com';

  const emailHtml = lowStockAlertTemplate(
    lowStockProducts.map((p: Record<string, unknown>) => ({
      name: p.name as string,
      sku: (p.sku as string) ?? 'N/A',
      stock: p.stock_quantity as number,
    }))
  );

  const result = await sendEmail(
    {
      to: adminEmail,
      subject: `Low Stock Alert — ${lowStockProducts.length} product(s) running low`,
      html: emailHtml,
    },
    resendApiKey
  );

  if (!result.success) {
    return error('Failed to send low stock alert email', 500, [result.error ?? '']);
  }

  return success(
    {
      emailId: result.id,
      lowStockCount: lowStockProducts.length,
      products: lowStockProducts.map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        stock: p.stock_quantity,
      })),
    },
    200,
    'Low stock alert email sent'
  );
});

Deno.serve(app.fetch);
import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createSupabaseAdminClient } from '../../_shared/auth.ts';
import { sendEmail } from '../../_shared/email.ts';
import { renderLowStockAlertEmail } from '../../_shared/email-templates/low-stock-alert.ts';
import type { LowStockAlertData } from '../../_shared/email-templates/low-stock-alert.ts';
import { success, error, notFound } from '../../_shared/response.ts';

const app = new Hono();

app.use('*', cors());

app.post('/', async (c) => {
  const body = await c.req.json<{ productId?: string }>();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://glamonepal.com';
  const adminEmails = (Deno.env.get('ADMIN_EMAILS') || 'admin@glamonepal.com').split(',').map((e: string) => e.trim());
  const supabase = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  let lowStockProducts: Array<{
    name: string;
    sku: string | null;
    currentStock: number;
    threshold: number;
    category?: string;
  }> = [];

  if (body?.productId) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, sku, stock_quantity, low_stock_threshold, category_id')
      .eq('id', body.productId)
      .is('deleted_at', null)
      .single();

    if (productError || !product) {
      return notFound('Product');
    }

    let category: string | undefined;
    if (product.category_id) {
      const { data: cat } = await supabase
        .from('categories')
        .select('name')
        .eq('id', product.category_id)
        .single();
      category = cat?.name;
    }

    lowStockProducts = [{
      name: product.name,
      sku: product.sku,
      currentStock: product.stock_quantity,
      threshold: product.low_stock_threshold,
      category,
    }];
  } else {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, stock_quantity, low_stock_threshold, category_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .lte('stock_quantity', 5)
      .order('stock_quantity', { ascending: true })
      .limit(50);

    if (productsError || !products || products.length === 0) {
      return success({ lowStockCount: 0 }, 200, 'No low stock products found');
    }

    const categoryIds = [...new Set(products.map((p: Record<string, unknown>) => p.category_id).filter(Boolean))];
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);

    const catMap: Record<string, string> = {};
    for (const cat of categories || []) {
      catMap[cat.id] = cat.name;
    }

    lowStockProducts = products.map((p: Record<string, unknown>) => ({
      name: p.name as string,
      sku: p.sku as string | null,
      currentStock: p.stock_quantity as number,
      threshold: p.low_stock_threshold as number,
      category: p.category_id ? catMap[p.category_id as string] : undefined,
    }));
  }

  if (lowStockProducts.length === 0) {
    return success({ lowStockCount: 0 }, 200, 'No low stock products found');
  }

  const emailData: LowStockAlertData = {
    products: lowStockProducts,
    adminUrl: `${frontendUrl}/admin/inventory`,
  };

  const emailHtml = renderLowStockAlertEmail(emailData);

  const result = await sendEmail(
    {
      to: adminEmails,
      subject: `Low Stock Alert — ${lowStockProducts.length} product(s) need restocking`,
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
      products: lowStockProducts.map((p) => ({
        name: p.name,
        sku: p.sku,
        stock: p.currentStock,
        threshold: p.threshold,
      })),
    },
    200,
    'Low stock alert email sent'
  );
});

Deno.serve(app.fetch);
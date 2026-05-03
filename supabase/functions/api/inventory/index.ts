import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, notFound, forbidden, paginated } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseClient, createSupabaseAdminClient, requireAuth, isAdmin } from '../../_shared/auth.ts';
import { idParamSchema, validateParams, validateBody } from '../../_shared/validation.ts';
import { z } from 'https://esm.sh/zod@3';
import type { AppEnv } from '../../_shared/types.ts';

const adjustInventorySchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  change: z.number().int(),
  reason: z.string().max(500).optional(),
});

const app = new Hono<AppEnv>();

app.use('*', cors());

app.post('/adjust', requireAuth(), async (c) => {
  const user = c.get('user');
  if (!isAdmin(user)) {
    return forbidden('Admin access required');
  }

  const body = await c.req.json();
  const parsed = adjustInventorySchema.safeParse(body);
  if (!parsed.success) {
    return error('Validation failed', 400, parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`));
  }

  const { productId, variantId, change, reason } = parsed.data;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id, name, stock_quantity, track_inventory')
    .eq('id', productId)
    .single();

  if (!product) {
    return notFound('Product');
  }

  let previousStock: number;
  let newStock: number;
  let changeType: string;

  if (variantId) {
    const { data: variant } = await supabaseAdmin
      .from('product_variants')
      .select('id, stock_quantity')
      .eq('id', variantId)
      .eq('product_id', productId)
      .single();

    if (!variant) {
      return notFound('Product variant');
    }

    previousStock = variant.stock_quantity;
    newStock = previousStock + change;

    if (newStock < 0) {
      return error('Insufficient stock for this adjustment', 400);
    }

    const { error: updateError } = await supabaseAdmin
      .from('product_variants')
      .update({ stock_quantity: newStock })
      .eq('id', variantId);

    if (updateError) {
      return error('Failed to update variant stock', 500);
    }

    changeType = change > 0 ? 'RESTOCK' : 'ADJUSTMENT';
  } else {
    previousStock = product.stock_quantity;
    newStock = previousStock + change;

    if (newStock < 0) {
      return error('Insufficient stock for this adjustment', 400);
    }

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', productId);

    if (updateError) {
      return error('Failed to update product stock', 500);
    }

    changeType = change > 0 ? 'RESTOCK' : 'ADJUSTMENT';
  }

  const { data: log, error: logError } = await supabaseAdmin
    .from('inventory_logs')
    .insert({
      product_id: productId,
      variant_id: variantId ?? null,
      change_type: changeType,
      quantity: Math.abs(change),
      previous_stock: previousStock,
      new_stock: newStock,
      reason: reason ?? null,
      performed_by: user.id,
    })
    .select()
    .single();

  if (logError) {
    console.error('Failed to create inventory log:', logError);
  }

  return success({
    productId,
    variantId: variantId ?? null,
    previousStock,
    newStock,
    change,
    log,
  });
});

app.get('/logs/:productId', requireAuth(), async (c) => {
  const user = c.get('user');
  if (!isAdmin(user)) {
    return forbidden('Admin access required');
  }

  const productId = c.req.param('productId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: logs, count, error: fetchError } = await supabaseAdmin
    .from('inventory_logs')
    .select('*', { count: 'exact' })
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (fetchError) {
    return error('Failed to fetch inventory logs', 500);
  }

  return paginated(logs ?? [], count ?? 0, page, limit);
});

Deno.serve(app.fetch);
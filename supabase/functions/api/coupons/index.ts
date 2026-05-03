import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, notFound, forbidden, paginated } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseClient, createSupabaseAdminClient, requireAuth, isAdmin } from '../../_shared/auth.ts';
import { validateCouponSchema, createCouponSchema, updateCouponSchema, couponFilterSchema, idParamSchema, validateBody, validateQuery, validateParams } from '../../_shared/validation.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.post('/validate', validateBody(validateCouponSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof validateCouponSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: coupon, error: fetchError } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', body.code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (fetchError || !coupon) {
    return error('Invalid coupon code', 404);
  }

  const now = new Date().toISOString();
  if (coupon.starts_at > now) {
    return error('Coupon is not yet active', 400);
  }

  if (coupon.expires_at < now) {
    return error('Coupon has expired', 400);
  }

  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return error('Coupon usage limit reached', 400);
  }

  if (coupon.min_order_amount && body.cartTotal < coupon.min_order_amount) {
    return error(`Minimum order amount is ${coupon.min_order_amount}`, 400);
  }

  let discountAmount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discountAmount = Math.round(body.cartTotal * coupon.value) / 100;
  } else {
    discountAmount = coupon.value;
  }

  if (coupon.max_discount && discountAmount > coupon.max_discount) {
    discountAmount = coupon.max_discount;
  }

  return success({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discountAmount,
    minOrderAmount: coupon.min_order_amount,
    maxDiscount: coupon.max_discount,
  });
});

app.post('/', requireAuth(), async (c) => {
  const user = c.get('user');
  if (!isAdmin(user)) {
    return forbidden('Admin access required');
  }

  const body = await c.req.json();
  const parsed = createCouponSchema.safeParse(body);
  if (!parsed.success) {
    return error('Validation failed', 400, parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`));
  }

  const data = parsed.data;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: coupon, error: insertError } = await supabaseAdmin
    .from('coupons')
    .insert({
      code: data.code.toUpperCase(),
      description: data.description ?? null,
      type: data.type,
      value: data.value,
      min_order_amount: data.minOrderAmount ?? null,
      max_discount: data.maxDiscount ?? null,
      usage_limit: data.usageLimit ?? null,
      per_user_limit: data.perUserLimit ?? null,
      starts_at: data.startsAt,
      expires_at: data.expiresAt,
    })
    .select()
    .single();

  if (insertError) {
    return error('Failed to create coupon', 400, [insertError.message]);
  }

  return success(coupon, 201);
});

app.put('/:id', requireAuth(), validateParams(idParamSchema), async (c) => {
  const user = c.get('user');
  if (!isAdmin(user)) {
    return forbidden('Admin access required');
  }

  const { id } = c.get('validatedParams') as { id: string };
  const body = await c.req.json();
  const parsed = updateCouponSchema.safeParse(body);
  if (!parsed.success) {
    return error('Validation failed', 400, parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`));
  }

  const data = parsed.data;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const updateData: Record<string, unknown> = {};
  if (data.code !== undefined) updateData.code = data.code.toUpperCase();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.value !== undefined) updateData.value = data.value;
  if (data.minOrderAmount !== undefined) updateData.min_order_amount = data.minOrderAmount;
  if (data.maxDiscount !== undefined) updateData.max_discount = data.maxDiscount;
  if (data.usageLimit !== undefined) updateData.usage_limit = data.usageLimit;
  if (data.perUserLimit !== undefined) updateData.per_user_limit = data.perUserLimit;
  if (data.startsAt !== undefined) updateData.starts_at = data.startsAt;
  if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { data: coupon, error: updateError } = await supabaseAdmin
    .from('coupons')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return error('Failed to update coupon', 400, [updateError.message]);
  }

  if (!coupon) {
    return notFound('Coupon');
  }

  return success(coupon);
});

app.get('/', requireAuth(), validateQuery(couponFilterSchema), async (c) => {
  const user = c.get('user');
  if (!isAdmin(user)) {
    return forbidden('Admin access required');
  }

  const query = c.get('validatedQuery') as z.infer<typeof couponFilterSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  let couponsQuery = supabaseAdmin
    .from('coupons')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (query.isActive !== undefined) {
    couponsQuery = couponsQuery.eq('is_active', query.isActive);
  }

  const from = (query.page - 1) * query.limit;
  const to = from + query.limit - 1;
  couponsQuery = couponsQuery.range(from, to);

  const { data: coupons, count, error: fetchError } = await couponsQuery;

  if (fetchError) {
    return error('Failed to fetch coupons', 500);
  }

  return paginated(coupons ?? [], count ?? 0, query.page, query.limit);
});

Deno.serve(app.fetch);
import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, notFound, forbidden, paginated } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseClient, createSupabaseAdminClient, requireAuth, isAdmin } from '../../_shared/auth.ts';
import { createReviewSchema, updateReviewSchema, reviewFilterSchema, idParamSchema, validateBody, validateQuery, validateParams } from '../../_shared/validation.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.get('/product/:productId', async (c) => {
  const productId = c.req.param('productId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  let reviewsQuery = supabase
    .from('reviews')
    .select('*, user:profiles(id, first_name, last_name)', { count: 'exact' })
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  reviewsQuery = reviewsQuery.range(from, to);

  const { data: reviews, count, error: fetchError } = await reviewsQuery;

  if (fetchError) {
    return error('Failed to fetch reviews', 500);
  }

  return paginated(reviews ?? [], count ?? 0, page, limit);
});

app.post('/', requireAuth(), validateBody(createReviewSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody') as z.infer<typeof createReviewSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', body.productId)
    .single();

  if (!product) {
    return notFound('Product');
  }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', body.productId)
    .maybeSingle();

  if (existing) {
    return error('You have already reviewed this product', 409);
  }

  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: review, error: insertError } = await supabaseAdmin
    .from('reviews')
    .insert({
      user_id: user.id,
      product_id: body.productId,
      rating: body.rating,
      title: body.title ?? null,
      comment: body.comment ?? null,
      is_approved: false,
    })
    .select()
    .single();

  if (insertError) {
    return error('Failed to create review', 400, [insertError.message]);
  }

  return success(review, 201);
});

app.put('/:id', requireAuth(), validateParams(idParamSchema), validateBody(updateReviewSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.get('validatedParams') as { id: string };
  const body = c.get('validatedBody') as z.infer<typeof updateReviewSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return notFound('Review');
  }

  if (existing.user_id !== user.id && !isAdmin(user)) {
    return forbidden('You can only edit your own reviews');
  }

  const updateData: Record<string, unknown> = {};
  if (body.rating !== undefined) updateData.rating = body.rating;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.comment !== undefined) updateData.comment = body.comment;
  updateData.is_approved = false;

  const { data: review, error: updateError } = await supabaseAdmin
    .from('reviews')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return error('Failed to update review', 400, [updateError.message]);
  }

  return success(review);
});

app.delete('/:id', requireAuth(), validateParams(idParamSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.get('validatedParams') as { id: string };
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return notFound('Review');
  }

  if (existing.user_id !== user.id && !isAdmin(user)) {
    return forbidden('You can only delete your own reviews');
  }

  const { error: deleteError } = await supabaseAdmin
    .from('reviews')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return error('Failed to delete review', 400);
  }

  return success({ message: 'Review deleted' });
});

Deno.serve(app.fetch);
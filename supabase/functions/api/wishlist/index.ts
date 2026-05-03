import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, notFound } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseClient, requireAuth } from '../../_shared/auth.ts';
import { addToWishlistSchema, validateBody } from '../../_shared/validation.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.get('/', requireAuth(), async (c) => {
  const user = c.get('user');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { data: wishlistItems, error: fetchError } = await supabase
    .from('wishlist_items')
    .select(`
      id,
      created_at,
      product:products(
        id,
        name,
        slug,
        base_price,
        sale_price,
        currency,
        is_active,
        images:product_images(id, url, alt_text, sort_order, is_primary)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (fetchError) {
    return error('Failed to fetch wishlist', 500);
  }

  return success(wishlistItems);
});

app.post('/items', requireAuth(), validateBody(addToWishlistSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody') as z.infer<typeof addToWishlistSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { data: product } = await supabase
    .from('products')
    .select('id, is_active')
    .eq('id', body.productId)
    .single();

  if (!product || !product.is_active) {
    return notFound('Product');
  }

  const { data: existing } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', body.productId)
    .maybeSingle();

  if (existing) {
    return error('Product already in wishlist', 409);
  }

  const { data: wishlistItem, error: insertError } = await supabase
    .from('wishlist_items')
    .insert({
      user_id: user.id,
      product_id: body.productId,
    })
    .select()
    .single();

  if (insertError) {
    return error('Failed to add product to wishlist', 400, [insertError.message]);
  }

  return success(wishlistItem, 201);
});

app.delete('/items/:productId', requireAuth(), async (c) => {
  const user = c.get('user');
  const productId = c.req.param('productId');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { error: deleteError } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId);

  if (deleteError) {
    return error('Failed to remove product from wishlist', 400);
  }

  return success({ message: 'Product removed from wishlist' });
});

Deno.serve(app.fetch);
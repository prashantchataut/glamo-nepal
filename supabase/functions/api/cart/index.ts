import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, notFound } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseClient, requireAuth } from '../../_shared/auth.ts';
import { addToCartSchema, updateCartItemSchema, idParamSchema, validateBody, validateParams } from '../../_shared/validation.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.get('/', requireAuth(), async (c) => {
  const user = c.get('user');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { data: cartItems, error: fetchError } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      created_at,
      updated_at,
      product:products(
        id,
        name,
        slug,
        base_price,
        sale_price,
        currency,
        is_active,
        images:product_images(id, url, alt_text, sort_order, is_primary)
      ),
      variant:product_variants(
        id,
        name,
        sku,
        price,
        sale_price,
        stock_quantity,
        is_active
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (fetchError) {
    return error('Failed to fetch cart items', 500);
  }

  return success(cartItems);
});

app.post('/items', requireAuth(), validateBody(addToCartSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody') as z.infer<typeof addToCartSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { data: product } = await supabase
    .from('products')
    .select('id, is_active, stock_quantity, track_inventory')
    .eq('id', body.productId)
    .single();

  if (!product || !product.is_active) {
    return notFound('Product');
  }

  if (product.track_inventory && product.stock_quantity < 1) {
    return error('Product is out of stock', 400);
  }

  if (body.variantId) {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('id, is_active, stock_quantity')
      .eq('id', body.variantId)
      .eq('product_id', body.productId)
      .single();

    if (!variant || !variant.is_active) {
      return notFound('Product variant');
    }

    if (variant.stock_quantity < 1) {
      return error('Variant is out of stock', 400);
    }
  }

  const existingFilter: Record<string, unknown> = {
    user_id: user.id,
    product_id: body.productId,
  };
  if (body.variantId) {
    existingFilter.variant_id = body.variantId;
  }

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .match(existingFilter)
    .maybeSingle();

  if (existing) {
    const newQuantity = existing.quantity + body.quantity;
    const { data: updated, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      return error('Failed to update cart item', 400);
    }

    return success(updated);
  }

  const { data: cartItem, error: insertError } = await supabase
    .from('cart_items')
    .insert({
      user_id: user.id,
      product_id: body.productId,
      variant_id: body.variantId ?? null,
      quantity: body.quantity,
    })
    .select()
    .single();

  if (insertError) {
    return error('Failed to add item to cart', 400, [insertError.message]);
  }

  return success(cartItem, 201);
});

app.put('/items/:id', requireAuth(), validateParams(idParamSchema), validateBody(updateCartItemSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.get('validatedParams') as { id: string };
  const body = c.get('validatedBody') as z.infer<typeof updateCartItemSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, product_id, variant_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!existing) {
    return notFound('Cart item');
  }

  const { data: product } = await supabase
    .from('products')
    .select('track_inventory, stock_quantity')
    .eq('id', existing.product_id)
    .single();

  if (product?.track_inventory && body.quantity > product.stock_quantity) {
    return error(`Only ${product.stock_quantity} items available`, 400);
  }

  if (existing.variant_id) {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', existing.variant_id)
      .single();

    if (variant && body.quantity > variant.stock_quantity) {
      return error(`Only ${variant.stock_quantity} items available`, 400);
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('cart_items')
    .update({ quantity: body.quantity, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return error('Failed to update cart item', 400);
  }

  return success(updated);
});

app.delete('/items/:id', requireAuth(), validateParams(idParamSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.get('validatedParams') as { id: string };
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { error: deleteError } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    return error('Failed to remove cart item', 400);
  }

  return success({ message: 'Cart item removed' });
});

app.delete('/', requireAuth(), async (c) => {
  const user = c.get('user');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { error: deleteError } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    return error('Failed to clear cart', 400);
  }

  return success({ message: 'Cart cleared' });
});

Deno.serve(app.fetch);
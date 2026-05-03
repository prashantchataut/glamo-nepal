import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseClient, createSupabaseAdminClient } from '../../_shared/auth.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.get('/', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const token = extractToken(c.req.raw);
  const sessionId = c.req.query('session_id') || c.req.header('X-Session-Id');
  const limit = parseInt(c.req.query('limit') || '10');

  let userId: string | null = null;

  if (token) {
    const user = await verifyUser(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, token);
    if (user) {
      userId = user.id;
    }
  }

  if (!userId && !sessionId) {
    return error('Authentication or session_id required', 401);
  }

  try {
    const { data, error: rpcError } = await supabaseAdmin.rpc('get_recommendations', {
      user_id_arg: userId,
      session_id_arg: sessionId ?? null,
      limit_arg: limit,
    });

    if (rpcError) {
      console.error('Recommendations RPC error:', rpcError);
      const { data: products, error: fallbackError } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, base_price, sale_price, currency, images:product_images(id, url, alt_text, is_primary)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        return error('Failed to get recommendations', 500);
      }

      return success(products);
    }

    return success(data);
  } catch {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, base_price, sale_price, currency, images:product_images(id, url, alt_text, is_primary)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    return success(products);
  }
});

app.get('/trending', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const limit = parseInt(c.req.query('limit') || '10');

  try {
    const { data, error: rpcError } = await supabaseAdmin.rpc('get_trending', {
      limit_arg: limit,
    });

    if (rpcError) {
      console.error('Trending RPC error:', rpcError);
      const { data: products, error: fallbackError } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, base_price, sale_price, currency, images:product_images(id, url, alt_text, is_primary)')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        return error('Failed to get trending products', 500);
      }

      return success(products);
    }

    return success(data);
  } catch {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, base_price, sale_price, currency, images:product_images(id, url, alt_text, is_primary)')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    return success(products);
  }
});

Deno.serve(app.fetch);
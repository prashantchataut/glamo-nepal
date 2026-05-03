import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { extractToken, verifyUser, createSupabaseAdminClient } from '../../_shared/auth.ts';
import { success, error, paginated, notFound, unauthorized, forbidden } from '../../_shared/response.ts';
import { ROLES } from '../../_shared/types.ts';
import {
  createBannerSchema,
  updateBannerSchema,
  bannerFilterSchema,
} from '../../_shared/validation.ts';

const app = new Hono();
app.use('*', cors());

app.get('/', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const query = c.req.query();
  const filterResult = bannerFilterSchema.safeParse(query);
  if (!filterResult.success) {
    const errors = filterResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const filter = filterResult.data;

  let dbQuery = client
    .from('banners')
    .select('id, title, subtitle, image_url, link_url, position, sort_order, is_active, starts_at, expires_at, created_at, updated_at', { count: 'exact' })
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (filter.position) dbQuery = dbQuery.eq('position', filter.position);

  const from = (filter.page - 1) * filter.limit;
  const to = from + filter.limit - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, count, error: dbError } = await dbQuery;
  if (dbError) return error(dbError.message, 500);

  return paginated(data ?? [], count ?? 0, filter.page, filter.limit);
});

app.post('/', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const body = await c.req.json();
  const result = createBannerSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const insertData: Record<string, unknown> = {
    title: result.data.title,
    subtitle: result.data.subtitle ?? null,
    image_url: result.data.imageUrl,
    link_url: result.data.linkUrl ?? null,
    position: result.data.position,
    sort_order: result.data.sortOrder,
    starts_at: result.data.startsAt ?? null,
    expires_at: result.data.expiresAt ?? null,
  };

  const { data, error: dbError } = await adminClient
    .from('banners')
    .insert(insertData)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  return success(data, 201);
});

app.put('/:id', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const { id } = c.req.param();
  const body = await c.req.json();
  const result = updateBannerSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const updateData: Record<string, unknown> = {};
  if (result.data.title !== undefined) updateData.title = result.data.title;
  if (result.data.subtitle !== undefined) updateData.subtitle = result.data.subtitle;
  if (result.data.imageUrl !== undefined) updateData.image_url = result.data.imageUrl;
  if (result.data.linkUrl !== undefined) updateData.link_url = result.data.linkUrl;
  if (result.data.position !== undefined) updateData.position = result.data.position;
  if (result.data.sortOrder !== undefined) updateData.sort_order = result.data.sortOrder;
  if (result.data.isActive !== undefined) updateData.is_active = result.data.isActive;
  if (result.data.startsAt !== undefined) updateData.starts_at = result.data.startsAt;
  if (result.data.expiresAt !== undefined) updateData.expires_at = result.data.expiresAt;

  const { data, error: dbError } = await adminClient
    .from('banners')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Banner');

  return success(data);
});

app.delete('/:id', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  if (!token) return unauthorized('No token provided');

  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);
  if (!user) return unauthorized('Invalid or expired token');
  if (user.role !== ROLES.STAFF && user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
    return forbidden('Insufficient permissions');
  }

  const { id } = c.req.param();
  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);

  const { error: dbError } = await adminClient
    .from('banners')
    .delete()
    .eq('id', id);

  if (dbError) return error(dbError.message, 500);

  return success({ message: 'Banner deleted' });
});

Deno.serve(app.fetch);
import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { extractToken, verifyUser, createSupabaseAdminClient } from '../../_shared/auth.ts';
import { success, error, paginated, notFound, unauthorized, forbidden } from '../../_shared/response.ts';
import { ROLES } from '../../_shared/types.ts';
import {
  brandFilterSchema,
  createBrandSchema,
  updateBrandSchema,
  paginationSchema,
} from '../../_shared/validation.ts';

const app = new Hono();
app.use('*', cors());

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

app.get('/', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const query = c.req.query();
  const filterResult = brandFilterSchema.safeParse(query);
  const pageResult = paginationSchema.safeParse(query);

  let filterParams: Record<string, unknown> = {};
  if (filterResult.success) filterParams = filterResult.data;
  let pageParams = { page: 1, perPage: 20 };
  if (pageResult.success) pageParams = pageResult.data;

  let dbQuery = client
    .from('brands')
    .select('id, name, slug, description, logo_url, website, is_active, created_at, updated_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if ('isActive' in filterParams && filterParams.isActive !== undefined) {
    dbQuery = dbQuery.eq('is_active', filterParams.isActive as boolean);
  }

  const from = (pageParams.page - 1) * pageParams.perPage;
  const to = from + pageParams.perPage - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, count, error: dbError } = await dbQuery;
  if (dbError) return error(dbError.message, 500);

  return paginated(data ?? [], count ?? 0, pageParams.page, pageParams.perPage);
});

app.get('/:slug', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const { slug } = c.req.param();
  const { data, error: dbError } = await client
    .from('brands')
    .select('id, name, slug, description, logo_url, website, is_active, created_at, updated_at')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  if (dbError || !data) return notFound('Brand');

  return success(data);
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
  const result = createBrandSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const insertData: Record<string, unknown> = {
    name: result.data.name,
    slug: slugify(result.data.name),
    description: result.data.description ?? null,
    logo_url: result.data.logoUrl ?? null,
    website: result.data.website ?? null,
  };

  const { data, error: dbError } = await adminClient
    .from('brands')
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
  const result = updateBrandSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const updateData: Record<string, unknown> = {};
  if (result.data.name !== undefined) {
    updateData.name = result.data.name;
    updateData.slug = slugify(result.data.name);
  }
  if (result.data.description !== undefined) updateData.description = result.data.description;
  if (result.data.logoUrl !== undefined) updateData.logo_url = result.data.logoUrl;
  if (result.data.website !== undefined) updateData.website = result.data.website;

  const { data, error: dbError } = await adminClient
    .from('brands')
    .update(updateData)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Brand');

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

  const { data, error: dbError } = await adminClient
    .from('brands')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Brand');

  return success({ message: 'Brand deleted' });
});

Deno.serve(app.fetch);
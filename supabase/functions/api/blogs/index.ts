import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { extractToken, verifyUser, createSupabaseAdminClient } from '../../_shared/auth.ts';
import { success, error, paginated, notFound, unauthorized, forbidden } from '../../_shared/response.ts';
import { ROLES } from '../../_shared/types.ts';
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  blogFilterSchema,
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
  const filterResult = blogFilterSchema.safeParse(query);
  if (!filterResult.success) {
    const errors = filterResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const filter = filterResult.data;

  let dbQuery = client
    .from('blogs')
    .select('id, title, slug, excerpt, cover_image_url, category, tags, view_count, read_time_minutes, is_published, published_at, author_id, created_at, updated_at', { count: 'exact' })
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  if (filter.category) dbQuery = dbQuery.eq('category', filter.category);

  const from = (filter.page - 1) * filter.limit;
  const to = from + filter.limit - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, count, error: dbError } = await dbQuery;
  if (dbError) return error(dbError.message, 500);

  return paginated(data ?? [], count ?? 0, filter.page, filter.limit);
});

app.get('/:slug', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const { slug } = c.req.param();
  const { data, error: dbError } = await client
    .from('blogs')
    .select('id, title, slug, excerpt, content, cover_image_url, category, meta_title, meta_description, tags, view_count, read_time_minutes, is_published, published_at, author_id, created_at, updated_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .is('deleted_at', null)
    .single();

  if (dbError || !data) return notFound('Blog');

  const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  await adminClient.rpc('increment_view_count', { table_name: 'blogs', row_id: data.id }).catch(() => {});

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
  const result = createBlogPostSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const insertData: Record<string, unknown> = {
    title: result.data.title,
    slug: slugify(result.data.title),
    excerpt: result.data.excerpt ?? null,
    content: result.data.content,
    category: result.data.category ?? null,
    meta_title: result.data.metaTitle ?? null,
    meta_description: result.data.metaDescription ?? null,
    tags: result.data.tags ?? [],
    author_id: user.id,
  };

  const { data, error: dbError } = await adminClient
    .from('blogs')
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
  const result = updateBlogPostSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const updateData: Record<string, unknown> = {};
  if (result.data.title !== undefined) {
    updateData.title = result.data.title;
    updateData.slug = slugify(result.data.title);
  }
  if (result.data.excerpt !== undefined) updateData.excerpt = result.data.excerpt;
  if (result.data.content !== undefined) updateData.content = result.data.content;
  if (result.data.category !== undefined) updateData.category = result.data.category;
  if (result.data.metaTitle !== undefined) updateData.meta_title = result.data.metaTitle;
  if (result.data.metaDescription !== undefined) updateData.meta_description = result.data.metaDescription;
  if (result.data.tags !== undefined) updateData.tags = result.data.tags;
  if (result.data.isPublished !== undefined) {
    updateData.is_published = result.data.isPublished;
    if (result.data.isPublished && !updateData.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data, error: dbError } = await adminClient
    .from('blogs')
    .update(updateData)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Blog');

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
    .from('blogs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Blog');

  return success({ message: 'Blog deleted' });
});

Deno.serve(app.fetch);
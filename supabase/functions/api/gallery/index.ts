import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { extractToken, verifyUser, createSupabaseAdminClient } from '../../_shared/auth.ts';
import { success, error, notFound, unauthorized, forbidden } from '../../_shared/response.ts';
import { ROLES } from '../../_shared/types.ts';
import { z } from 'https://esm.sh/zod@3';

const app = new Hono();
app.use('*', cors());

const createGalleryItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url(),
  category: z.enum(['instagram', 'store', 'products', 'team']).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const updateGalleryItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  category: z.enum(['instagram', 'store', 'products', 'team']).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

app.get('/', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error: dbError } = await client
    .from('gallery_items')
    .select('id, title, description, image_url, category, sort_order, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (dbError) return error(dbError.message, 500);

  return success(data ?? []);
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
  const result = createGalleryItemSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const insertData: Record<string, unknown> = {
    title: result.data.title,
    description: result.data.description ?? null,
    image_url: result.data.imageUrl,
    category: result.data.category ?? null,
    sort_order: result.data.sortOrder,
    is_active: result.data.isActive,
  };

  const { data, error: dbError } = await adminClient
    .from('gallery_items')
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
  const result = updateGalleryItemSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const updateData: Record<string, unknown> = {};
  if (result.data.title !== undefined) updateData.title = result.data.title;
  if (result.data.description !== undefined) updateData.description = result.data.description;
  if (result.data.imageUrl !== undefined) updateData.image_url = result.data.imageUrl;
  if (result.data.category !== undefined) updateData.category = result.data.category;
  if (result.data.sortOrder !== undefined) updateData.sort_order = result.data.sortOrder;
  if (result.data.isActive !== undefined) updateData.is_active = result.data.isActive;

  const { data, error: dbError } = await adminClient
    .from('gallery_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Gallery item');

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
    .from('gallery_items')
    .delete()
    .eq('id', id);

  if (dbError) return error(dbError.message, 500);

  return success({ message: 'Gallery item deleted' });
});

Deno.serve(app.fetch);
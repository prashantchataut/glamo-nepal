import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { extractToken, verifyUser, createSupabaseAdminClient } from '../../_shared/auth.ts';
import { success, error, notFound, unauthorized, forbidden } from '../../_shared/response.ts';
import { ROLES } from '../../_shared/types.ts';
import { z } from 'https://esm.sh/zod@3';

const app = new Hono();
app.use('*', cors());

const createTeamMemberSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  bio: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const updateTeamMemberSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.string().min(1).max(200).optional(),
  bio: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

app.get('/', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error: dbError } = await client
    .from('team_members')
    .select('id, name, role, bio, image_url, sort_order, is_active, created_at, updated_at')
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
  const result = createTeamMemberSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const insertData: Record<string, unknown> = {
    name: result.data.name,
    role: result.data.role,
    bio: result.data.bio ?? null,
    image_url: result.data.imageUrl ?? null,
    sort_order: result.data.sortOrder,
    is_active: result.data.isActive,
  };

  const { data, error: dbError } = await adminClient
    .from('team_members')
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
  const result = updateTeamMemberSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const updateData: Record<string, unknown> = {};
  if (result.data.name !== undefined) updateData.name = result.data.name;
  if (result.data.role !== undefined) updateData.role = result.data.role;
  if (result.data.bio !== undefined) updateData.bio = result.data.bio;
  if (result.data.imageUrl !== undefined) updateData.image_url = result.data.imageUrl;
  if (result.data.sortOrder !== undefined) updateData.sort_order = result.data.sortOrder;
  if (result.data.isActive !== undefined) updateData.is_active = result.data.isActive;

  const { data, error: dbError } = await adminClient
    .from('team_members')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Team member');

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
    .from('team_members')
    .delete()
    .eq('id', id);

  if (dbError) return error(dbError.message, 500);

  return success({ message: 'Team member deleted' });
});

Deno.serve(app.fetch);
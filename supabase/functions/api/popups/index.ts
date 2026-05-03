import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { extractToken, verifyUser, createSupabaseAdminClient } from '../../_shared/auth.ts';
import { success, error, notFound, unauthorized, forbidden } from '../../_shared/response.ts';
import { ROLES } from '../../_shared/types.ts';
import { z } from 'https://esm.sh/zod@3';

const app = new Hono();
app.use('*', cors());

const createPopupSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  triggerType: z.enum(['ON_LOAD', 'EXIT_INTENT', 'SCROLL_50', 'TIME_DELAY']).default('ON_LOAD'),
  delayMs: z.number().int().min(0).default(0),
  cookieDays: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

const updatePopupSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  triggerType: z.enum(['ON_LOAD', 'EXIT_INTENT', 'SCROLL_50', 'TIME_DELAY']).optional(),
  delayMs: z.number().int().min(0).optional(),
  cookieDays: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

app.get('/active', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const now = new Date().toISOString();
  const { data, error: dbError } = await client
    .from('popups')
    .select('id, title, content, image_url, link_url, trigger_type, delay_ms, cookie_days, starts_at, expires_at')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gte.${now}`);

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
  const result = createPopupSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const insertData: Record<string, unknown> = {
    title: result.data.title,
    content: result.data.content,
    image_url: result.data.imageUrl ?? null,
    link_url: result.data.linkUrl ?? null,
    trigger_type: result.data.triggerType,
    delay_ms: result.data.delayMs,
    cookie_days: result.data.cookieDays ?? null,
    is_active: result.data.isActive,
    starts_at: result.data.startsAt ?? null,
    expires_at: result.data.expiresAt ?? null,
  };

  const { data, error: dbError } = await adminClient
    .from('popups')
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
  const result = updatePopupSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const updateData: Record<string, unknown> = {};
  if (result.data.title !== undefined) updateData.title = result.data.title;
  if (result.data.content !== undefined) updateData.content = result.data.content;
  if (result.data.imageUrl !== undefined) updateData.image_url = result.data.imageUrl;
  if (result.data.linkUrl !== undefined) updateData.link_url = result.data.linkUrl;
  if (result.data.triggerType !== undefined) updateData.trigger_type = result.data.triggerType;
  if (result.data.delayMs !== undefined) updateData.delay_ms = result.data.delayMs;
  if (result.data.cookieDays !== undefined) updateData.cookie_days = result.data.cookieDays;
  if (result.data.isActive !== undefined) updateData.is_active = result.data.isActive;
  if (result.data.startsAt !== undefined) updateData.starts_at = result.data.startsAt;
  if (result.data.expiresAt !== undefined) updateData.expires_at = result.data.expiresAt;

  const { data, error: dbError } = await adminClient
    .from('popups')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return notFound('Popup');

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
    .from('popups')
    .delete()
    .eq('id', id);

  if (dbError) return error(dbError.message, 500);

  return success({ message: 'Popup deleted' });
});

Deno.serve(app.fetch);
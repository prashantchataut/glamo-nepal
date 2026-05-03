import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { extractToken, verifyUser, createSupabaseAdminClient } from '../../_shared/auth.ts';
import { success, error, notFound, unauthorized, forbidden } from '../../_shared/response.ts';
import { ROLES } from '../../_shared/types.ts';
import { updateSettingsSchema } from '../../_shared/validation.ts';

const app = new Hono();
app.use('*', cors());

app.get('/', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error: dbError } = await client
    .from('site_settings')
    .select('id, key, value, group_name, created_at, updated_at')
    .order('group_name', { ascending: true });

  if (dbError) return error(dbError.message, 500);

  return success(data ?? []);
});

app.get('/:key', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const { key } = c.req.param();
  const { data, error: dbError } = await client
    .from('site_settings')
    .select('id, key, value, group_name, created_at, updated_at')
    .eq('key', key)
    .single();

  if (dbError || !data) return notFound('Setting');

  return success(data);
});

app.put('/', async (c) => {
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
  const result = updateSettingsSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
  const updated: Record<string, unknown>[] = [];

  for (const setting of result.data.settings) {
    const { data, error: dbError } = await adminClient
      .from('site_settings')
      .update({ value: setting.value })
      .eq('key', setting.key)
      .select()
      .single();

    if (dbError) {
      return error(`Failed to update setting "${setting.key}": ${dbError.message}`, 500);
    }
    if (data) updated.push(data);
  }

  return success(updated);
});

Deno.serve(app.fetch);
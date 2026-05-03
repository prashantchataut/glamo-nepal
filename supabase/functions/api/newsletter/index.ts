import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error } from '../../_shared/response.ts';
import { subscribeSchema } from '../../_shared/validation.ts';

const app = new Hono();
app.use('*', cors());

app.post('/subscribe', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const body = await c.req.json();
  const result = subscribeSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return error('Validation failed', 400, errors);
  }

  const { data: existing } = await adminClient
    .from('newsletter_subscribers')
    .select('id, is_active, unsubscribe_token')
    .eq('email', result.data.email)
    .single();

  if (existing) {
    if (existing.is_active) {
      return success({ message: 'Already subscribed' });
    }
    const { data, error: dbError } = await adminClient
      .from('newsletter_subscribers')
      .update({
        is_active: true,
        unsubscribed_at: null,
        subscribed_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (dbError) return error(dbError.message, 500);
    return success(data);
  }

  const { data, error: dbError } = await adminClient
    .from('newsletter_subscribers')
    .insert({
      email: result.data.email,
      is_active: true,
      subscribed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  return success(data, 201);
});

app.post('/unsubscribe', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey);

  const body = await c.req.json();
  if (!body.token) return error('Unsubscribe token is required', 400);

  const { data, error: dbError } = await client
    .from('newsletter_subscribers')
    .update({
      is_active: false,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('unsubscribe_token', body.token)
    .eq('is_active', true)
    .select()
    .single();

  if (dbError) return error(dbError.message, 500);
  if (!data) return error('Invalid or expired unsubscribe token', 404);

  return success({ message: 'Successfully unsubscribed' });
});

Deno.serve(app.fetch);
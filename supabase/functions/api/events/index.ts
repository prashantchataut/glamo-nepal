import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseClient, createSupabaseAdminClient } from '../../_shared/auth.ts';
import { trackEventsBatchSchema, validateBody } from '../../_shared/validation.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.post('/track', validateBody(trackEventsBatchSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof trackEventsBatchSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = extractToken(c.req.raw);
  let userId: string | null = null;

  if (token) {
    const user = await verifyUser(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, token);
    if (user) {
      userId = user.id;
    }
  }

  const sessionId = c.req.header('X-Session-Id') || crypto.randomUUID();
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const events = body.events.map((event) => ({
    user_id: userId,
    session_id: sessionId,
    event_type: event.eventType,
    entity_id: event.entityId ?? null,
    metadata: event.metadata ?? {},
  }));

  const { data, error: insertError } = await supabaseAdmin
    .from('events')
    .insert(events)
    .select();

  if (insertError) {
    console.error('Event tracking error:', insertError);
    return error('Failed to track events', 500);
  }

  try {
    await supabaseAdmin.rpc('track_events', { events_data: events });
  } catch (rpcError) {
    console.error('RPC track_events error:', rpcError);
  }

  return success({ tracked: data?.length ?? 0, sessionId }, 200, 'Events tracked');
});

Deno.serve(app.fetch);
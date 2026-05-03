import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createSupabaseAdminClient } from '../../_shared/auth.ts';
import { sendEmail, welcomeTemplate } from '../../_shared/email.ts';
import { success, error, notFound } from '../../_shared/response.ts';

const app = new Hono();

app.use('*', cors());

app.post('/', async (c) => {
  const body = await c.req.json<{ userId: string }>();

  if (!body?.userId) {
    return error('userId is required', 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
  const supabase = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', body.userId)
    .single();

  if (profileError || !profile) {
    return notFound('User profile');
  }

  const recipientEmail = profile.email;
  if (!recipientEmail) {
    return error('User has no email address', 400);
  }

  const emailHtml = welcomeTemplate(profile.full_name ?? 'there');

  const result = await sendEmail(
    {
      to: recipientEmail,
      subject: 'Welcome to GLAMO Nepal!',
      html: emailHtml,
    },
    resendApiKey
  );

  if (!result.success) {
    return error('Failed to send welcome email', 500, [result.error ?? '']);
  }

  return success({ emailId: result.id }, 200, 'Welcome email sent');
});

Deno.serve(app.fetch);
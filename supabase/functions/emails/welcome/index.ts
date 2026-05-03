import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createSupabaseAdminClient } from '../../_shared/auth.ts';
import { sendEmail } from '../../_shared/email.ts';
import { renderWelcomeEmail } from '../../_shared/email-templates/welcome.ts';
import type { WelcomeEmailData } from '../../_shared/email-templates/welcome.ts';
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
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://glamonepal.com';
  const supabase = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('id', body.userId)
    .single();

  if (profileError || !profile) {
    return notFound('User profile');
  }

  if (!profile.email) {
    return error('User has no email address', 400);
  }

  const customerName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'there';

  const emailData: WelcomeEmailData = {
    customerName,
    shopUrl: `${frontendUrl}/shop`,
  };

  const emailHtml = renderWelcomeEmail(emailData);

  const result = await sendEmail(
    {
      to: profile.email,
      subject: `Welcome to GLAMO Nepal, ${customerName}!`,
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
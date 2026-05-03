import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, unauthorized } from '../../_shared/response.ts';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, validateBody } from '../../_shared/validation.ts';
import { extractToken, verifyUser, createSupabaseClient, createSupabaseAdminClient } from '../../_shared/auth.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.post('/register', validateBody(registerSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof registerSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
    email: body.email,
    password: body.password,
  });

  if (authError) {
    return error(authError.message, 400);
  }

  if (!authData.user) {
    return error('Failed to create user', 500);
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      first_name: body.firstName ?? null,
      last_name: body.lastName ?? null,
      phone: body.phone ?? null,
    })
    .eq('id', authData.user.id);

  if (profileError) {
    console.error('Failed to update profile:', profileError);
  }

  return success({
    user: {
      id: authData.user.id,
      email: authData.user.email,
    },
    message: authData.session
      ? 'Registration successful'
      : 'Please check your email to verify your account',
  }, 201, 'Registration successful');
});

app.post('/login', validateBody(loginSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof loginSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (authError) {
    return unauthorized(authError.message === 'Invalid login credentials'
      ? 'Invalid email or password'
      : authError.message);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single();

  if (!profile || !profile.is_active) {
    return unauthorized('Account is deactivated');
  }

  return success({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    user: {
      id: data.user.id,
      email: data.user.email,
      role: profile.role,
    },
  });
});

app.post('/logout', async (c) => {
  const token = extractToken(c.req.raw);
  if (!token) {
    return success({ message: 'Logged out' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  await supabase.auth.signOut();

  return success({ message: 'Logged out successfully' });
});

app.post('/reset-password', validateBody(forgotPasswordSchema), async (c) => {
  const body = c.get('validatedBody') as z.infer<typeof forgotPasswordSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://glamonepal.com';

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(body.email, {
    redirectTo: `${frontendUrl}/auth/reset-password`,
  });

  if (resetError) {
    return error(resetError.message, 400);
  }

  return success({ message: 'Password reset email sent' });
});

app.post('/update-password', async (c) => {
  const token = extractToken(c.req.raw);
  if (!token) {
    return unauthorized('No token provided');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);

  if (!user) {
    return unauthorized('Invalid or expired token');
  }

  let body: { password?: string };
  try {
    body = await c.req.json();
  } catch {
    return error('Invalid request body', 400);
  }

  if (!body.password || body.password.length < 8) {
    return error('Password must be at least 8 characters', 400);
  }

  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data, error: updateError } = await supabaseAdmin.auth.updateUserById(
    user.id,
    { password: body.password }
  );

  if (updateError) {
    return error(updateError.message, 400);
  }

  return success({ message: 'Password updated successfully' });
});

Deno.serve(app.fetch);
import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, notFound, unauthorized, forbidden } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseClient, createSupabaseAdminClient, requireAuth } from '../../_shared/auth.ts';
import { updateProfileSchema, createAddressSchema, updateAddressSchema, idParamSchema, validateBody, validateParams } from '../../_shared/validation.ts';
import { ROLES } from '../../_shared/types.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.get('/profile', requireAuth(), async (c) => {
  const user = c.get('user');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return notFound('Profile');
  }

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);

  return success({
    ...profile,
    email: authUser?.user?.email ?? null,
  });
});

app.put('/profile', requireAuth(), validateBody(updateProfileSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody') as z.infer<typeof updateProfileSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const updateData: Record<string, unknown> = {};
  if (body.firstName !== undefined) updateData.first_name = body.firstName;
  if (body.lastName !== undefined) updateData.last_name = body.lastName;
  if (body.phone !== undefined) updateData.phone = body.phone;

  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) {
    return error('Failed to update profile', 400, [updateError.message]);
  }

  return success(profile);
});

app.get('/addresses', requireAuth(), async (c) => {
  const user = c.get('user');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { data: addresses, error: fetchError } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (fetchError) {
    return error('Failed to fetch addresses', 500);
  }

  return success(addresses);
});

app.post('/addresses', requireAuth(), validateBody(createAddressSchema), async (c) => {
  const user = c.get('user');
  const body = c.get('validatedBody') as z.infer<typeof createAddressSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  if (body.isDefault) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true);
  }

  const { data: address, error: insertError } = await supabase
    .from('user_addresses')
    .insert({
      user_id: user.id,
      label: body.label ?? null,
      full_name: body.fullName,
      phone: body.phone,
      address_1: body.address1,
      address_2: body.address2 ?? null,
      city: body.city,
      district: body.district ?? null,
      province: body.province ?? null,
      postal_code: body.postalCode ?? null,
      country: body.country ?? 'Nepal',
      is_default: body.isDefault ?? false,
    })
    .select()
    .single();

  if (insertError) {
    return error('Failed to create address', 400, [insertError.message]);
  }

  return success(address, 201);
});

app.put('/addresses/:id', requireAuth(), validateParams(idParamSchema), validateBody(updateAddressSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.get('validatedParams') as { id: string };
  const body = c.get('validatedBody') as z.infer<typeof updateAddressSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { data: existing } = await supabase
    .from('user_addresses')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!existing) {
    return notFound('Address');
  }

  if (body.isDefault) {
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true);
  }

  const updateData: Record<string, unknown> = {};
  if (body.label !== undefined) updateData.label = body.label;
  if (body.fullName !== undefined) updateData.full_name = body.fullName;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.address1 !== undefined) updateData.address_1 = body.address1;
  if (body.address2 !== undefined) updateData.address_2 = body.address2;
  if (body.city !== undefined) updateData.city = body.city;
  if (body.district !== undefined) updateData.district = body.district;
  if (body.province !== undefined) updateData.province = body.province;
  if (body.postalCode !== undefined) updateData.postal_code = body.postalCode;
  if (body.country !== undefined) updateData.country = body.country;
  if (body.isDefault !== undefined) updateData.is_default = body.isDefault;

  const { data: address, error: updateError } = await supabase
    .from('user_addresses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return error('Failed to update address', 400, [updateError.message]);
  }

  return success(address);
});

app.delete('/addresses/:id', requireAuth(), validateParams(idParamSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.get('validatedParams') as { id: string };
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const token = extractToken(c.req.raw)!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { error: deleteError } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    return error('Failed to delete address', 400);
  }

  return success({ message: 'Address deleted' });
});

Deno.serve(app.fetch);
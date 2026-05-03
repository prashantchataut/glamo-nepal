import { Hono } from 'https://esm.sh/hono@4.7.4';
import { cors } from 'https://esm.sh/hono/cors@4.7.4';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { success, error, forbidden, paginated } from '../../_shared/response.ts';
import { extractToken, verifyUser, createSupabaseClient, createSupabaseAdminClient, requireAuth, isAdmin } from '../../_shared/auth.ts';
import { userFilterSchema, updateUserRoleSchema, auditLogFilterSchema, validateBody, validateQuery } from '../../_shared/validation.ts';
import type { AppEnv } from '../../_shared/types.ts';

const app = new Hono<AppEnv>();

app.use('*', cors());

app.get('/dashboard/stats', requireAuth(), async (c) => {
  const user = c.get('user');
  if (!isAdmin(user)) {
    return forbidden('Admin access required');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const [ordersResult, productsResult, usersResult] = await Promise.all([
    supabaseAdmin.from('orders').select('total_amount, status', { count: 'exact' }),
    supabaseAdmin.from('products').select('id, stock_quantity, low_stock_threshold, is_active', { count: 'exact' }).eq('is_active', true),
    supabaseAdmin.from('profiles').select('id', { count: 'exact' }),
  ]);

  const totalRevenue = (ordersResult.data ?? []).reduce((sum: number, o: { total_amount: number }) => sum + o.total_amount, 0);
  const totalOrders = ordersResult.count ?? 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const lowStockProducts = (productsResult.data ?? []).filter(
    (p: { stock_quantity: number; low_stock_threshold: number }) => p.stock_quantity <= p.low_stock_threshold
  );

  const { data: topProducts } = await supabaseAdmin
    .from('order_items')
    .select('product_id, product_name, quantity, total_price')
    .order('quantity', { ascending: false })
    .limit(10);

  return success({
    totalRevenue,
    totalOrders,
    avgOrderValue,
    totalProducts: productsResult.count ?? 0,
    totalUsers: usersResult.count ?? 0,
    lowStockProducts: lowStockProducts.length,
    lowStockItems: lowStockProducts.slice(0, 20),
    topProducts: topProducts ?? [],
  });
});

app.get('/dashboard/recent-orders', requireAuth(), async (c) => {
  const user = c.get('user');
  if (!isAdmin(user)) {
    return forbidden('Admin access required');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: orders, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, status, payment_status, total_amount, created_at, user:profiles(id, first_name, last_name, email)')
    .order('created_at', { ascending: false })
    .limit(20);

  if (fetchError) {
    return error('Failed to fetch recent orders', 500);
  }

  return success(orders);
});

app.get('/users', requireAuth(), validateQuery(userFilterSchema), async (c) => {
  const user = c.get('user');
  if (!isAdmin(user)) {
    return forbidden('Admin access required');
  }

  const query = c.get('validatedQuery') as z.infer<typeof userFilterSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  let usersQuery = supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (query.search) {
    usersQuery = usersQuery.or(`first_name.ilike.%${query.search}%,last_name.ilike.%${query.search}%,phone.ilike.%${query.search}%`);
  }

  if (query.role) {
    usersQuery = usersQuery.eq('role', query.role);
  }

  if (query.isActive !== undefined) {
    usersQuery = usersQuery.eq('is_active', query.isActive);
  }

  const from = (query.page - 1) * query.limit;
  const to = from + query.limit - 1;
  usersQuery = usersQuery.range(from, to);

  const { data: profiles, count, error: fetchError } = await usersQuery;

  if (fetchError) {
    return error('Failed to fetch users', 500);
  }

  const enrichedProfiles = await Promise.all(
    (profiles ?? []).map(async (profile: Record<string, unknown>) => {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id as string);
      return {
        ...profile,
        email: authUser?.user?.email ?? null,
      };
    })
  );

  return paginated(enrichedProfiles, count ?? 0, query.page, query.limit);
});

app.put('/users/:id/role', requireAuth(), validateBody(updateUserRoleSchema), async (c) => {
  const currentUser = c.get('user');
  if (!isAdmin(currentUser)) {
    return forbidden('Admin access required');
  }

  const targetUserId = c.req.param('id');
  const body = c.get('validatedBody') as z.infer<typeof updateUserRoleSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', targetUserId)
    .single();

  if (!targetProfile) {
    return error('User not found', 404);
  }

  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ role: body.role })
    .eq('id', targetUserId)
    .select()
    .single();

  if (updateError) {
    return error('Failed to update user role', 400, [updateError.message]);
  }

  await supabaseAdmin
    .from('audit_logs')
    .insert({
      user_id: currentUser.id,
      action: 'UPDATE_ROLE',
      entity: 'profiles',
      entity_id: targetUserId,
      changes: { old_role: targetProfile.role, new_role: body.role },
    });

  return success(updatedProfile);
});

app.get('/audit-logs', requireAuth(), validateQuery(auditLogFilterSchema), async (c) => {
  const user = c.get('user');
  if (!isAdmin(user)) {
    return forbidden('Admin access required');
  }

  const query = c.get('validatedQuery') as z.infer<typeof auditLogFilterSchema>;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceRoleKey);

  let logsQuery = supabaseAdmin
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (query.entity) logsQuery = logsQuery.eq('entity', query.entity);
  if (query.entityId) logsQuery = logsQuery.eq('entity_id', query.entityId);
  if (query.userId) logsQuery = logsQuery.eq('user_id', query.userId);

  const from = (query.page - 1) * query.limit;
  const to = from + query.limit - 1;
  logsQuery = logsQuery.range(from, to);

  const { data: logs, count, error: fetchError } = await logsQuery;

  if (fetchError) {
    return error('Failed to fetch audit logs', 500);
  }

  return paginated(logs ?? [], count ?? 0, query.page, query.limit);
});

Deno.serve(app.fetch);
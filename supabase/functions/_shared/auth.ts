import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Context, Next } from 'https://esm.sh/hono@4';
import type { AppEnv, AuthenticatedUser, Role } from './types.ts';
import { ROLES } from './types.ts';
import { unauthorized, forbidden } from './response.ts';

export function createSupabaseClient(url: string, anonKey: string, token: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseAdminClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export function extractTokenFromCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)__Host-access_token=([^;]+)/);
  return match?.[1] ?? null;
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  const fromAuth = extractTokenFromHeader(authHeader);
  if (fromAuth) return fromAuth;

  const cookieHeader = request.headers.get('Cookie');
  return extractTokenFromCookie(cookieHeader);
}

export async function verifyUser(
  supabaseUrl: string,
  supabaseAnonKey: string,
  token: string
): Promise<AuthenticatedUser | null> {
  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, token);

  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_active) return null;

  return {
    id: profile.id,
    email: user.email ?? '',
    role: profile.role as Role,
    isActive: profile.is_active,
  };
}

export function hasRole(user: AuthenticatedUser, minimumRole: Role): boolean {
  const hierarchy: Record<Role, number> = {
    CUSTOMER: 0,
    STAFF: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  };
  return (hierarchy[user.role] ?? -1) >= (hierarchy[minimumRole] ?? 0);
}

export function isStaff(user: AuthenticatedUser): boolean {
  return hasRole(user, ROLES.STAFF);
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return hasRole(user, ROLES.ADMIN);
}

export function isSuperAdmin(user: AuthenticatedUser): boolean {
  return hasRole(user, ROLES.SUPER_ADMIN);
}

export function requireAuth() {
  return async (c: Context<AppEnv>, next: Next) => {
    const token = extractToken(c.req.raw);
    if (!token) {
      return unauthorized('No token provided');
    }

    const supabaseUrl = c.env.SUPABASE_URL;
    const supabaseAnonKey = c.env.SUPABASE_ANON_KEY;
    const user = await verifyUser(supabaseUrl, supabaseAnonKey, token);

    if (!user) {
      return unauthorized('Invalid or expired token');
    }

    c.set('user', user);
    await next();
  };
}

export function requireRole(minimumRole: Role) {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return unauthorized('Authentication required');
    }

    if (!hasRole(user, minimumRole)) {
      return forbidden(`Requires ${minimumRole} role or higher`);
    }

    await next();
  };
}
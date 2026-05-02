import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'

interface ProfileRow {
  id: string
  phone: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

function formatProfile(profile: ProfileRow, email: string) {
  return {
    id: profile.id,
    email,
    phone: profile.phone,
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isActive: profile.is_active,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

export async function register(
  data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    phone?: string
  },
  supabase: SupabaseClient
) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName ?? null,
        last_name: data.lastName ?? null,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS')
    }
    handleSupabaseError(error, 'register')
  }

  if (!authData.user) {
    throw new AppError('Registration failed', 500)
  }

  if (data.phone) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ phone: data.phone })
      .eq('id', authData.user.id)

    if (profileError) {
      handleSupabaseError(profileError, 'register.updatePhone')
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single<ProfileRow>()

  if (profileError) {
    handleSupabaseError(profileError, 'register.fetchProfile')
  }

  return {
    user: formatProfile(profile!, authData.user.email ?? data.email),
    accessToken: authData.session?.access_token ?? null,
    refreshToken: authData.session?.refresh_token ?? null,
  }
}

export async function login(
  data: { email: string; password: string },
  supabase: SupabaseClient
) {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single<ProfileRow>()

  if (profileError) {
    handleSupabaseError(profileError, 'login.fetchProfile')
  }

  if (!profile?.is_active) {
    throw new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED')
  }

  return {
    user: formatProfile(profile, authData.user.email ?? data.email),
    accessToken: authData.session.access_token,
    refreshToken: authData.session.refresh_token,
  }
}

export async function refreshToken(
  refreshToken: string,
  supabase: SupabaseClient
) {
  const { data: authData, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  })

  if (error) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN')
  }

  if (!authData.user || !authData.session) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single<ProfileRow>()

  if (profileError) {
    handleSupabaseError(profileError, 'refreshToken.fetchProfile')
  }

  if (!profile?.is_active) {
    throw new AppError('User not found or inactive', 404, 'USER_NOT_FOUND')
  }

  return {
    user: formatProfile(profile, authData.user.email ?? ''),
    accessToken: authData.session.access_token,
    refreshToken: authData.session.refresh_token,
  }
}

export async function logout(
  accessToken: string,
  supabase: SupabaseClient
) {
  const { error } = await supabase.auth.admin.signOut(accessToken)

  if (error) {
    handleSupabaseError(error, 'logout')
  }
}

export async function forgotPassword(
  email: string,
  supabase: SupabaseClient,
  frontendUrl: string
) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${frontendUrl}/reset-password`,
  })

  if (error) {
    handleSupabaseError(error, 'forgotPassword')
  }
}

export async function resetPassword(
  password: string,
  supabase: SupabaseClient
) {
  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    handleSupabaseError(error, 'resetPassword')
  }
}

export async function getMe(
  userId: string,
  supabase: SupabaseClient
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<ProfileRow>()

  if (error) {
    handleSupabaseError(error, 'getMe')
  }

  if (!profile) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId)

  if (authError) {
    handleSupabaseError(authError, 'getMe.fetchAuthUser')
  }

  return formatProfile(profile, user?.email ?? '')
}
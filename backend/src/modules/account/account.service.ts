import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError, handleSupabaseError } from '../../utils/supabase'
import { createAuditLog } from '../../utils/audit'
import { uploadImageToCloudinary, deleteFromCloudinary } from '../../utils/upload'
import type { CloudflareBindings } from '../../types/bindings'

interface ProfileRow {
  id: string
  phone: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: string
  is_active: boolean
  email: string | null
  created_at: string
  updated_at: string
}

interface AddressRow {
  id: string
  user_id: string
  label: string | null
  full_name: string
  phone: string
  address_1: string
  address_2: string | null
  city: string
  district: string | null
  province: string | null
  postal_code: string | null
  country: string
  is_default: boolean
  created_at: string
  updated_at: string
}

function formatProfile(profile: ProfileRow, counts: { orderCount: number; wishlistCount: number; addressCount: number }) {
  return {
    id: profile.id,
    email: profile.email,
    phone: profile.phone,
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isActive: profile.is_active,
    orderCount: counts.orderCount,
    wishlistCount: counts.wishlistCount,
    addressCount: counts.addressCount,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}

function formatAddress(row: AddressRow) {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    address1: row.address_1,
    address2: row.address_2,
    city: row.city,
    district: row.district,
    province: row.province,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<ProfileRow>()

  if (error) handleSupabaseError(error, 'getProfile')
  if (!profile) throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND')

  const [orderResult, wishlistResult, addressResult] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('wishlist_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_addresses').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  return formatProfile(profile, {
    orderCount: orderResult.count ?? 0,
    wishlistCount: wishlistResult.count ?? 0,
    addressCount: addressResult.count ?? 0,
  })
}

export async function updateProfile(supabase: SupabaseClient, userId: string, data: { firstName?: string; lastName?: string; phone?: string }, auditUserId: string) {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<ProfileRow>()

  if (fetchError) handleSupabaseError(fetchError, 'updateProfile.fetch')
  if (!profile) throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND')

  if (data.phone !== undefined && data.phone !== profile.phone) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', data.phone)
      .neq('id', userId)
      .limit(1)
      .maybeSingle()

    if (existing) {
      throw new AppError('Phone number already in use', 409, 'PHONE_EXISTS')
    }
  }

  const updateData: Record<string, unknown> = {}
  if (data.firstName !== undefined) updateData.first_name = data.firstName
  if (data.lastName !== undefined) updateData.last_name = data.lastName
  if (data.phone !== undefined) updateData.phone = data.phone || null

  if (Object.keys(updateData).length === 0) {
    return formatProfile(profile, { orderCount: 0, wishlistCount: 0, addressCount: 0 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single<ProfileRow>()

  if (updateError) handleSupabaseError(updateError, 'updateProfile.update')

  await createAuditLog(supabase, {
    userId: auditUserId,
    action: 'UPDATE',
    entity: 'profiles',
    entityId: userId,
    changes: updateData,
  })

  return formatProfile(updated!, { orderCount: 0, wishlistCount: 0, addressCount: 0 })
}

export async function uploadAvatar(supabase: SupabaseClient, userId: string, file: File, env: CloudflareBindings) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single<{ avatar_url: string | null }>()

  if (error) handleSupabaseError(error, 'uploadAvatar.fetch')
  if (!profile) throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND')

  if (profile.avatar_url) {
    const publicIdMatch = profile.avatar_url.match(/upload\/v\d+\/(.+)/)
    if (publicIdMatch) {
      try {
        await deleteFromCloudinary(publicIdMatch[1], env)
      } catch {
        // Ignore deletion errors for old avatar
      }
    }
  }

  const result = await uploadImageToCloudinary(file, `avatars/${userId}`, env)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: result.url })
    .eq('id', userId)
    .select()
    .single<ProfileRow>()

  if (updateError) handleSupabaseError(updateError, 'uploadAvatar.update')

  return { url: result.url }
}

export async function getAddresses(supabase: SupabaseClient, userId: string) {
  const { data: addresses, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) handleSupabaseError(error, 'getAddresses')

  return (addresses as AddressRow[]).map(formatAddress)
}

export async function createAddress(supabase: SupabaseClient, userId: string, data: {
  label?: string
  fullName: string
  phone: string
  address1: string
  address2?: string
  city: string
  district?: string
  province?: string
  postalCode?: string
  country?: string
}) {
  const { count, error: countError } = await supabase
    .from('user_addresses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) handleSupabaseError(countError, 'createAddress.count')
  if ((count ?? 0) >= 5) {
    throw new AppError('Maximum 5 addresses allowed', 400, 'MAX_ADDRESSES')
  }

  const isFirst = (count ?? 0) === 0

  const insertData = {
    user_id: userId,
    label: data.label || null,
    full_name: data.fullName,
    phone: data.phone,
    address_1: data.address1,
    address_2: data.address2 || null,
    city: data.city,
    district: data.district || null,
    province: data.province || null,
    postal_code: data.postalCode || null,
    country: data.country || 'Nepal',
    is_default: isFirst,
  }

  const { data: address, error } = await supabase
    .from('user_addresses')
    .insert(insertData)
    .select()
    .single<AddressRow>()

  if (error) handleSupabaseError(error, 'createAddress')

  return formatAddress(address)
}

export async function updateAddress(supabase: SupabaseClient, userId: string, addressId: string, data: {
  label?: string
  fullName?: string
  phone?: string
  address1?: string
  address2?: string
  city?: string
  district?: string
  province?: string
  postalCode?: string
  country?: string
}) {
  const { data: existing, error: fetchError } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('id', addressId)
    .eq('user_id', userId)
    .single<AddressRow>()

  if (fetchError) handleSupabaseError(fetchError, 'updateAddress.fetch')
  if (!existing) throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND')

  const updateData: Record<string, unknown> = {}
  if (data.label !== undefined) updateData.label = data.label || null
  if (data.fullName !== undefined) updateData.full_name = data.fullName
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.address1 !== undefined) updateData.address_1 = data.address1
  if (data.address2 !== undefined) updateData.address_2 = data.address2 || null
  if (data.city !== undefined) updateData.city = data.city
  if (data.district !== undefined) updateData.district = data.district || null
  if (data.province !== undefined) updateData.province = data.province || null
  if (data.postalCode !== undefined) updateData.postal_code = data.postalCode || null
  if (data.country !== undefined) updateData.country = data.country

  if (Object.keys(updateData).length === 0) {
    return formatAddress(existing)
  }

  const { data: updated, error } = await supabase
    .from('user_addresses')
    .update(updateData)
    .eq('id', addressId)
    .select()
    .single<AddressRow>()

  if (error) handleSupabaseError(error, 'updateAddress')

  return formatAddress(updated!)
}

export async function deleteAddress(supabase: SupabaseClient, userId: string, addressId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('id', addressId)
    .eq('user_id', userId)
    .single<AddressRow>()

  if (fetchError) handleSupabaseError(fetchError, 'deleteAddress.fetch')
  if (!existing) throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND')

  const wasDefault = existing.is_default

  const { error: deleteError } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', addressId)

  if (deleteError) handleSupabaseError(deleteError, 'deleteAddress')

  if (wasDefault) {
    const { data: nextAddress } = await supabase
      .from('user_addresses')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextAddress) {
      await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', nextAddress.id)
    }
  }

  return { deleted: true }
}

export async function setDefaultAddress(supabase: SupabaseClient, userId: string, addressId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('id', addressId)
    .eq('user_id', userId)
    .single<AddressRow>()

  if (fetchError) handleSupabaseError(fetchError, 'setDefaultAddress.fetch')
  if (!existing) throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND')

  await supabase
    .from('user_addresses')
    .update({ is_default: false })
    .eq('user_id', userId)

  const { data: updated, error } = await supabase
    .from('user_addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .select()
    .single<AddressRow>()

  if (error) handleSupabaseError(error, 'setDefaultAddress')

  return formatAddress(updated!)
}
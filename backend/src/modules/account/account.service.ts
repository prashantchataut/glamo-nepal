import type { SupabaseClient } from '@supabase/supabase-js'

export async function getProfile(userId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function updateProfile(userId: string, data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function updateAvatar(userId: string, file: File, supabase: SupabaseClient) {
  // TODO: implement
}

export async function getAddresses(userId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function createAddress(userId: string, data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function updateAddress(userId: string, addressId: string, data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function deleteAddress(userId: string, addressId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function setDefaultAddress(userId: string, addressId: string, supabase: SupabaseClient) {
  // TODO: implement
}
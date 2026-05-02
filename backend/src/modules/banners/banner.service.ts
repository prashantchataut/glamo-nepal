import type { SupabaseClient } from '@supabase/supabase-js'

export async function getBanners(supabase: SupabaseClient) {
  // TODO: implement
}

export async function getBannersByPosition(position: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function createBanner(data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function updateBanner(id: string, data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function deleteBanner(id: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function reorderBanners(orders: any[], supabase: SupabaseClient) {
  // TODO: implement
}
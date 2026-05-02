import type { SupabaseClient } from '@supabase/supabase-js'

export async function getWishlist(userId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function addToWishlist(userId: string, productId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function removeFromWishlist(userId: string, productId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function checkWishlistItem(userId: string, productId: string, supabase: SupabaseClient) {
  // TODO: implement
}
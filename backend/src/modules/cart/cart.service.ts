import type { SupabaseClient } from '@supabase/supabase-js'

export async function getCart(userId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function addToCart(userId: string, data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function updateCartItem(userId: string, itemId: string, data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function removeCartItem(userId: string, itemId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function clearCart(userId: string, supabase: SupabaseClient) {
  // TODO: implement
}
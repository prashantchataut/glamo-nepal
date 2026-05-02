import type { SupabaseClient } from '@supabase/supabase-js'

export async function createCoupon(data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function getCoupons(supabase: SupabaseClient) {
  // TODO: implement
}

export async function getCouponById(id: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function updateCoupon(id: string, data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function deleteCoupon(id: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function validateCoupon(code: string, cartTotal: number, supabase: SupabaseClient) {
  // TODO: implement
}

export async function applyCoupon(userId: string, code: string, cartTotal: number, supabase: SupabaseClient) {
  // TODO: implement
}
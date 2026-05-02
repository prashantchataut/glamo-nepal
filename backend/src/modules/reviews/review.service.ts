import type { SupabaseClient } from '@supabase/supabase-js'

export async function getProductReviews(productId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function createReview(userId: string, data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function updateReview(userId: string, reviewId: string, data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function deleteReview(userId: string, reviewId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function getAdminReviews(supabase: SupabaseClient) {
  // TODO: implement
}

export async function approveReview(reviewId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function rejectReview(reviewId: string, supabase: SupabaseClient) {
  // TODO: implement
}
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getBlogPosts(supabase: SupabaseClient) {
  // TODO: implement
}

export async function getBlogCategories(supabase: SupabaseClient) {
  // TODO: implement
}

export async function getBlogPostBySlug(slug: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function createBlogPost(userId: string, data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function updateBlogPost(id: string, data: any, supabase: SupabaseClient) {
  // TODO: implement
}

export async function publishBlogPost(id: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function unpublishBlogPost(id: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function deleteBlogPost(id: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function uploadBlogCover(id: string, file: File, supabase: SupabaseClient) {
  // TODO: implement
}
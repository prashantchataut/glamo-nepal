import type { SupabaseClient } from '@supabase/supabase-js'

export async function subscribe(email: string, name: string | undefined, supabase: SupabaseClient) {
  // TODO: implement
}

export async function unsubscribe(token: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function getSubscribers(supabase: SupabaseClient) {
  // TODO: implement
}

export async function exportSubscribers(supabase: SupabaseClient) {
  // TODO: implement
}

export async function deleteSubscriber(id: string, supabase: SupabaseClient) {
  // TODO: implement
}
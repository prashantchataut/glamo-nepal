import type { SupabaseClient } from '@supabase/supabase-js'

export async function getDashboardStats(supabase: SupabaseClient) {
  // TODO: implement
}

export async function getSalesReport(supabase: SupabaseClient) {
  // TODO: implement
}

export async function getNotifications(userId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function markNotificationRead(notificationId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function markAllNotificationsRead(userId: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function getAuditLogs(supabase: SupabaseClient) {
  // TODO: implement
}

export async function getUsers(supabase: SupabaseClient) {
  // TODO: implement
}

export async function getUserById(id: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function updateUserRole(id: string, role: string, supabase: SupabaseClient) {
  // TODO: implement
}

export async function updateUserStatus(id: string, isActive: boolean, supabase: SupabaseClient) {
  // TODO: implement
}
import type { SupabaseClient } from '@supabase/supabase-js'

interface AuditLogParams {
  userId?: string
  action: string
  entity: string
  entityId?: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(
  supabase: SupabaseClient,
  params: AuditLogParams
): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      changes: params.changes ?? null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    })
    if (error) console.error('Failed to create audit log:', error)
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}
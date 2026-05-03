import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AuditLogParams {
  userId?: string
  action: string
  entity: string
  entityId?: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for audit logging')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase.from('audit_logs').insert({
      user_id: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      changes: params.changes ?? null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    })

    if (error) {
      console.error('Failed to create audit log:', error)
    }
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}
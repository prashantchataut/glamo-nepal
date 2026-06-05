import type { Client } from '@libsql/client'

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
  db: Client,
  params: AuditLogParams
): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT INTO audit_logs (id, user_id, action, entity, entity_id, changes, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        crypto.randomUUID(),
        params.userId ?? null,
        params.action,
        params.entity,
        params.entityId ?? null,
        params.changes ? JSON.stringify(params.changes) : null,
        params.ipAddress ?? null,
        params.userAgent ?? null,
      ],
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}
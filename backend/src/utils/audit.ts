import type { Client } from '@libsql/client'

export interface AuditLogParams {
  userId?: string
  action: string
  entity: string
  entityId?: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export interface ClientInfo {
  ipAddress?: string | null
  userAgent?: string | null
}

export async function createAuditLog(
  db: Client,
  params: AuditLogParams,
  clientInfo?: ClientInfo
): Promise<void> {
  try {
    const ipAddress = params.ipAddress ?? clientInfo?.ipAddress ?? null
    const userAgent = params.userAgent ?? clientInfo?.userAgent ?? null
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
        ipAddress,
        userAgent,
      ],
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}
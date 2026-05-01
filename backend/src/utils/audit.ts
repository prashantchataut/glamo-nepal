interface AuditLogParams {
  userId?: string
  action: string
  entity: string
  entityId?: string
  changes?: string
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(
  db: D1Database,
  params: AuditLogParams
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, changes, ip_address, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(
        params.userId ?? null,
        params.action,
        params.entity,
        params.entityId ?? null,
        params.changes ?? null,
        params.ipAddress ?? null,
        params.userAgent ?? null
      )
      .run()
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}
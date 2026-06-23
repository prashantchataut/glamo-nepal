import type { Client } from '@libsql/client'

/**
 * Admin notification helper. Mirrors the pattern of utils/audit.ts.
 *
 * The notifications table's `type` column is constrained to
 * ('INFO','SUCCESS','WARNING','ERROR','ORDER','PROMO') — see migration 0001.
 * We emit with user_id = NULL so every admin/owner sees them (the admin
 * service's getNotifications returns all rows for ADMIN/SUPER_ADMIN roles
 * regardless of user_id). Never throws — a notification failure must not break
 * the user-facing action (order placement, signup) that triggered it.
 */
export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'ORDER'
  | 'PROMO'

export interface CreateNotificationParams {
  type: NotificationType
  title: string
  message: string
  /** Optional structured payload, stored as JSON in the `data` column. */
  data?: Record<string, unknown>
  /**
   * Target a specific admin user_id. Omit (or null) for a broadcast every admin
   * sees — the common case for "new order" / "low stock" alerts.
   */
  userId?: string | null
}

export async function createNotification(
  db: Client,
  params: CreateNotificationParams,
): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
      args: [
        crypto.randomUUID(),
        params.userId ?? null,
        params.type,
        params.title,
        params.message,
        params.data ? JSON.stringify(params.data) : null,
      ],
    })
  } catch (error) {
    // Non-fatal: notifications are best-effort. The triggering operation
    // (order placement, signup) has already succeeded by the time we get here.
    console.error('Failed to create notification:', error)
  }
}

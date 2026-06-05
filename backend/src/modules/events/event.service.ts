import type { Client } from '@libsql/client'
import { handleDbError } from '../../utils/turso-helpers'

interface EventItem {
  type: string
  entity_id?: string
  metadata?: Record<string, unknown>
  timestamp?: string
}

export async function trackEvents(
  sessionId: string,
  userId: string | undefined,
  events: EventItem[],
  db: Client
) {
  for (const evt of events) {
    const id = crypto.randomUUID()
    const now = evt.timestamp || new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO events (id, type, entity_id, session_id, user_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        evt.type,
        evt.entity_id || null,
        sessionId,
        userId || null,
        evt.metadata ? JSON.stringify(evt.metadata) : null,
        now,
      ],
    })
  }
}
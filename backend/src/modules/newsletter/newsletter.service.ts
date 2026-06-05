import type { Client } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool, toSqliteBool } from '../../utils/turso-helpers'
import { createAuditLog } from '../../utils/audit'

function formatSubscriber(row: any) {
  return {
    id: row.id,
    email: row.email,
    unsubscribeToken: row.unsubscribe_token,
    isActive: fromSqliteBool(row.is_active),
    subscribedAt: row.subscribed_at,
    unsubscribedAt: row.unsubscribed_at,
  }
}

export async function subscribe(db: Client, email: string, ip: string) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM newsletter_subscribers WHERE email = ?`,
    args: [email],
  })

  const existing = existingResult.rows[0]

  if (existing && fromSqliteBool(existing.is_active as number)) {
    return { message: 'Successfully subscribed' }
  }

  if (existing && !fromSqliteBool(existing.is_active as number)) {
    await db.execute({
      sql: `UPDATE newsletter_subscribers SET is_active = 1, unsubscribed_at = NULL WHERE id = ?`,
      args: [existing.id],
    })

    return { message: 'Successfully subscribed' }
  }

  try {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO newsletter_subscribers (id, email, is_active, subscribed_at, created_at) VALUES (?, ?, 1, ?, ?)`,
      args: [id, email, now, now],
    })
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint')) {
      return { message: 'Successfully subscribed' }
    }
    throw new AppError('Failed to subscribe', 500)
  }

  return { message: 'Successfully subscribed' }
}

export async function unsubscribe(db: Client, token: string) {
  if (!token) {
    return { message: 'Unsubscribed successfully' }
  }

  const result = await db.execute({
    sql: `SELECT * FROM newsletter_subscribers WHERE unsubscribe_token = ?`,
    args: [token],
  })

  const subscriber = result.rows[0]

  if (!subscriber) {
    return { message: 'Unsubscribed successfully' }
  }

  if (!fromSqliteBool(subscriber.is_active as number)) {
    return { message: 'Unsubscribed successfully' }
  }

  await db.execute({
    sql: `UPDATE newsletter_subscribers SET is_active = 0, unsubscribed_at = ? WHERE id = ?`,
    args: [new Date().toISOString(), subscriber.id],
  })

  return { message: 'Unsubscribed successfully' }
}

export async function getSubscribers(db: Client, filters: { isActive?: boolean; page: number; limit: number }) {
  const { isActive, page, limit } = filters
  const offset = (page - 1) * limit

  const whereClauses: string[] = []
  const args: any[] = []

  if (isActive !== undefined) {
    whereClauses.push(`is_active = ${toSqliteBool(isActive)}`)
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM newsletter_subscribers ${whereStr}`,
    args,
  })

  const dataResult = await db.execute({
    sql: `SELECT * FROM newsletter_subscribers ${whereStr} ORDER BY subscribed_at DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  })

  const total = Number(countResult.rows[0]?.count ?? 0)

  return {
    subscribers: dataResult.rows.map(formatSubscriber),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function exportSubscribers(db: Client) {
  const result = await db.execute({
    sql: `SELECT email, is_active, subscribed_at, unsubscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC`,
    args: [],
  })

  const header = 'email,is_active,subscribed_at,unsubscribed_at'
  const rows = result.rows.map(row =>
    `"${row.email}","${fromSqliteBool(row.is_active as number)}","${row.subscribed_at}","${row.unsubscribed_at || ''}"`
  )

  return [header, ...rows].join('\n')
}

export async function deleteSubscriber(db: Client, id: string, adminUserId: string) {
  const existingResult = await db.execute({
    sql: `SELECT * FROM newsletter_subscribers WHERE id = ?`,
    args: [id],
  })

  const subscriber = existingResult.rows[0]
  if (!subscriber) {
    throw new AppError('Subscriber not found', 404, 'NOT_FOUND')
  }

  await db.execute({
    sql: `DELETE FROM newsletter_subscribers WHERE id = ?`,
    args: [id],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'newsletter_subscribers',
    entityId: id,
    changes: { email: subscriber.email },
  })

  return { message: 'Subscriber deleted successfully' }
}
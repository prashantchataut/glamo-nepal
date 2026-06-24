import type { Client, InValue } from '@libsql/client'
import { AppError, safeJsonParse, safeJsonStringify } from '../../utils/turso-helpers'
import { createAuditLog } from '../../utils/audit'
import { parsePagination, buildPaginationResult } from '../../utils/pagination'
import type { CreateReturnInput, ReturnFilterInput, UpdateReturnInput } from './return.schema'

interface ReturnRow {
  id: string
  order_id: string
  order_number: string
  customer_id: string | null
  customer_name: string | null
  customer_email: string | null
  status: string
  reason: string
  requested_resolution: string
  item_condition: string
  hygiene_status: string
  customer_note: string | null
  admin_notes: string | null
  metadata: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

function formatReturn(row: ReturnRow) {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    status: row.status,
    reason: row.reason,
    requestedResolution: row.requested_resolution,
    itemCondition: row.item_condition,
    hygieneStatus: row.hygiene_status,
    customerNote: row.customer_note,
    adminNotes: row.admin_notes,
    metadata: safeJsonParse<Record<string, unknown>>(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  }
}

async function getOrderForReturn(db: Client, data: CreateReturnInput) {
  const conditions: string[] = []
  const args: InValue[] = []
  if (data.orderId) { conditions.push('o.id = ?'); args.push(data.orderId) }
  if (data.orderNumber) { conditions.push('o.order_number = ?'); args.push(data.orderNumber) }
  if (conditions.length === 0) throw new AppError('Order ID or order number is required', 400, 'ORDER_REQUIRED')

  const result = await db.execute({
    sql: `SELECT o.id, o.order_number, o.user_id, u.email, u.first_name, u.last_name
          FROM orders o
          LEFT JOIN users u ON u.id = o.user_id
          WHERE (${conditions.join(' OR ')})
          LIMIT 1`,
    args,
  })
  const order = result.rows[0]
  if (!order) throw new AppError('Order not found for this return request', 404, 'ORDER_NOT_FOUND')
  return order as Record<string, unknown>
}

export async function listReturns(filters: ReturnFilterInput, db: Client) {
  const { page, limit, skip } = parsePagination({ page: String(filters.page || 1), limit: String(filters.limit || 20) })
  const where: string[] = []
  const args: InValue[] = []

  if (filters.status) {
    where.push('status = ?')
    args.push(filters.status)
  }
  if (filters.search) {
    const term = `%${filters.search.replace(/[%_\\]/g, '\\$&')}%`
    where.push(`(order_number LIKE ? ESCAPE '\\' OR customer_name LIKE ? ESCAPE '\\' OR customer_email LIKE ? ESCAPE '\\' OR reason LIKE ? ESCAPE '\\')`)
    args.push(term, term, term, term)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const count = await db.execute({ sql: `SELECT COUNT(*) as count FROM return_requests ${whereSql}`, args })
  const total = Number(count.rows[0]?.count ?? 0)
  const rows = await db.execute({
    sql: `SELECT * FROM return_requests ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, skip],
  })
  const pagination = buildPaginationResult(total, page, limit)
  return { returns: rows.rows.map((row) => formatReturn(row as unknown as ReturnRow)), pagination }
}

export async function createReturn(data: CreateReturnInput, adminId: string, db: Client) {
  const order = await getOrderForReturn(db, data)
  const existing = await db.execute({
    sql: `SELECT id FROM return_requests WHERE order_id = ? AND status NOT IN ('CLOSED', 'REJECTED') LIMIT 1`,
    args: [order.id as string],
  })
  if (existing.rows[0]) throw new AppError('This order already has an open return request', 409, 'RETURN_EXISTS')

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const customerName = [order.first_name, order.last_name].filter(Boolean).join(' ') || null

  await db.execute({
    sql: `INSERT INTO return_requests (id, order_id, order_number, customer_id, customer_name, customer_email, status, reason, requested_resolution, item_condition, hygiene_status, customer_note, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'REQUESTED', ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      order.id as string,
      order.order_number as string,
      (order.user_id as string) || null,
      customerName,
      (order.email as string) || null,
      data.reason,
      data.requestedResolution,
      data.itemCondition,
      data.hygieneStatus,
      data.customerNote ?? null,
      safeJsonStringify({ source: 'admin' }),
      now,
      now,
    ],
  })

  await createAuditLog(db, { userId: adminId, action: 'CREATE', entity: 'return_requests', entityId: id, changes: data })
  const row = await db.execute({ sql: 'SELECT * FROM return_requests WHERE id = ?', args: [id] })
  return formatReturn(row.rows[0] as unknown as ReturnRow)
}

export async function updateReturn(id: string, data: UpdateReturnInput, adminId: string, db: Client) {
  const existing = await db.execute({ sql: 'SELECT * FROM return_requests WHERE id = ?', args: [id] })
  if (!existing.rows[0]) throw new AppError('Return request not found', 404, 'RETURN_NOT_FOUND')

  const sets: string[] = ['updated_at = ?']
  const args: InValue[] = [new Date().toISOString()]
  if (data.status !== undefined) { sets.push('status = ?'); args.push(data.status) }
  if (data.requestedResolution !== undefined) { sets.push('requested_resolution = ?'); args.push(data.requestedResolution) }
  if (data.itemCondition !== undefined) { sets.push('item_condition = ?'); args.push(data.itemCondition) }
  if (data.hygieneStatus !== undefined) { sets.push('hygiene_status = ?'); args.push(data.hygieneStatus) }
  if (data.adminNotes !== undefined) { sets.push('admin_notes = ?'); args.push(data.adminNotes) }
  if (data.status && ['REFUNDED', 'EXCHANGED', 'CLOSED', 'REJECTED'].includes(data.status)) {
    sets.push('resolved_at = ?')
    args.push(new Date().toISOString())
  }
  args.push(id)

  await db.execute({ sql: `UPDATE return_requests SET ${sets.join(', ')} WHERE id = ?`, args })
  await createAuditLog(db, { userId: adminId, action: 'UPDATE', entity: 'return_requests', entityId: id, changes: data })
  const row = await db.execute({ sql: 'SELECT * FROM return_requests WHERE id = ?', args: [id] })
  return formatReturn(row.rows[0] as unknown as ReturnRow)
}

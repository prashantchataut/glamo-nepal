import type { Client } from '@libsql/client'
import { AppError, handleDbError, fromSqliteBool, toSqliteBool } from '../../utils/turso-helpers'
import { createAuditLog } from '../../utils/audit'

export async function getTeamMembers(db: Client) {
  const result = await db.execute({
    sql: `SELECT * FROM team_members WHERE is_active = 1 ORDER BY sort_order ASC`,
    args: [],
  })

  return result.rows.map(row => ({ ...row, is_active: fromSqliteBool(row.is_active as number) }))
}

export async function createTeamMember(db: Client, data: any, adminUserId: string) {
  const id = crypto.randomUUID()

  await db.execute({
    sql: `INSERT INTO team_members (id, name, role, bio, image_url, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
    args: [id, data.name, data.role, data.bio ?? null, data.imageUrl ?? null, data.sortOrder ?? 0],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'CREATE',
    entity: 'team_member',
    entityId: id,
    changes: data,
  })

  const result = await db.execute({
    sql: `SELECT * FROM team_members WHERE id = ?`,
    args: [id],
  })

  return { ...result.rows[0], is_active: fromSqliteBool(result.rows[0].is_active as number) }
}

export async function updateTeamMember(db: Client, id: string, data: any, adminUserId: string) {
  const updates: string[] = []
  const args: any[] = []

  if (data.name !== undefined) { updates.push('name = ?'); args.push(data.name) }
  if (data.role !== undefined) { updates.push('role = ?'); args.push(data.role) }
  if (data.bio !== undefined) { updates.push('bio = ?'); args.push(data.bio) }
  if (data.imageUrl !== undefined) { updates.push('image_url = ?'); args.push(data.imageUrl) }
  if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); args.push(data.sortOrder) }

  updates.push('updated_at = datetime(\'now\')')
  args.push(id)

  const result = await db.execute({
    sql: `UPDATE team_members SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  if (result.rowsAffected === 0) throw new AppError('Team member not found', 404)

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'team_member',
    entityId: id,
    changes: data,
  })

  const updatedResult = await db.execute({
    sql: `SELECT * FROM team_members WHERE id = ?`,
    args: [id],
  })

  return { ...updatedResult.rows[0], is_active: fromSqliteBool(updatedResult.rows[0].is_active as number) }
}

export async function deleteTeamMember(db: Client, id: string, adminUserId: string) {
  const existingResult = await db.execute({
    sql: `SELECT id FROM team_members WHERE id = ?`,
    args: [id],
  })

  if (!existingResult.rows[0]) throw new AppError('Team member not found', 404)

  await db.execute({
    sql: `UPDATE team_members SET is_active = 0 WHERE id = ?`,
    args: [id],
  })

  await createAuditLog(db, {
    userId: adminUserId,
    action: 'DELETE',
    entity: 'team_member',
    entityId: id,
  })
}
import { Client, type InValue } from '@libsql/client'
import { AppError, handleDbError, assertSingle, fromSqliteBool } from '../../utils/turso-helpers'

interface UserRow {
  id: string
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: string
  is_active: number
  email_verified: number
  phone_verified: number
  google_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

function formatUser(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    email: row.email as string | null,
    phone: row.phone as string | null,
    firstName: row.first_name as string | null,
    lastName: row.last_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    role: row.role as string,
    isActive: fromSqliteBool(row.is_active as number),
    emailVerified: fromSqliteBool(row.email_verified as number),
    phoneVerified: fromSqliteBool(row.phone_verified as number),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function register(
  data: {
    uid: string
    email: string
    firstName?: string
    lastName?: string
    phone?: string
  },
  db: Client
) {
  try {
    await db.execute({
      sql: `INSERT INTO users (id, email, first_name, last_name, phone, role, is_active, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'CUSTOMER', 1, 1, datetime('now'), datetime('now'))`,
      args: [
        data.uid,
        data.email,
        data.firstName ?? null,
        data.lastName ?? null,
        data.phone ?? null,
      ],
    })

    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [data.uid],
    })

    const user = assertSingle(result.rows, 'User')
    return { user: formatUser(user) }
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint')) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS')
    }
    handleDbError(error, 'register')
  }
}

export async function getMe(userId: string, db: Client) {
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
    args: [userId],
  })

  const user = result.rows[0]
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  return formatUser(user)
}

export async function findOrCreateUser(
  params: { uid: string; email: string; firstName?: string; lastName?: string },
  db: Client
) {
  const existing = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
    args: [params.uid],
  })

  if (existing.rows.length > 0) {
    return formatUser(existing.rows[0])
  }

  try {
    await db.execute({
      sql: `INSERT INTO users (id, email, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'CUSTOMER', 1, 1, datetime('now'), datetime('now'))`,
      args: [params.uid, params.email, params.firstName ?? null, params.lastName ?? null],
    })
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint')) {
      const retry = await db.execute({
        sql: 'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
        args: [params.uid],
      })
      if (retry.rows.length > 0) {
        return formatUser(retry.rows[0])
      }
      const byEmail = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
        args: [params.email],
      })
      if (byEmail.rows.length > 0) {
        return formatUser(byEmail.rows[0])
      }
    }
    handleDbError(error, 'findOrCreateUser')
  }

  const created = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [params.uid],
  })

  return formatUser(assertSingle(created.rows, 'User'))
}

export async function updateUserProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string },
  db: Client
) {
  const sets: string[] = []
  const args: InValue[] = []

  if (data.firstName !== undefined) {
    sets.push('first_name = ?')
    args.push(data.firstName)
  }
  if (data.lastName !== undefined) {
    sets.push('last_name = ?')
    args.push(data.lastName)
  }
  if (data.phone !== undefined) {
    sets.push('phone = ?')
    args.push(data.phone || null)
  }
  if (data.avatarUrl !== undefined) {
    sets.push('avatar_url = ?')
    args.push(data.avatarUrl)
  }

  if (sets.length === 0) {
    const existing = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
      args: [userId],
    })
    const user = existing.rows[0]
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')
    return formatUser(user)
  }

  sets.push("updated_at = datetime('now')")
  args.push(userId)

  await db.execute({
    sql: `UPDATE users SET ${sets.join(', ')} WHERE id = ?`,
    args,
  })

  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [userId],
  })

  const user = result.rows[0]
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  return formatUser(user)
}
import type { Client, InValue } from '@libsql/client'
import { AppError, handleDbError, assertSingle, fromSqliteBool } from '../../utils/turso-helpers'

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
            VALUES (?, ?, ?, ?, ?, 'CUSTOMER', 1, 0, datetime('now'), datetime('now'))`,
      args: [
        data.uid,
        data.email,
        data.firstName ?? null,
        data.lastName ?? null,
        data.phone ?? null,
      ],
    })

    const result = await db.execute({
      sql: `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`,
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
    sql: 'SELECT id, email, phone, first_name, last_name, avatar_url, role, is_active, email_verified, phone_verified, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL',
    args: [userId],
  })

  const user = result.rows[0]
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  return formatUser(user)
}

const USER_COLUMNS = 'id, email, phone, first_name, last_name, avatar_url, role, is_active, email_verified, phone_verified, created_at, updated_at'

export async function findOrCreateUser(
  params: { uid: string; email: string; firstName?: string; lastName?: string },
  db: Client
) {
  // 1. Look up by Firebase UID (the primary key in our users table).
  // This is the happy path — the user already exists and is linked.
  const existingById = await db.execute({
    sql: `SELECT ${USER_COLUMNS} FROM users WHERE id = ? AND deleted_at IS NULL`,
    args: [params.uid],
  })

  if (existingById.rows.length > 0) {
    return formatUser(existingById.rows[0])
  }

  // 2. Look up by email. If a user exists with this email but a DIFFERENT id,
  //    it means they registered via a different auth provider (or the admin
  //    created their account before they signed up via Firebase).
  //    PREVIOUSLY: the code did `UPDATE users SET id = ?` to change the
  //    primary key to the Firebase UID. This FAILS with
  //    `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed` because cart,
  //    wishlist, orders, reviews, addresses, etc. all reference users(id)
  //    and SQLite doesn't support ON UPDATE CASCADE by default.
  //
  //    FIX: Instead of changing the existing user's ID, we UPDATE the
  //    existing user's email_verified flag and return them AS-IS. The
  //    Firebase UID is used for auth token verification only — the user's
  //    row ID in our DB stays stable so all FK references remain valid.
  //    The frontend stores both the Firebase UID and the DB user ID, and
  //    sends the DB user ID (via the auth token) for authenticated requests.
  //
  //    For ADMIN/SUPER_ADMIN users, we return them directly (they log in
  //    via Firebase but their DB row was created by the seeding script
  //    with a stable UUID, not the Firebase UID).
  const existingByEmail = await db.execute({
    sql: `SELECT ${USER_COLUMNS} FROM users WHERE LOWER(email) = LOWER(?) AND deleted_at IS NULL LIMIT 1`,
    args: [params.email],
  })

  if (existingByEmail.rows.length > 0) {
    const user = existingByEmail.rows[0]
    const role = (user as any).role as string
    const userId = (user as any).id as string

    // For admins, return as-is. Their DB id is the source of truth.
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return formatUser(user)
    }

    // For customers, update their profile fields (mark email verified,
    // fill in name if missing) but DO NOT change the primary key.
    // This avoids the FK constraint violation.
    const hasFirstName = (user as any).first_name as string | null
    const hasLastName = (user as any).last_name as string | null
    const needsUpdate =
      !hasFirstName && params.firstName ||
      !hasLastName && params.lastName ||
      !(user as any).email_verified

    if (needsUpdate) {
      try {
        await db.execute({
          sql: `UPDATE users
                SET first_name = COALESCE(first_name, ?),
                    last_name = COALESCE(last_name, ?),
                    email_verified = 1,
                    updated_at = datetime('now')
                WHERE id = ? AND deleted_at IS NULL`,
          args: [params.firstName ?? null, params.lastName ?? null, userId],
        })
      } catch {
        // Non-fatal — we still return the existing user.
      }
    }

    const refreshed = await db.execute({
      sql: `SELECT ${USER_COLUMNS} FROM users WHERE id = ? AND deleted_at IS NULL`,
      args: [userId],
    })
    return formatUser(refreshed.rows[0])
  }

  // 3. No existing user by UID or email — create a new customer row with
  //    the Firebase UID as the primary key. This is safe because no FK
  //    references exist yet.
  try {
    await db.execute({
      sql: `INSERT INTO users (id, email, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'CUSTOMER', 1, 1, datetime('now'), datetime('now'))`,
      args: [params.uid, params.email, params.firstName ?? null, params.lastName ?? null],
    })
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint')) {
      // Race condition: another request created the user between our SELECT
      // and INSERT. Re-fetch and return.
      const retry = await db.execute({
        sql: `SELECT ${USER_COLUMNS} FROM users WHERE id = ? OR LOWER(email) = LOWER(?) AND deleted_at IS NULL LIMIT 1`,
        args: [params.uid, params.email],
      })
      if (retry.rows.length > 0) {
        return formatUser(retry.rows[0])
      }
    }
    handleDbError(error, 'findOrCreateUser')
  }

  const created = await db.execute({
    sql: `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`,
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
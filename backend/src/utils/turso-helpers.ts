import type { Client } from '@libsql/client/web'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleDbError(error: any, context: string): never {
  console.error(`DB error in ${context}:`, error)
  
  // Turso/libSQL error handling
  if (error?.message?.includes('UNIQUE constraint')) {
    throw new AppError('A record with this information already exists', 409, 'UNIQUE_VIOLATION')
  }
  if (error?.message?.includes('FOREIGN KEY')) {
    throw new AppError('Referenced record not found', 400, 'FK_VIOLATION')
  }
  if (error?.message?.includes('NOT NULL')) {
    throw new AppError('Required field is missing', 400, 'NOT_NULL_VIOLATION')
  }
  
  throw new AppError(
    error?.message || 'Database operation failed',
    500,
    error?.code
  )
}

export function assertSingle<T>(rows: T[] | null | undefined, entity: string): T {
  if (!rows || rows.length === 0) {
    throw new AppError(`${entity}_NOT_FOUND`, 404)
  }
  if (rows.length > 1) {
    throw new AppError(`Multiple ${entity} found`, 500)
  }
  return rows[0]
}

export function assertFound<T>(row: T | null | undefined, entity: string): T {
  if (!row) {
    throw new AppError(`${entity}_NOT_FOUND`, 404)
  }
  return row
}

export function sanitizeUser(user: Record<string, unknown>) {
  const safe = { ...user }
  delete safe.password_hash
  delete safe.refresh_token
  return safe
}

// Helper to build WHERE clauses from filter objects
export function buildWhereClause(filters: Record<string, unknown>, conditions: string[]): { sql: string; args: unknown[] } {
  const clauses: string[] = []
  const args: unknown[] = []
  
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      const condition = conditions.find(c => c.startsWith(`${key} `))
      if (condition) {
        clauses.push(condition)
        args.push(value)
      } else {
        clauses.push(`${key} = ?`)
        args.push(value)
      }
    }
  }
  
  return {
    sql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    args
  }
}

// Helper to convert boolean values for SQLite (true/false → 1/0)
export function toSqliteBool(value: boolean | number | undefined): number {
  if (value === undefined || value === null) return 0
  return value ? 1 : 0
}

export function fromSqliteBool(value: number | undefined): boolean {
  return value === 1
}

// Helper for JSON columns - SQLite stores as TEXT
export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function safeJsonStringify(value: unknown): string | null {
  if (value === undefined || value === null) return null
  return JSON.stringify(value)
}

export async function withTransaction<T>(
  db: Client,
  fn: (tx: Client) => Promise<T>
): Promise<T> {
  await db.execute('BEGIN')
  try {
    const result = await fn(db)
    await db.execute('COMMIT')
    return result
  } catch (error) {
    try {
      await db.execute('ROLLBACK')
    } catch (rollbackError) {
      console.error('Failed to rollback transaction:', rollbackError)
    }
    throw error
  }
}
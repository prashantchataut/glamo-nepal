import type { Client } from '@libsql/client/web'

/**
 * Transaction retry/backoff for transient begin/commit failures.
 *
 * NOTE: We deliberately do NOT retry the body itself — only the outer
 * transaction lifecycle. Retrying the body on a commit failure would
 * re-run side effects (e.g. payment refunds, stock decrements) and could
 * double-charge the customer, so a lifecycle failure must bubble up.
 */
const MAX_TRANSACTION_RETRIES = 2;
const TRANSACTION_RETRY_DELAY_MS = 100;

/**
 * Run `fn` inside an atomic, single-connection database transaction.
 *
 * Previous implementation called `db.execute('BEGIN')` / `db.execute('COMMIT')`
 * as separate statements. With the libsql HTTP client, *every* `execute` runs
 * in its own logical connection, so BEGIN and COMMIT landed on different
 * connections and produced:
 *   "SQLITE_UNKNOWN: cannot commit - no transaction is active"
 *
 * Fix: use the native `client.transaction("write")` API, which manages
 * BEGIN/COMMIT over one logical connection internally. This is interactive
 * (the body can read rows mid-transaction and branch on `rowsAffected`, which
 * `batch()` cannot do — a 0-rows-affected statement is not an error in a batch,
 * so the `INSUFFICIENT_STOCK` guard would silently pass).
 *
 * Contract mirrors the old signature: `fn` receives a `Client`-shaped handle
 * (actually a libsql Transaction). commit()/rollback() both close the txn.
 */
export async function withTransaction<T>(
  db: Client,
  fn: (tx: Client) => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt++) {
    const tx = await db.transaction('write');
    let began = true;
    try {
      const result = await fn(tx as unknown as Client);
      await tx.commit();
      began = false; // commit() closed the transaction
      return result;
    } catch (error) {
      lastError = error;
      // Only roll back if the transaction is still open. commit()/rollback()
      // close it; if either already ran, calling again throws
      // "transaction is closed", which we swallow.
      if (began) {
        try {
          await tx.rollback();
        } catch (rollbackError) {
          // Best-effort: the original error is what matters.
          console.error('withTransaction: failed to rollback (ignored):', rollbackError);
        }
      }
      // Do not retry on app-level errors (AppError for INSUFFICIENT_STOCK etc.)
      // — only retry on transaction-lifecycle (begin/commit) failures that look
      // transient. Retrying an AppError would re-run the body and double-apply
      // side effects.
      if (error instanceof AppError) {
        throw error;
      }
      const msg = (error as { message?: string })?.message ?? '';
      const isTransient =
        /no transaction is active|cannot commit|cannot start a transaction|transaction is closed|SQLITE_BUSY|SQLITE_LOCKED/i.test(
          msg
        );
      if (!isTransient || attempt >= MAX_TRANSACTION_RETRIES) {
        throw error;
      }
      console.error(
        `withTransaction: transient txn failure (attempt ${attempt}/${MAX_TRANSACTION_RETRIES}), retrying:`,
        msg
      );
      await new Promise((r) => setTimeout(r, TRANSACTION_RETRY_DELAY_MS * attempt));
    }
  }

  // Unreachable in practice (loop always returns or throws), but satisfies TS.
  throw lastError instanceof Error
    ? lastError
    : new AppError('Failed to run database transaction', 500, 'TRANSACTION_FAILED');
}

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

// Helper to convert boolean values for SQLite (true/false â†’ 1/0)
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
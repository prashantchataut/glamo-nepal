import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Split a .sql file into individual runnable statements, stripping comments.
 * Splits on ';' at the end of a line (good enough for this project's migration
 * files, which contain no stored-procedure bodies with embedded semicolons).
 */
export function parseSqlFile(contents: string): string[] {
  return contents
    .split(';')
    .map((chunk) =>
      chunk
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter((s) => s.length > 0)
}

/** Errors that mean "this statement is already applied" and are safe to skip. */
export function isAlreadyAppliedError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('already exists') ||
    m.includes('duplicate column name') ||
    // libsql/turso surfaces missing-column adds on re-run as "duplicate".
    m.includes('cannot add a column with non-constant default')
  )
}

async function migrate() {
  const dbUrl = process.env.TURSO_DB_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  const isLocalFile = dbUrl?.startsWith('file:')
  if (!dbUrl || (!authToken && !isLocalFile)) {
    console.error('TURSO_DB_URL environment variable is required')
    console.error('(TURSO_AUTH_TOKEN is optional for local file: URLs)')
    process.exit(1)
  }

  const db = isLocalFile ? createClient({ url: dbUrl }) : createClient({ url: dbUrl, authToken })

  console.log('Running migrations...')

  // 1) Base schema (idempotent via CREATE TABLE IF NOT EXISTS).
  const schemaPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')
  for (const statement of parseSqlFile(schema)) {
    try {
      await db.execute({ sql: statement, args: [] })
      const preview = statement.substring(0, 60).replace(/\n/g, ' ')
      console.log(`✓ ${preview}...`)
    } catch (error: any) {
      if (isAlreadyAppliedError(error.message ?? '')) {
        const preview = statement.substring(0, 60).replace(/\n/g, ' ')
        console.log(`→ Skipping (already exists): ${preview}...`)
      } else {
        console.error(`✗ Error: ${error.message}`)
        console.error(`  Statement: ${statement.substring(0, 100)}...`)
      }
    }
  }

  // 2) Apply every numbered migration file in order. These carry the column
  // additions (cod_fee, gift_wrap_fee, ward, landmark, soft-delete columns,
  // phone_verified) and extra tables/indexes that the base schema predates.
  // Running them is idempotent because each statement either uses IF NOT EXISTS
  // or fails with a "duplicate" error that we skip. This is what fixes the
  // "table orders has no column named cod_fee" error: migration 0003 adds it.
  const migrationsDir = path.join(__dirname, '..', '..', '..', 'migrations')
  let migrationFiles: string[] = []
  try {
    migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
  } catch {
    console.log('→ No migrations directory found; skipping numbered migrations.')
  }

  for (const file of migrationFiles) {
    const fullPath = path.join(migrationsDir, file)
    const contents = fs.readFileSync(fullPath, 'utf-8')
    console.log(`\n— Applying ${file} —`)
    for (const statement of parseSqlFile(contents)) {
      try {
        await db.execute({ sql: statement, args: [] })
        const preview = statement.substring(0, 70).replace(/\n/g, ' ')
        console.log(`  ✓ ${preview}`)
      } catch (error: any) {
        if (isAlreadyAppliedError(error.message ?? '')) {
          const preview = statement.substring(0, 70).replace(/\n/g, ' ')
          console.log(`  → Skipping (already applied): ${preview}`)
        } else {
          console.error(`  ✗ Error: ${error.message}`)
        }
      }
    }
  }

  // 3) Legacy column-upgrade list (kept for databases that predate the
  // migrations dir). Safe no-ops on already-upgraded DBs.
  const columnUpgrades = [
    'ALTER TABLE products ADD COLUMN attributes TEXT',
    'ALTER TABLE product_variants ADD COLUMN deleted_at TEXT',
    'ALTER TABLE orders ADD COLUMN deleted_at TEXT',
    'ALTER TABLE reviews ADD COLUMN deleted_at TEXT',
    'ALTER TABLE users ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0',
    // These two are also in migration 0003 but listed here so a single
    // `ALTER`-only path (older deployments without the migrations dir) still
    // gets the order-fee columns that checkout depends on.
    'ALTER TABLE orders ADD COLUMN cod_fee INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE orders ADD COLUMN gift_wrap_fee INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE user_addresses ADD COLUMN ward TEXT',
    'ALTER TABLE user_addresses ADD COLUMN landmark TEXT',
  ]
  for (const statement of columnUpgrades) {
    try {
      await db.execute({ sql: statement, args: [] })
      console.log(`✓ ${statement}`)
    } catch (error: any) {
      if (error.message?.includes('duplicate column name')) {
        console.log(`→ Skipping (column exists): ${statement}`)
      } else {
        console.error(`✗ Error: ${error.message}`)
      }
    }
  }

  console.log('\nMigration complete!')
}

migrate().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})

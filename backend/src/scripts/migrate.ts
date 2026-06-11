import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'

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

  const schemaPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
    .map(s =>
      s
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter(s => s.length > 0)

  for (const statement of statements) {
    try {
      await db.execute({ sql: statement, args: [] })
      const preview = statement.substring(0, 60).replace(/\n/g, ' ')
      console.log(`✓ ${preview}...`)
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        const preview = statement.substring(0, 60).replace(/\n/g, ' ')
        console.log(`→ Skipping (already exists): ${preview}...`)
      } else {
        console.error(`✗ Error: ${error.message}`)
        console.error(`  Statement: ${statement.substring(0, 100)}...`)
      }
    }
  }

  // Column upgrades for databases created before these columns existed.
  // SQLite tolerates re-runs: "duplicate column name" errors are skipped.
  const columnUpgrades = [
    'ALTER TABLE products ADD COLUMN attributes TEXT',
    'ALTER TABLE product_variants ADD COLUMN deleted_at TEXT',
    'ALTER TABLE orders ADD COLUMN deleted_at TEXT',
    'ALTER TABLE reviews ADD COLUMN deleted_at TEXT',
    'ALTER TABLE users ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0',
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
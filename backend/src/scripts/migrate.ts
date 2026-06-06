import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'

async function migrate() {
  const dbUrl = process.env.TURSO_DB_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!dbUrl || !authToken) {
    console.error('TURSO_DB_URL and TURSO_AUTH_TOKEN environment variables are required')
    console.error('Set them in .env or pass them as environment variables')
    process.exit(1)
  }

  const db = createClient({ url: dbUrl, authToken })

  console.log('Running migrations...')

  const schemaPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

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

  console.log('\nMigration complete!')
}

migrate().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
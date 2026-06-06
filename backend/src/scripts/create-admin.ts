import { createClient } from '@libsql/client'

async function createAdmin() {
  const dbUrl = process.env.TURSO_DB_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  const adminEmail = process.env.ADMIN_EMAIL || 'prashantchataut8@gmail.com'

  if (!dbUrl || !authToken) {
    console.error('TURSO_DB_URL and TURSO_AUTH_TOKEN environment variables are required')
    process.exit(1)
  }

  const db = createClient({ url: dbUrl, authToken })

  // Check if user exists
  const existing = await db.execute({
    sql: "SELECT id, email, role FROM users WHERE email = ? AND deleted_at IS NULL",
    args: [adminEmail],
  })

  if (existing.rows.length > 0) {
    // Promote existing user
    await db.execute({
      sql: "UPDATE users SET role = 'SUPER_ADMIN', updated_at = datetime('now') WHERE id = ?",
      args: [existing.rows[0].id as string],
    })
    console.log(`✓ Promoted ${adminEmail} to SUPER_ADMIN`)
  } else {
    // Create placeholder admin user
    const uid = `admin-${Date.now()}`
    await db.execute({
      sql: `INSERT INTO users (id, email, first_name, role, is_active, email_verified, created_at, updated_at)
            VALUES (?, ?, 'Admin', 'SUPER_ADMIN', 1, 1, datetime('now'), datetime('now'))`,
      args: [uid, adminEmail],
    })
    console.log(`✓ Created admin user: ${adminEmail} (placeholder ID: ${uid})`)
    console.log('  When you sign up via Firebase, the system will match by email and use this record.')
  }

  // Verify
  const verify = await db.execute({
    sql: "SELECT id, email, role, is_active FROM users WHERE email = ?",
    args: [adminEmail],
  })
  console.log('Verified:', JSON.stringify(verify.rows[0], null, 2))

  await db.close()
}

createAdmin().catch((error) => {
  console.error('Failed:', error.message)
  process.exit(1)
})
import { createClient } from '@libsql/client'

async function promoteAdmin() {
  const dbUrl = process.env.TURSO_DB_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  const adminEmail = process.env.ADMIN_EMAIL

  if (!dbUrl || !authToken) {
    console.error('TURSO_DB_URL and TURSO_AUTH_TOKEN environment variables are required')
    process.exit(1)
  }

  const db = createClient({ url: dbUrl, authToken })

  if (adminEmail) {
    const result = await db.execute({
      sql: "SELECT id, email, role FROM users WHERE email = ? AND deleted_at IS NULL",
      args: [adminEmail],
    })

    if (result.rows.length === 0) {
      console.error(`No user found with email: ${adminEmail}`)
      console.error('Sign up through the app first, then run this script again.')
      process.exit(1)
    }

    const user = result.rows[0]
    await db.execute({
      sql: "UPDATE users SET role = 'SUPER_ADMIN', updated_at = datetime('now') WHERE id = ?",
      args: [user.id as string],
    })
    console.log(`✓ User ${adminEmail} (${user.id}) promoted to SUPER_ADMIN`)
  } else {
    console.log('No ADMIN_EMAIL provided. Listing all users:')
    const result = await db.execute({
      sql: "SELECT id, email, role FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC",
      args: [],
    })

    if (result.rows.length === 0) {
      console.log('No users found. Sign up through the app first.')
    } else {
      for (const row of result.rows) {
        console.log(`  ${row.email} (${row.id}) — role: ${row.role}`)
      }
      console.log('\nRun again with ADMIN_EMAIL=you@example.com to promote a user to SUPER_ADMIN')
    }
  }

  await db.close()
}

promoteAdmin().catch((error) => {
  console.error('Failed:', error.message)
  process.exit(1)
})
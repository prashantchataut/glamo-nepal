const { createClient } = require('@libsql/client');
const https = require('https');
const fs = require('fs');

const TURSO_ORG = process.env.TURSO_ORG || 'prashantchataut';
const TURSO_DB = process.env.TURSO_DB_NAME || 'glamo-nepal';
const TURSO_PLATFORM_TOKEN = process.env.TURSO_PLATFORM_TOKEN || '';

function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.turso.tech',
      path: `/v1/organizations/${TURSO_ORG}/databases/${TURSO_DB}${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${TURSO_PLATFORM_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function parseSQLStatements(sql) {
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    if (inString) {
      current += ch;
      if (ch === stringChar && sql[i - 1] !== '\\') {
        inString = false;
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }

    if (ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }

    if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += ch;
  }

  const lastTrimmed = current.trim();
  if (lastTrimmed.length > 0) {
    statements.push(lastTrimmed);
  }

  return statements;
}

async function main() {
  console.log('Step 1: Creating database auth token...');
  const tokenResult = await apiRequest('/auth/tokens', 'POST', {
    expiration: '2y',
    permissions: { read: true, write: true }
  });

  if (tokenResult.status !== 200 && tokenResult.status !== 201) {
    console.error('Failed to create token:', tokenResult.status, JSON.stringify(tokenResult.body).substring(0, 500));
    process.exit(1);
  }

  const dbToken = tokenResult.body.jwt;
  console.log('Token created successfully');

  const db = createClient({
    url: process.env.TURSO_DB_URL || 'libsql://your-db-name-your-org.aws-ap-south-1.turso.io',
    authToken: dbToken,
  });

  try {
    console.log('\nStep 2: Testing connection...');
    await db.execute('SELECT 1 as test');
    console.log('Connection OK');

    const tablesBefore = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const existingTables = tablesBefore.rows.map(r => r.name);
    console.log('Tables before schema:', existingTables.length > 0 ? existingTables.join(', ') : '(none)');

    if (existingTables.length > 5) {
      console.log('\nDatabase already has tables! Skipping schema.');
      await db.close();
      process.exit(0);
    }

    console.log('\nStep 3: Running schema...');
    const schema = fs.readFileSync('src/scripts/schema.sql', 'utf8');
    const statements = parseSQLStatements(schema);

    console.log(`Parsed ${statements.length} SQL statements`);

    const createTableStmts = statements.filter(s => s.toUpperCase().startsWith('CREATE TABLE'));
    const createIndexStmts = statements.filter(s => s.toUpperCase().startsWith('CREATE INDEX'));
    const otherStmts = statements.filter(s => !s.toUpperCase().startsWith('CREATE TABLE') && !s.toUpperCase().startsWith('CREATE INDEX'));

    console.log(`  CREATE TABLE: ${createTableStmts.length}`);
    console.log(`  CREATE INDEX: ${createIndexStmts.length}`);
    console.log(`  Other: ${otherStmts.length}`);

    // Run PRAGMA and other statements first
    for (const stmt of otherStmts) {
      try {
        await db.execute(stmt);
      } catch (e) {
        // PRAGMA errors are fine
      }
    }

    // Run CREATE TABLE statements in order
    let tableSuccess = 0;
    let tableErrors = [];
    for (const stmt of createTableStmts) {
      const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1] || 'unknown';
      try {
        await db.execute(stmt);
        tableSuccess++;
        console.log(`  ✓ Created table: ${tableName}`);
      } catch (e) {
        tableErrors.push({ table: tableName, error: e.message });
        console.error(`  ✗ Failed table: ${tableName} — ${e.message.substring(0, 150)}`);
      }
    }
    console.log(`\nCreated ${tableSuccess}/${createTableStmts.length} tables`);

    if (tableErrors.length > 0) {
      console.error('\nTable errors:');
      tableErrors.forEach(e => console.error(`  ${e.table}: ${e.error.substring(0, 200)}`));
    }

    // Run CREATE INDEX statements
    let indexSuccess = 0;
    for (const stmt of createIndexStmts) {
      const idxName = stmt.match(/CREATE INDEX IF NOT EXISTS (\w+)/i)?.[1] || 'unknown';
      try {
        await db.execute(stmt);
        indexSuccess++;
      } catch (e) {
        console.log(`  Index skipped: ${idxName} — ${e.message.substring(0, 80)}`);
      }
    }
    console.log(`Created ${indexSuccess}/${createIndexStmts.length} indexes`);

    // Verify
    const tablesAfter = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const tableList = tablesAfter.rows.map(r => r.name);
    console.log('\nTables created:', tableList.join(', '));
    console.log('Total tables:', tableList.length);

    // Update .env
    console.log('\nStep 4: Updating .env with working auth token...');
    let envContent = fs.readFileSync('.env', 'utf8');
    envContent = envContent.replace(/TURSO_AUTH_TOKEN=.*/, `TURSO_AUTH_TOKEN=${dbToken}`);
    fs.writeFileSync('.env', envContent);
    console.log('.env updated with database auth token');

    await db.close();
    console.log('\n=== Database setup complete! ===');
    console.log('Next: Run "cd backend && npx tsx src/scripts/seed.ts" to seed data');

    if (tableErrors.length > 0) {
      console.error('\n⚠️  Some tables failed to create. Review errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
    try { await db.close(); } catch {}
    process.exit(1);
  }
}

main();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/bytebank';
  const isRemote = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

  console.log(`Connecting to PostgreSQL for migrations...`);

  const client = new Client({
    connectionString,
    ssl: (isRemote || connectionString.includes('sslmode=require')) ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
  } catch (connErr) {
    console.warn('[ByteBank Migration Warning] Could not connect to database at build time:', connErr.message);
    console.warn('Skipping build-time migration. Runtime auto-bootstrap will handle migrations on first request.');
    return;
  }

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const { rows } = await client.query(`SELECT version FROM schema_migrations;`);
    const applied = new Set(rows.map(r => r.version));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`- Migration ${file} already applied, skipping.`);
        continue;
      }

      console.log(`Executing migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      try {
        await client.query(sql);
        await client.query(`INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING;`, [file]);
        console.log(`✓ Migration ${file} applied successfully.`);
      } catch (err) {
        console.error(`Error in migration ${file}:`, err);
        throw err;
      }
    }

    console.log('All migrations checked and up to date.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

runMigrations();

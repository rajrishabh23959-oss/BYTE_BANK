const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runSeed() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/bytebank';
  const isRemote = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

  console.log(`Connecting to PostgreSQL for seed checking...`);

  const client = new Client({
    connectionString,
    ssl: (isRemote || connectionString.includes('sslmode=require')) ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
  } catch (connErr) {
    console.warn('[ByteBank Seed Warning] Could not connect to database at build time:', connErr.message);
    console.warn('Skipping build-time seed. Runtime auto-bootstrap will handle seeding on first request.');
    return;
  }

  try {
    const isForce = process.argv.includes('--force');
    let count = 0;
    try {
      const custCountRes = await client.query(`SELECT count(*) FROM customer;`);
      count = parseInt(custCountRes.rows[0].count, 10);
    } catch {
      count = 0;
    }

    if (count > 0 && !isForce) {
      console.log(`✓ Database already seeded (${count} customers found). Use --force to reload.`);
      try {
        const recRes = await client.query(`
          SELECT
            count(*) AS total_pairs,
            count(*) FILTER (WHERE matched) AS matched_pairs,
            count(*) FILTER (WHERE NOT matched) AS mismatched_pairs
          FROM v_reconciliation;
        `);
        const { total_pairs, matched_pairs, mismatched_pairs } = recRes.rows[0];
        console.log(`✓ Reconciliation Invariant: ${matched_pairs}/${total_pairs} pairs balanced (Mismatches: ${mismatched_pairs})`);
      } catch {}
      return;
    }

    if (isForce) {
      console.log('Force reseed requested. Clearing operational data...');
      await client.query(`
        TRUNCATE notification, access_log, audit_log, asset_reservation, transfer_authorization,
                 risk_assessment_reason, risk_assessment, transfer_request, ledger_entry,
                 asset_transaction, holding, app_user, account, customer, staff, asset, risk_rule,
                 reconciliation_issue, reconciliation_run CASCADE;
      `);
    }

    const seedFile = path.join(__dirname, '..', 'seed', '001_seed_master.sql');
    console.log(`Loading master seed file: ${seedFile}...`);
    const sql = fs.readFileSync(seedFile, 'utf8');

    await client.query(sql);
    console.log('✓ Master seed dataset loaded successfully.');

    try {
      const recRes = await client.query(`
        SELECT
          count(*) AS total_pairs,
          count(*) FILTER (WHERE matched) AS matched_pairs,
          count(*) FILTER (WHERE NOT matched) AS mismatched_pairs
        FROM v_reconciliation;
      `);
      const { total_pairs, matched_pairs, mismatched_pairs } = recRes.rows[0];
      console.log(`✓ Reconciliation Invariant: ${matched_pairs}/${total_pairs} pairs balanced (Mismatches: ${mismatched_pairs})`);

      const custRes = await client.query(`SELECT count(*) FROM customer;`);
      console.log(`✓ Customer Count: ${custRes.rows[0].count} customer master records active.`);
    } catch {}

  } catch (err) {
    console.error('Seed execution failed:', err);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

runSeed();

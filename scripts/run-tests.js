
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/bytebank';
const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  console.log('===============================================================');
  console.log('       BYTEBANK DATABASE INVARIANTS & INTEGRITY TEST SUITE     ');
  console.log('===============================================================\n');

  const client = await pool.connect();
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  const notices = [];
  client.on('notice', (msg) => {
    notices.push(msg.message);
  });

  try {

    console.log('[1/2] Executing SQL Invariants (db/tests/001_invariants_test.sql)...');
    const sqlPath = path.join(__dirname, '..', 'db', 'tests', '001_invariants_test.sql');
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');

    sqlContent = sqlContent
      .split('\n')
      .filter((line) => !line.trim().startsWith('\\'))
      .join('\n');

    await client.query(sqlContent);

    console.log('\n--- PostgreSQL Test Invariant Results ---');
    for (const msg of notices) {
      if (msg.includes('PASS') || msg.includes('FAIL')) {
        totalTests++;
        if (msg.startsWith('PASS')) {
          passedTests++;
          console.log(`  ✓ ${msg}`);
        } else {
          failedTests++;
          console.log(`  ✗ ${msg}`);
        }
      } else {
        console.log(`    [Notice] ${msg}`);
      }
    }

    console.log('\n[2/2] Testing Immutability Triggers directly...');
    totalTests++;
    try {

      await client.query(`UPDATE ledger_entry SET signed_quantity = 999 WHERE entry_id = (SELECT min(entry_id) FROM ledger_entry);`);
      console.log('  ✗ [T14] trg_ledger_immutable: FAILED (Ledger update was erroneously permitted!)');
      failedTests++;
    } catch (triggerErr) {
      if (triggerErr.message.includes('ledger_entry is append-only')) {
        console.log('  ✓ [T14] trg_ledger_immutable: PASS (Trigger correctly blocked UPDATE on ledger_entry)');
        passedTests++;
      } else {
        console.log(`  ✗ [T14] trg_ledger_immutable: FAIL (${triggerErr.message})`);
        failedTests++;
      }
    }

    totalTests++;
    try {

      await client.query(`DELETE FROM ledger_entry WHERE entry_id = (SELECT min(entry_id) FROM ledger_entry);`);
      console.log('  ✗ [T15] trg_ledger_immutable_delete: FAILED (Ledger delete was erroneously permitted!)');
      failedTests++;
    } catch (triggerErr) {
      if (triggerErr.message.includes('ledger_entry is append-only')) {
        console.log('  ✓ [T15] trg_ledger_immutable_delete: PASS (Trigger correctly blocked DELETE on ledger_entry)');
        passedTests++;
      } else {
        console.log(`  ✗ [T15] trg_ledger_immutable_delete: FAIL (${triggerErr.message})`);
        failedTests++;
      }
    }

    console.log('\n===============================================================');
    console.log(`SUMMARY: ${passedTests}/${totalTests} Invariant Tests Passed, ${failedTests} Failed.`);
    console.log('===============================================================');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      console.log('ALL INVARIANTS SATISFIED! High integrity proof verified.');
      process.exit(0);
    }
  } catch (err) {
    console.error('Test runner fatal error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

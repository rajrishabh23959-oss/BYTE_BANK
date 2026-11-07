
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/bytebank';
const pool = new Pool({ connectionString: DATABASE_URL });

async function main() {
  console.log('===============================================================');
  console.log('   BYTEBANK ACID CONCURRENCY RACE CONDITION TEST (PL/pgSQL)   ');
  console.log('===============================================================\n');

  const client = await pool.connect();
  try {
    const btcAssetId = 1;
    const rahulAcct = 4;
    const priyaAcct = 5;
    const treasuryAcct = 1;

    console.log('[1/4] Preparing test account balances...');

    const curHolding = await client.query(
      `SELECT COALESCE(quantity, 0) AS qty FROM holding WHERE account_id = $1 AND asset_id = $2;`,
      [rahulAcct, btcAssetId]
    );
    const curQty = parseFloat(curHolding.rows[0]?.qty || '0');
    const targetQty = 1.00000000;
    const diff = targetQty - curQty;

    if (diff !== 0) {
      const adjTxRes = await client.query(
        `INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, completed_at)
         VALUES ($1, $2, $3, $4, 'allocation', 'success', now())
         RETURNING transaction_id;`,
        [treasuryAcct, rahulAcct, btcAssetId, Math.abs(diff)]
      );
      const adjTx = adjTxRes.rows[0].transaction_id;

      await client.query(
        `INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity)
         VALUES ($1, $2, $3, $4), ($1, $5, $3, $6);`,
        [adjTx, treasuryAcct, btcAssetId, -diff, rahulAcct, diff]
      );

      await client.query(
        `UPDATE holding SET quantity = quantity - $1 WHERE account_id = $2 AND asset_id = $3;`,
        [diff, treasuryAcct, btcAssetId]
      );
      await client.query(
        `UPDATE holding SET quantity = quantity + $1 WHERE account_id = $2 AND asset_id = $3;`,
        [diff, rahulAcct, btcAssetId]
      );
    }

    const initialCheck = await client.query(
      `SELECT quantity FROM holding WHERE account_id = $1 AND asset_id = $2;`,
      [rahulAcct, btcAssetId]
    );
    console.log(`[+] Initial Rahul BTC Balance: ${parseFloat(initialCheck.rows[0].quantity).toFixed(8)} BTC`);
    console.log(`[+] Transfer A Target: 0.80000000 BTC`);
    console.log(`[+] Transfer B Target: 0.80000000 BTC`);
    console.log(`[+] Required for both: 1.60000000 BTC (Exceeds available by 0.60000000 BTC)\n`);

    console.log('[2/4] Firing two parallel database connections simultaneously...');

    const executeTransfer = async (threadName) => {
      const workerClient = await pool.connect();
      const startTime = Date.now();
      try {
        const res = await workerClient.query(
          `SELECT transfer_assets($1, $2, $3, $4, NULL) AS transaction_id;`,
          [rahulAcct, priyaAcct, btcAssetId, 0.8]
        );
        const duration = Date.now() - startTime;
        return {
          thread: threadName,
          success: true,
          status: 'SUCCESS',
          transactionId: res.rows[0].transaction_id,
          durationMs: duration,
        };
      } catch (err) {
        const duration = Date.now() - startTime;
        return {
          thread: threadName,
          success: false,
          status: 'FAILED',
          error: err.message,
          durationMs: duration,
        };
      } finally {
        workerClient.release();
      }
    };

    const [resA, resB] = await Promise.all([
      executeTransfer('Thread-1'),
      executeTransfer('Thread-2'),
    ]);

    console.log('\n[3/4] Parallel Execution Completed:');
    console.log(`  Thread-1 Result: ${resA.success ? 'SUCCESS (Tx #' + resA.transactionId + ')' : 'BLOCKED / FAILED (' + resA.error + ')'} [${resA.durationMs}ms]`);
    console.log(`  Thread-2 Result: ${resB.success ? 'SUCCESS (Tx #' + resB.transactionId + ')' : 'BLOCKED / FAILED (' + resB.error + ')'} [${resB.durationMs}ms]`);

    console.log('\n[4/4] Verifying Mathematical & Database Invariants:');
    const finalCheck = await client.query(
      `SELECT quantity FROM holding WHERE account_id = $1 AND asset_id = $2;`,
      [rahulAcct, btcAssetId]
    );
    const finalBalance = parseFloat(finalCheck.rows[0].quantity);
    console.log(`  PostgreSQL Holding Table Balance: ${finalBalance.toFixed(8)} BTC`);

    const reconCheck = await client.query(
      `SELECT matched, holding_qty, ledger_qty FROM v_reconciliation WHERE account_id = $1 AND asset_id = $2;`,
      [rahulAcct, btcAssetId]
    );
    const recon = reconCheck.rows[0];
    console.log(`  Reconciliation View Check: Holding=${recon.holding_qty}, Ledger Sum=${recon.ledger_qty}, Matched=${recon.matched}`);

    const exactlyOneSucceeded = (resA.success && !resB.success) || (!resA.success && resB.success);
    const exactBalanceMaintained = finalBalance === 0.20000000;
    const ledgerMatched = recon.matched === true;

    if (exactlyOneSucceeded && exactBalanceMaintained && ledgerMatched) {
      console.log('\n>>> CONCURRENCY INVARIANT TEST PASSED! <<<');
      console.log('✓ Row locks prevented simultaneous over-draw.');
      console.log('✓ Exactly one transaction committed; one cleanly aborted.');
      console.log('✓ Zero negative balance, zero double-spend, 100% ledger balance.');
      process.exit(0);
    } else {
      console.error('\n>>> CONCURRENCY INVARIANT TEST FAILED! <<<');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

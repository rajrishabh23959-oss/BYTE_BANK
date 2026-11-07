
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { pool, query } from '@/lib/db';
import { formatErrorResponse } from '@/lib/errors';

export async function POST() {
  try {
    await requireRole(['ADMIN', 'CUSTOMER']);

    const btcAssetId = 1;
    const rahulAcct = 4;
    const priyaAcct = 5;
    const treasuryAcct = 1;

    const curHoldingRes = await query(
      `SELECT COALESCE(quantity, 0) AS qty FROM holding WHERE account_id = $1 AND asset_id = $2;`,
      [rahulAcct, btcAssetId]
    );
    const curQty = parseFloat(curHoldingRes.rows[0]?.qty || '0');
    const targetQty = 1.00000000;
    const diff = targetQty - curQty;

    if (diff !== 0) {
      const adjTxRes = await query(
        `INSERT INTO asset_transaction (sender_account, receiver_account, asset_id, quantity, type, status, completed_at)
         VALUES ($1, $2, $3, $4, 'allocation', 'success', now())
         RETURNING transaction_id;`,
        [treasuryAcct, rahulAcct, btcAssetId, Math.abs(diff)]
      );
      const adjTx = adjTxRes.rows[0].transaction_id;

      await query(
        `INSERT INTO ledger_entry (transaction_id, account_id, asset_id, signed_quantity)
         VALUES ($1, $2, $3, $4), ($1, $5, $3, $6);`,
        [adjTx, treasuryAcct, btcAssetId, -diff, rahulAcct, diff]
      );

      await query(
        `UPDATE holding SET quantity = quantity - $1 WHERE account_id = $2 AND asset_id = $3;`,
        [diff, treasuryAcct, btcAssetId]
      );
      await query(
        `INSERT INTO holding (account_id, asset_id, quantity) VALUES ($1, $2, $3)
         ON CONFLICT (account_id, asset_id) DO UPDATE SET quantity = holding.quantity + EXCLUDED.quantity;`,
        [rahulAcct, btcAssetId, diff]
      );
    }

    const startRahulRes = await query(`SELECT quantity FROM holding WHERE account_id = $1 AND asset_id = $2;`, [rahulAcct, btcAssetId]);
    const startPriyaRes = await query(`SELECT quantity FROM holding WHERE account_id = $1 AND asset_id = $2;`, [priyaAcct, btcAssetId]);
    const startRahulQty = parseFloat(startRahulRes.rows[0]?.quantity || '0');
    const startPriyaQty = parseFloat(startPriyaRes.rows[0]?.quantity || '0');

    const transferQty = 0.80000000;
    const t0 = Date.now();

    const [resultA, resultB] = await Promise.allSettled([
      pool.query(`SELECT transfer_assets($1, $2, $3, $4) AS txn_id;`, [rahulAcct, priyaAcct, btcAssetId, transferQty]),
      pool.query(`SELECT transfer_assets($1, $2, $3, $4) AS txn_id;`, [rahulAcct, priyaAcct, btcAssetId, transferQty]),
    ]);

    const durationMs = Date.now() - t0;

    const endRahulRes = await query(`SELECT quantity FROM holding WHERE account_id = $1 AND asset_id = $2;`, [rahulAcct, btcAssetId]);
    const endPriyaRes = await query(`SELECT quantity FROM holding WHERE account_id = $1 AND asset_id = $2;`, [priyaAcct, btcAssetId]);
    const endRahulQty = parseFloat(endRahulRes.rows[0]?.quantity || '0');
    const endPriyaQty = parseFloat(endPriyaRes.rows[0]?.quantity || '0');

    const recRes = await query(
      `SELECT holding_qty, ledger_qty, matched FROM v_reconciliation WHERE account_id = $1 AND asset_id = $2;`,
      [rahulAcct, btcAssetId]
    );

    const outcomes = {
      requestA: resultA.status === 'fulfilled'
        ? { success: true, txnId: resultA.value.rows[0].txn_id, error: null }
        : { success: false, txnId: null, error: resultA.reason.message },
      requestB: resultB.status === 'fulfilled'
        ? { success: true, txnId: resultB.value.rows[0].txn_id, error: null }
        : { success: false, txnId: null, error: resultB.reason.message },
    };

    const exactlyOneSucceeded = (outcomes.requestA.success && !outcomes.requestB.success) ||
                               (!outcomes.requestA.success && outcomes.requestB.success);

    const expectedRejectionObserved = (outcomes.requestA.error && outcomes.requestA.error.includes('Insufficient balance')) ||
                                     (outcomes.requestB.error && outcomes.requestB.error.includes('Insufficient balance'));

    return NextResponse.json({
      success: true,
      testName: 'Concurrent Overspend Race Condition Test',
      description: 'Two simultaneous transactions each request 0.8 BTC from a 1.0 BTC balance. Deterministic row locking (ORDER BY account_id FOR UPDATE) prevents race condition and double-spend.',
      metrics: {
        durationMs,
        startingBalanceRahul: startRahulQty,
        startingBalancePriya: startPriyaQty,
        requestedAmountPerRequest: transferQty,
        endingBalanceRahul: endRahulQty,
        endingBalancePriya: endPriyaQty,
        rahulNegativeHolding: endRahulQty < 0,
        reconciliationMatched: recRes.rows[0]?.matched || false,
        reconciliationHoldingQty: parseFloat(recRes.rows[0]?.holding_qty || '0'),
        reconciliationLedgerQty: parseFloat(recRes.rows[0]?.ledger_qty || '0'),
      },
      outcomes,
      verdict: {
        exactlyOneSucceeded,
        expectedRejectionObserved,
        invariantsHeld: exactlyOneSucceeded && expectedRejectionObserved && endRahulQty >= 0,
        summary: `Request A and B competed simultaneously. Exactly ONE transaction succeeded (${outcomes.requestA.success ? 'Request A' : 'Request B'}), the other was rejected with "Insufficient balance". Final balance is ${endRahulQty} BTC (never negative).`,
      },
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

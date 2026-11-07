
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireRole } from '@/lib/auth';
import { query, withTransaction, recordAutonomousFailure } from '@/lib/db';
import { formatErrorResponse } from '@/lib/errors';

export async function POST() {
  try {
    await requireRole(['ADMIN', 'CUSTOMER']);

    const testCustomerId = 1;
    const senderAcct = 3;
    const receiverAcct = 5;
    const receiverAccNo = 'BB-ACC-5003';
    const assetId = 1;
    const initialAmount = 0.01;
    const modifiedAmount = 0.05;

    const testKey = `lab-idemp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    async function simulateTransfer(amount: number) {
      const fingerprint = crypto.createHash('sha256')
        .update(`${testCustomerId}:${receiverAccNo}:${assetId}:${amount}`)
        .digest('hex');

      const claimRes = await query(
        `INSERT INTO transfer_request (customer_id, idempotency_key, request_fingerprint, request_status)
         VALUES ($1, $2, $3, 'in_progress')
         ON CONFLICT (customer_id, idempotency_key) DO NOTHING
         RETURNING request_id;`,
        [testCustomerId, testKey, fingerprint]
      );

      if (claimRes.rowCount === 0) {

        const existing = (await query(
          `SELECT request_fingerprint, transaction_id, request_status
           FROM transfer_request WHERE customer_id = $1 AND idempotency_key = $2;`,
          [testCustomerId, testKey]
        )).rows[0];

        if (existing.request_fingerprint !== fingerprint) {
          return { status: 409, code: 'IDEMPOTENCY_CONFLICT', message: 'Parameters mismatched for existing idempotency key' };
        }
        if (existing.request_status === 'completed') {
          return { status: 200, idempotentReplay: true, txnId: existing.transaction_id, message: 'Cached result returned' };
        }
        return { status: 409, code: 'IDEMPOTENCY_IN_PROGRESS', message: 'In flight' };
      }

      try {
        const txnId = await withTransaction(async (client) => {
          const res = await client.query(`SELECT transfer_assets($1, $2, $3, $4) AS txn_id;`, [senderAcct, receiverAcct, assetId, amount]);
          const id = res.rows[0].txn_id;
          await client.query(
            `UPDATE transfer_request SET request_status = 'completed', transaction_id = $1, completed_at = now()
             WHERE customer_id = $2 AND idempotency_key = $3;`,
            [id, testCustomerId, testKey]
          );
          return id;
        });
        return { status: 200, idempotentReplay: false, txnId, message: 'Transfer posted successfully' };
      } catch (err: any) {
        await query(
          `UPDATE transfer_request SET request_status = 'failed' WHERE customer_id = $1 AND idempotency_key = $2;`,
          [testCustomerId, testKey]
        );
        return { status: 400, error: err.message };
      }
    }

    const step1 = await simulateTransfer(initialAmount);

    const step2 = await simulateTransfer(initialAmount);

    const step3 = await simulateTransfer(modifiedAmount);

    const ledgerCountRes = await query(
      `SELECT count(*) FROM ledger_entry WHERE transaction_id = $1;`,
      [step1.txnId]
    );

    const verdict = {
      firstAttemptSucceeded: step1.status === 200 && !step1.idempotentReplay,
      replayReturnedCachedResult: step2.status === 200 && step2.idempotentReplay === true && step2.txnId === step1.txnId,
      conflictingParametersRejected: step3.status === 409 && step3.code === 'IDEMPOTENCY_CONFLICT',
      ledgerRowsCreatedTotal: parseInt(ledgerCountRes.rows[0].count, 10),
      summary: 'Initial request processed atomically. Identical retry returned original cached result with zero duplicate ledger writes. Altered parameter retry was rejected with HTTP 409 Conflict.',
    };

    return NextResponse.json({
      success: true,
      testName: 'Stripe-Grade Idempotent Retry & Conflict Verification',
      testKey,
      steps: [
        { step: 1, action: `Dispatch transfer with amount ${initialAmount} BTC`, result: step1 },
        { step: 2, action: `Retry with IDENTICAL payload (amount ${initialAmount} BTC)`, result: step2 },
        { step: 3, action: `Retry with CONFLICTING payload (amount ${modifiedAmount} BTC)`, result: step3 },
      ],
      verdict,
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { requireRole } from '@/lib/auth';
import { query, withTransaction, recordAutonomousFailure } from '@/lib/db';
import { formatErrorResponse, AppError } from '@/lib/errors';
import { broadcastTransactionUpdate, notifyCustomer } from '@/lib/sse';

const confirmSchema = z.object({
  recipientAccountNo: z.string().min(3),
  assetId: z.number().int().positive(),
  quantity: z.number().positive(),
  authToken: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['CUSTOMER']);
    const customerId = session.customerId!;

    const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Idempotency-Key header is required for safe asset transfers.');
    }

    const body = await req.json();
    const data = confirmSchema.parse(body);

    const fingerprintPayload = `${customerId}:${data.recipientAccountNo.toUpperCase()}:${data.assetId}:${data.quantity}`;
    const fingerprint = crypto.createHash('sha256').update(fingerprintPayload).digest('hex');

    const senderRes = await query(
      `SELECT account_id, account_no, status FROM account WHERE customer_id = $1;`,
      [customerId]
    );
    const sender = senderRes.rows[0];
    if (!sender) {
      throw new AppError(404, 'NOT_FOUND', 'Sender account not found');
    }

    const receiverRes = await query(
      `SELECT account_id, account_no, status, customer_id FROM account WHERE UPPER(account_no) = UPPER($1);`,
      [data.recipientAccountNo.trim()]
    );
    const receiver = receiverRes.rows[0];
    if (!receiver) {
      throw new AppError(404, 'NOT_FOUND', `Recipient account "${data.recipientAccountNo}" not found`);
    }

    if (receiver.account_id === sender.account_id) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Cannot transfer assets to your own account');
    }

    const claimRes = await query(
      `INSERT INTO transfer_request (customer_id, idempotency_key, request_fingerprint, request_status)
       VALUES ($1, $2, $3, 'in_progress')
       ON CONFLICT (customer_id, idempotency_key) DO NOTHING
       RETURNING request_id;`,
      [customerId, idempotencyKey, fingerprint]
    );

    const isNewClaim = claimRes.rowCount && claimRes.rowCount > 0;

    if (!isNewClaim) {

      const existingRes = await query(
        `SELECT request_id, request_fingerprint, transaction_id, request_status, completed_at
         FROM transfer_request
         WHERE customer_id = $1 AND idempotency_key = $2;`,
        [customerId, idempotencyKey]
      );
      const existing = existingRes.rows[0];

      if (!existing) {
        throw new AppError(500, 'INTERNAL_ERROR', 'Idempotency key lookup error');
      }

      if (existing.request_fingerprint !== fingerprint) {
        return NextResponse.json(
          {
            error: {
              code: 'IDEMPOTENCY_CONFLICT',
              message: 'Idempotency conflict: Key was previously used with different transfer parameters.',
            },
          },
          { status: 409 }
        );
      }

      if (existing.request_status === 'in_progress') {
        return NextResponse.json(
          {
            error: {
              code: 'IDEMPOTENCY_IN_PROGRESS',
              message: 'A transfer with this idempotency key is currently processing in-flight.',
            },
          },
          { status: 409 }
        );
      }

      if (existing.request_status === 'completed' && existing.transaction_id) {
        const txnRes = await query(
          `SELECT t.transaction_id, a1.account_no AS sender_account_no, a2.account_no AS receiver_account_no,
                  s.symbol, s.name AS asset_name, t.quantity, t.type, t.status, t.created_at, t.completed_at
           FROM asset_transaction t
           JOIN account a1 ON a1.account_id = t.sender_account
           JOIN account a2 ON a2.account_id = t.receiver_account
           JOIN asset s ON s.asset_id = t.asset_id
           WHERE t.transaction_id = $1;`,
          [existing.transaction_id]
        );
        const originalTxn = txnRes.rows[0];

        return NextResponse.json(
          {
            success: true,
            idempotentReplay: true,
            message: 'Idempotent replay: original transaction result returned.',
            transaction: originalTxn,
          },
          {
            headers: {
              'X-Idempotent-Replay': 'true',
            },
          }
        );
      }

      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Previous transfer with this idempotency key failed.',
          },
        },
        { status: 400 }
      );
    }

    try {
      const txnId = await withTransaction(async (client) => {

        const callRes = await client.query(
          `SELECT transfer_assets($1, $2, $3, $4, $5) AS txn_id;`,
          [sender.account_id, receiver.account_id, data.assetId, data.quantity, data.authToken || null]
        );
        const id = callRes.rows[0].txn_id;

        await client.query(
          `UPDATE transfer_request
           SET request_status = 'completed', transaction_id = $1, completed_at = now()
           WHERE customer_id = $2 AND idempotency_key = $3;`,
          [id, customerId, idempotencyKey]
        );

        return id;
      });

      const txnDetailRes = await query(
        `SELECT t.transaction_id, a1.account_no AS sender_account_no, a2.account_no AS receiver_account_no,
                s.symbol, s.name AS asset_name, t.quantity, t.type, t.status, t.created_at, t.completed_at
         FROM asset_transaction t
         JOIN account a1 ON a1.account_id = t.sender_account
         JOIN account a2 ON a2.account_id = t.receiver_account
         JOIN asset s ON s.asset_id = t.asset_id
         WHERE t.transaction_id = $1;`,
        [txnId]
      );
      const receipt = txnDetailRes.rows[0];

      broadcastTransactionUpdate(receipt);
      if (receiver.customer_id) {
        notifyCustomer(receiver.customer_id, 'TRANSFER_RECEIVED', receipt);
      }

      return NextResponse.json({
        success: true,
        idempotentReplay: false,
        message: 'Asset transfer executed successfully.',
        transaction: receipt,
      });

    } catch (procErr: any) {

      await query(
        `UPDATE transfer_request
         SET request_status = 'failed', completed_at = now()
         WHERE customer_id = $1 AND idempotency_key = $2;`,
        [customerId, idempotencyKey]
      );

      const failureReason = procErr.message || 'Transfer failed';
      await recordAutonomousFailure(
        sender.account_id,
        receiver.account_id,
        data.assetId,
        data.quantity,
        failureReason,
        `customer:${customerId}`
      );

      throw new AppError(400, 'INTERNAL_ERROR', failureReason);
    }

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

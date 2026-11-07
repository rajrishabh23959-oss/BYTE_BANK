
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse, AppError } from '@/lib/errors';
import { broadcastTransactionUpdate } from '@/lib/sse';

const swapConfirmSchema = z.object({
  fromAssetId: z.number().int().positive(),
  toAssetId: z.number().int().positive(),
  fromQuantity: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['CUSTOMER']);
    const customerId = session.customerId!;

    const body = await req.json();
    const data = swapConfirmSchema.parse(body);

    const accRes = await query(`SELECT account_id, status FROM account WHERE customer_id = $1;`, [customerId]);
    const account = accRes.rows[0];
    if (!account) throw new AppError(404, 'NOT_FOUND', 'Customer account not found');

    const swapRes = await query(
      `SELECT simulated_swap($1, $2, $3, $4) AS swap_group;`,
      [account.account_id, data.fromAssetId, data.toAssetId, data.fromQuantity]
    );

    const swapGroup = swapRes.rows[0]?.swap_group;

    const txnsRes = await query(
      `SELECT t.transaction_id, a1.account_no AS sender_account_no, a2.account_no AS receiver_account_no,
              s.symbol, s.name AS asset_name, t.quantity, t.type, t.status, t.created_at
       FROM asset_transaction t
       JOIN account a1 ON a1.account_id = t.sender_account
       JOIN account a2 ON a2.account_id = t.receiver_account
       JOIN asset s ON s.asset_id = t.asset_id
       WHERE t.swap_group = $1
       ORDER BY t.transaction_id ASC;`,
      [swapGroup]
    );

    const legs = txnsRes.rows;
    for (const leg of legs) {
      broadcastTransactionUpdate(leg);
    }

    return NextResponse.json({
      success: true,
      swapGroup,
      message: 'Simulated swap completed successfully against Market Maker.',
      legs,
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

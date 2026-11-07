
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse, AppError } from '@/lib/errors';

const previewSchema = z.object({
  recipientAccountNo: z.string().min(3),
  assetId: z.number().int().positive(),
  quantity: z.number().positive(),
});

function maskString(str: string): string {
  if (!str) return '***';
  const parts = str.trim().split(' ');
  return parts.map(p => {
    if (p.length <= 2) return p + '*';
    return p.slice(0, 2) + '*'.repeat(Math.max(2, p.length - 2));
  }).join(' ');
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['CUSTOMER']);
    const customerId = session.customerId!;

    const body = await req.json();
    const data = previewSchema.parse(body);

    const senderRes = await query(
      `SELECT account_id, account_no, status FROM account WHERE customer_id = $1;`,
      [customerId]
    );
    const sender = senderRes.rows[0];
    if (!sender) {
      throw new AppError(404, 'NOT_FOUND', 'Sender account not found');
    }

    const receiverRes = await query(
      `SELECT a.account_id, a.account_no, a.status, c.full_name, c.address
       FROM account a
       LEFT JOIN customer c ON c.customer_id = a.customer_id
       WHERE UPPER(a.account_no) = UPPER($1);`,
      [data.recipientAccountNo.trim()]
    );
    const receiver = receiverRes.rows[0];
    if (!receiver) {
      throw new AppError(404, 'NOT_FOUND', `Recipient account "${data.recipientAccountNo}" not found`);
    }

    if (receiver.account_id === sender.account_id) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Cannot transfer assets to your own account');
    }

    const assetRes = await query(
      `SELECT asset_id, name, symbol, type, sim_ref_price, quantity_scale
       FROM asset WHERE asset_id = $1;`,
      [data.assetId]
    );
    const asset = assetRes.rows[0];
    if (!asset) {
      throw new AppError(404, 'NOT_FOUND', 'Asset not found');
    }

    const availRes = await query(
      `SELECT total_qty, reserved_qty, available_qty
       FROM v_available_quantity
       WHERE account_id = $1 AND asset_id = $2;`,
      [sender.account_id, data.assetId]
    );
    const totalQty = parseFloat(availRes.rows[0]?.total_qty || '0');
    const reservedQty = parseFloat(availRes.rows[0]?.reserved_qty || '0');
    const availableQty = parseFloat(availRes.rows[0]?.available_qty || '0');
    const resultingAvailableQty = Math.max(0, availableQty - data.quantity);

    const riskRes = await query(
      `SELECT assessment_id, outcome, auth_token, reasons
       FROM assess_transfer_risk($1, $2, $3, $4);`,
      [sender.account_id, receiver.account_id, data.assetId, data.quantity]
    );

    const assessment = riskRes.rows[0];
    const outcome = assessment.outcome as 'ALLOW' | 'REQUIRE_EXTRA_CONFIRMATION' | 'REJECT';
    const reasons: string[] = assessment.reasons || [];
    const authToken = assessment.auth_token;

    const maskedRecipient = {
      accountNo: receiver.account_no,
      ownerMasked: receiver.full_name ? maskString(receiver.full_name) : 'ByteBank System Treasury',
      addressMasked: receiver.address ? maskString(receiver.address) : 'System Address',
    };

    return NextResponse.json({
      success: true,
      preview: {
        assessmentId: assessment.assessment_id,
        outcome,
        riskScreeningLabel: 'rule-based risk screening',
        reasons,
        authToken: outcome !== 'REJECT' ? authToken : null,
        asset: {
          assetId: asset.asset_id,
          name: asset.name,
          symbol: asset.symbol,
          type: asset.type,
          scale: asset.quantity_scale,
          simRefPrice: parseFloat(asset.sim_ref_price),
        },
        transferQuantity: data.quantity,
        currentAvailableQuantity: availableQty,
        resultingAvailableQuantity: resultingAvailableQty,
        reservedQuantity: reservedQty,
        totalHoldings: totalQty,
        recipient: maskedRecipient,
        simulatedValueSru: parseFloat((data.quantity * parseFloat(asset.sim_ref_price)).toFixed(2)),
      },
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

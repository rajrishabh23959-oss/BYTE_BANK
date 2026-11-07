
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse, AppError } from '@/lib/errors';

const reserveSchema = z.object({
  assetId: z.number().int().positive(),
  quantity: z.number().positive(),
  durationSeconds: z.number().int().min(60).max(86400).default(900),
});

export async function GET() {
  try {
    const session = await requireRole(['CUSTOMER']);
    const customerId = session.customerId!;

    const accRes = await query(`SELECT account_id FROM account WHERE customer_id = $1;`, [customerId]);
    const accountId = accRes.rows[0]?.account_id;
    if (!accountId) return NextResponse.json({ reservations: [] });

    await query(`SELECT expire_reservations();`);

    const res = await query(
      `SELECT r.reservation_id, r.asset_id, s.symbol, s.name AS asset_name,
              r.quantity, r.status, r.expires_at, r.created_at,
              (r.expires_at > now() AND r.status = 'active') AS is_live
       FROM asset_reservation r
       JOIN asset s ON s.asset_id = r.asset_id
       WHERE r.account_id = $1
       ORDER BY r.created_at DESC;`,
      [accountId]
    );

    return NextResponse.json({ reservations: res.rows });
  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['CUSTOMER']);
    const customerId = session.customerId!;

    const body = await req.json();
    const data = reserveSchema.parse(body);

    const accRes = await query(`SELECT account_id, status FROM account WHERE customer_id = $1;`, [customerId]);
    const account = accRes.rows[0];
    if (!account) throw new AppError(404, 'NOT_FOUND', 'Customer account not found');

    const res = await query(
      `SELECT reserve_asset($1, $2, $3, NULL, $4) AS reservation_id;`,
      [account.account_id, data.assetId, data.quantity, data.durationSeconds]
    );

    return NextResponse.json({
      success: true,
      reservationId: res.rows[0].reservation_id,
      message: 'Asset reservation placed successfully.',
    });
  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireRole(['CUSTOMER']);
    const url = new URL(req.url);
    const reservationId = url.searchParams.get('id');

    if (!reservationId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Reservation ID required');
    }

    const res = await query(
      `SELECT release_reservation($1) AS released;`,
      [parseInt(reservationId, 10)]
    );

    return NextResponse.json({
      success: true,
      released: res.rows[0]?.released || false,
    });
  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

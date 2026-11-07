
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {

    await requireRole(['AUDITOR', 'ADMIN']);

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const symbol = url.searchParams.get('symbol');
    const status = url.searchParams.get('status');
    const searchAccount = url.searchParams.get('account');

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (symbol) {
      conditions.push(`symbol = $${pIdx++}`);
      params.push(symbol);
    }
    if (status) {
      conditions.push(`txn_status = $${pIdx++}`);
      params.push(status);
    }
    if (searchAccount) {
      conditions.push(`(sender_account_no ILIKE $${pIdx} OR receiver_account_no ILIKE $${pIdx})`);
      params.push(`%${searchAccount}%`);
      pIdx++;
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT count(*) FROM v_auditor_transactions ${whereSql};`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    const listRes = await query(
      `SELECT transaction_id, sender_account_no, receiver_account_no, symbol, asset_type,
              quantity, txn_type, txn_status, failure_reason, created_at, completed_at
       FROM v_auditor_transactions
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx++};`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      transactions: listRes.rows,
      total,
      page,
      limit,
      totalPages,
      privacyGuarantee: 'Privacy Masked: Zero Customer PII Exposed',
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['CUSTOMER']);
    const customerId = session.customerId!;

    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const accRes = await query(`SELECT account_id, account_no FROM account WHERE customer_id = $1;`, [customerId]);
    const account = accRes.rows[0];
    if (!account) return NextResponse.json({ statement: [] });

    const conditions = [`account_id = $1`];
    const params: any[] = [account.account_id];
    let pIdx = 2;

    if (startDate) {
      conditions.push(`posted_at >= $${pIdx++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`posted_at <= $${pIdx++}`);
      params.push(endDate);
    }

    const res = await query(
      `SELECT entry_id, posted_at, symbol, asset_name, signed_quantity,
              transaction_id, txn_type, txn_status, counterparty_account_no, reversal_of_entry_id
       FROM v_customer_statement
       WHERE ${conditions.join(' AND ')}
       ORDER BY posted_at DESC;`,
      params
    );

    return NextResponse.json({
      accountNo: account.account_no,
      entries: res.rows,
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

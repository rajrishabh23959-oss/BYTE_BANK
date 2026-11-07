
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['CUSTOMER']);
    const customerId = session.customerId!;

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const assetId = url.searchParams.get('assetId');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const format = url.searchParams.get('format');

    const accRes = await query(`SELECT account_id FROM account WHERE customer_id = $1;`, [customerId]);
    const accountId = accRes.rows[0]?.account_id;
    if (!accountId) {
      return NextResponse.json({ transactions: [], total: 0, page, totalPages: 0 });
    }

    const whereClauses: string[] = [
      `(t.sender_account = $1 OR t.receiver_account = $1)`
    ];
    const params: any[] = [accountId];
    let pIdx = 2;

    if (assetId) {
      whereClauses.push(`t.asset_id = $${pIdx++}`);
      params.push(parseInt(assetId, 10));
    }
    if (type) {
      whereClauses.push(`t.type = $${pIdx++}`);
      params.push(type);
    }
    if (status) {
      whereClauses.push(`t.status = $${pIdx++}`);
      params.push(status);
    }
    if (startDate) {
      whereClauses.push(`t.created_at >= $${pIdx++}`);
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push(`t.created_at <= $${pIdx++}`);
      params.push(endDate);
    }

    const whereSql = whereClauses.join(' AND ');

    if (format === 'csv') {
      const exportRes = await query(
        `SELECT t.transaction_id, a1.account_no AS sender_account, a2.account_no AS receiver_account,
                s.symbol AS asset_symbol, s.name AS asset_name, t.quantity, t.type, t.status,
                t.failure_reason, t.created_at, t.completed_at
         FROM asset_transaction t
         LEFT JOIN account a1 ON a1.account_id = t.sender_account
         JOIN account a2 ON a2.account_id = t.receiver_account
         JOIN asset s ON s.asset_id = t.asset_id
         WHERE ${whereSql}
         ORDER BY t.created_at DESC;`,
        params
      );

      const header = 'Transaction_ID,Sender_Account,Receiver_Account,Asset,Quantity,Type,Status,Failure_Reason,Created_At,Completed_At\n';
      const rows = exportRes.rows.map(r =>
        `"${r.transaction_id}","${r.sender_account || 'EXTERNAL_MARKET'}","${r.receiver_account}","${r.asset_symbol}",${r.quantity},"${r.type}","${r.status}","${r.failure_reason || ''}","${r.created_at}","${r.completed_at || ''}"`
      ).join('\n');

      return new NextResponse(header + rows, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="bytebank_transactions_${accountId}.csv"`,
        },
      });
    }

    const countRes = await query(
      `SELECT count(*) FROM asset_transaction t WHERE ${whereSql};`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    const listRes = await query(
      `SELECT t.transaction_id, a1.account_no AS sender_account_no, a2.account_no AS receiver_account_no,
              s.symbol, s.name AS asset_name, s.type AS asset_type, t.quantity, t.type, t.status,
              t.failure_reason, t.swap_group, t.created_at, t.completed_at,
              CASE WHEN t.sender_account = $1 THEN 'DEBIT' ELSE 'CREDIT' END AS direction
       FROM asset_transaction t
       LEFT JOIN account a1 ON a1.account_id = t.sender_account
       JOIN account a2 ON a2.account_id = t.receiver_account
       JOIN asset s ON s.asset_id = t.asset_id
       WHERE ${whereSql}
       ORDER BY t.created_at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx++};`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      transactions: listRes.rows,
      total,
      page,
      limit,
      totalPages,
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';
import { formatErrorResponse, AppError } from '@/lib/errors';
import { notifyCustomer } from '@/lib/sse';

const freezeSchema = z.object({
  accountId: z.number().int().positive(),
  status: z.enum(['active', 'frozen']),
  reason: z.string().min(3),
});

export async function GET() {
  try {
    await requireRole(['ADMIN']);

    const res = await query(`
      SELECT
        a.account_id, a.account_no, a.customer_id, a.is_system, a.account_type, a.status, a.created_at,
        c.full_name, c.email, c.kyc_status,
        COUNT(h.asset_id) AS holding_count,
        COALESCE(SUM(h.quantity * ast.sim_ref_price), 0) AS estimated_valuation_sru
      FROM account a
      LEFT JOIN customer c ON c.customer_id = a.customer_id
      LEFT JOIN holding h ON h.account_id = a.account_id
      LEFT JOIN asset ast ON ast.asset_id = h.asset_id
      GROUP BY a.account_id, a.account_no, a.customer_id, a.is_system, a.account_type, a.status, a.created_at,
               c.full_name, c.email, c.kyc_status
      ORDER BY a.account_id ASC;
    `);

    return NextResponse.json({ accounts: res.rows });
  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN']);
    const body = await req.json();
    const data = freezeSchema.parse(body);

    const result = await withTransaction(async (client) => {
      await client.query(`SET LOCAL bytebank.current_actor = $1;`, [`admin:${session.staffId || session.username}`]);

      const accRes = await client.query(
        `UPDATE account SET status = $1 WHERE account_id = $2
         RETURNING account_id, account_no, customer_id, status;`,
        [data.status, data.accountId]
      );
      const acc = accRes.rows[0];
      if (!acc) throw new AppError(404, 'NOT_FOUND', 'Account not found');

      await client.query(
        `INSERT INTO audit_log (actor, action, resource, new_value)
         VALUES ($1, 'ACCOUNT_STATUS_CHANGE', 'account:' || $2, jsonb_build_object(
           'status', $3,
           'reason', $4
         ));`,
        [`admin:${session.staffId || session.username}`, acc.account_no, data.status, data.reason]
      );

      if (acc.customer_id) {
        const notifTitle = data.status === 'frozen' ? 'Account Restricted' : 'Account Re-Activated';
        const notifBody = data.status === 'frozen'
          ? `Your account ${acc.account_no} was frozen by compliance: ${data.reason}`
          : `Your account ${acc.account_no} has been restored to active status: ${data.reason}`;

        await client.query(
          `INSERT INTO notification (customer_id, type, title, body)
           VALUES ($1, 'ACCOUNT_STATUS', $2, $3);`,
          [acc.customer_id, notifTitle, notifBody]
        );
      }

      return acc;
    });

    if (result.customer_id) {
      notifyCustomer(result.customer_id, 'ACCOUNT_STATUS_UPDATE', result);
    }

    return NextResponse.json({
      success: true,
      account: result,
      message: `Account status updated to ${data.status}.`,
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

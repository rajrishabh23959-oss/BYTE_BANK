
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';
import { formatErrorResponse, AppError } from '@/lib/errors';
import { notifyCustomer } from '@/lib/sse';

const kycUpdateSchema = z.object({
  customerId: z.number().int().positive(),
  status: z.enum(['verified', 'rejected', 'pending']),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN']);

    const url = new URL(req.url);
    const filterStatus = url.searchParams.get('status');

    let sql = `
      SELECT c.customer_id, c.full_name, c.phone, c.email, c.address, c.date_of_birth,
             c.id_proof_last4, c.id_proof_hash, c.kyc_status, c.created_at,
             a.account_id, a.account_no, a.status AS account_status
      FROM customer c
      LEFT JOIN account a ON a.customer_id = c.customer_id
    `;
    const params: any[] = [];

    if (filterStatus) {
      sql += ` WHERE c.kyc_status = $1`;
      params.push(filterStatus);
    }

    sql += ` ORDER BY c.created_at DESC;`;

    const res = await query(sql, params);
    return NextResponse.json({ queue: res.rows });
  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN']);
    const body = await req.json();
    const data = kycUpdateSchema.parse(body);

    const result = await withTransaction(async (client) => {

      await client.query(`SET LOCAL bytebank.current_actor = $1;`, [`admin:${session.staffId || session.username}`]);

      const custRes = await client.query(
        `UPDATE customer SET kyc_status = $1 WHERE customer_id = $2
         RETURNING customer_id, full_name, kyc_status;`,
        [data.status, data.customerId]
      );
      const cust = custRes.rows[0];
      if (!cust) throw new AppError(404, 'NOT_FOUND', 'Customer record not found');

      const notifBody = data.status === 'verified'
        ? 'Your KYC documents have been reviewed and verified by compliance. Full transfer features unlocked.'
        : `Your KYC verification was rejected: ${data.reason || 'Document mismatch'}`;

      await client.query(
        `INSERT INTO notification (customer_id, type, title, body)
         VALUES ($1, 'KYC_STATUS', 'KYC Review Complete', $2);`,
        [data.customerId, notifBody]
      );

      return cust;
    });

    notifyCustomer(data.customerId, 'KYC_UPDATE', result);

    return NextResponse.json({
      success: true,
      customer: result,
      message: `Customer KYC status updated to ${data.status}.`,
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

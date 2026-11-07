
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';
import { formatErrorResponse, AppError } from '@/lib/errors';

const lookupSchema = z.object({
  customerId: z.number().int().positive(),
  purposeCode: z.enum(['KYC_VERIFICATION', 'FRAUD_INVESTIGATION', 'ACCOUNT_SERVICING', 'CUSTOMER_SUPPORT_INQUIRY', 'COURT_ORDER_LEGAL', 'AUDIT_COMPLIANCE_REVIEW', 'AUDIT_INSPECTION']),
  requestRef: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN']);
    const staffId = session.staffId || 1;

    const body = await req.json();
    const data = lookupSchema.parse(body);

    const ref = data.requestRef || `REQ-${Date.now().toString(36).toUpperCase()}`;

    const result = await withTransaction(async (client) => {

      await client.query(
        `INSERT INTO access_log (staff_id, resource_id, data_category, purpose_code, accessed_at, request_ref)
         VALUES ($1, $2, 'CUSTOMER_PII_PROFILE', $3, now(), $4);`,
        [staffId, `customer:${data.customerId}`, data.purposeCode, ref]
      );

      const custRes = await client.query(
        `SELECT customer_id, full_name, phone, email, address, date_of_birth, id_proof_last4, id_proof_hash, kyc_status, created_at
         FROM customer WHERE customer_id = $1;`,
        [data.customerId]
      );
      const customer = custRes.rows[0];
      if (!customer) throw new AppError(404, 'NOT_FOUND', 'Customer record not found');

      const accRes = await client.query(
        `SELECT account_id, account_no, status, account_type, created_at FROM account WHERE customer_id = $1;`,
        [customer.customer_id]
      );
      const account = accRes.rows[0];

      let holdings: any[] = [];
      let recentTransactions: any[] = [];

      if (account) {
        const holdRes = await client.query(
          `SELECT h.asset_id, ast.name, ast.symbol, ast.type, h.quantity,
                  (h.quantity * ast.sim_ref_price) AS valuation_sru
           FROM holding h
           JOIN asset ast ON ast.asset_id = h.asset_id
           WHERE h.account_id = $1;`,
          [account.account_id]
        );
        holdings = holdRes.rows;

        const txnRes = await client.query(
          `SELECT t.transaction_id, a1.account_no AS sender_account, a2.account_no AS receiver_account,
                  s.symbol, t.quantity, t.type, t.status, t.failure_reason, t.created_at
           FROM asset_transaction t
           LEFT JOIN account a1 ON a1.account_id = t.sender_account
           JOIN account a2 ON a2.account_id = t.receiver_account
           JOIN asset s ON s.asset_id = t.asset_id
           WHERE t.sender_account = $1 OR t.receiver_account = $1
           ORDER BY t.created_at DESC LIMIT 10;`,
          [account.account_id]
        );
        recentTransactions = txnRes.rows;
      }

      return {
        customer,
        account,
        holdings,
        recentTransactions,
        accessAudit: {
          logged: true,
          staffId,
          purposeCode: data.purposeCode,
          requestRef: ref,
          timestamp: new Date().toISOString(),
        },
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

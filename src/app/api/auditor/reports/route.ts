
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse } from '@/lib/errors';

export async function GET() {
  try {
    await requireRole(['AUDITOR', 'ADMIN']);

    const failedByMonthRes = await query(`
      SELECT month, status, failure_reason, n
      FROM v_failed_by_month
      ORDER BY month DESC;
    `);

    const statusBreakdownRes = await query(`
      SELECT status, count(*) AS count, count(*) * 100.0 / sum(count(*)) over() AS percentage
      FROM asset_transaction
      GROUP BY status;
    `);

    const assetVolumeRes = await query(`
      SELECT s.symbol, s.type, count(t.transaction_id) AS txn_count,
             COALESCE(SUM(t.quantity), 0) AS total_quantity,
             COALESCE(SUM(t.quantity * s.sim_ref_price), 0) AS total_simulated_volume_sru
      FROM asset s
      LEFT JOIN asset_transaction t ON t.asset_id = s.asset_id AND t.status = 'success'
      GROUP BY s.symbol, s.type
      ORDER BY total_simulated_volume_sru DESC;
    `);

    const riskStatsRes = await query(`
      SELECT outcome, count(*) AS count
      FROM risk_assessment
      GROUP BY outcome;
    `);

    const totalsRes = await query(`
      SELECT
        (SELECT count(*) FROM customer) AS customer_count,
        (SELECT count(*) FROM account WHERE NOT is_system) AS account_count,
        (SELECT count(*) FROM asset_transaction) AS total_transactions,
        (SELECT count(*) FROM ledger_entry) AS total_ledger_entries,
        (SELECT count(*) FROM audit_log) AS total_audit_logs,
        (SELECT count(*) FROM access_log) AS total_access_logs;
    `);

    return NextResponse.json({
      failedByMonth: failedByMonthRes.rows,
      statusBreakdown: statusBreakdownRes.rows,
      assetVolumes: assetVolumeRes.rows,
      riskStats: riskStatsRes.rows,
      totals: totalsRes.rows[0],
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

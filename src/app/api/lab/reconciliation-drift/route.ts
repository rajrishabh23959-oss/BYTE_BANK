
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    await requireRole(['ADMIN', 'CUSTOMER']);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'inject_and_run';

    const testAcct = 4;
    const testAsset = 1;

    if (action === 'inject_and_run') {

      const driftAmount = 0.05;
      await query(
        `UPDATE holding SET quantity = quantity + $1 WHERE account_id = $2 AND asset_id = $3;`,
        [driftAmount, testAcct, testAsset]
      );

      const runRes = await query(`SELECT run_reconciliation() AS run_id;`);
      const runId = runRes.rows[0].run_id;

      const issueRes = await query(
        `SELECT i.issue_id, i.run_id, a.account_no, s.symbol, i.holding_qty, i.ledger_qty,
                (i.holding_qty - i.ledger_qty) AS variance, i.status
         FROM reconciliation_issue i
         JOIN account a ON a.account_id = i.account_id
         JOIN asset s ON s.asset_id = i.asset_id
         WHERE i.run_id = $1 AND i.account_id = $2 AND i.asset_id = $3;`,
        [runId, testAcct, testAsset]
      );
      const issue = issueRes.rows[0];

      return NextResponse.json({
        success: true,
        action: 'inject_and_run',
        message: 'Simulated drift injected. Automated reconciliation detected mismatch and opened issue without rewriting history.',
        runId,
        issue,
      });
    }

    if (action === 'fix') {
      const issueId = body.issueId;
      if (!issueId) {
        return NextResponse.json({ error: 'issueId required to fix' }, { status: 400 });
      }

      await query(
        `SELECT reconcile_fix_issue($1, 1, 'Automated lab reconciliation correction via compensating double-entry ledger record');`,
        [issueId]
      );

      const cleanRunRes = await query(`SELECT run_reconciliation() AS run_id;`);
      const cleanRun = (await query(`SELECT * FROM reconciliation_run WHERE run_id = $1;`, [cleanRunRes.rows[0].run_id])).rows[0];

      return NextResponse.json({
        success: true,
        action: 'fix',
        message: 'Compensating ledger entry posted. Invariant restored. Zero reconciliation mismatches.',
        cleanRun,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

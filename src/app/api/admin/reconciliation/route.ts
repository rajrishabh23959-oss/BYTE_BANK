
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse, AppError } from '@/lib/errors';

const fixIssueSchema = z.object({
  issueId: z.number().int().positive(),
  resolutionNote: z.string().min(5),
});

export async function GET() {
  try {
    await requireRole(['ADMIN', 'AUDITOR']);

    const summaryRes = await query(`
      SELECT
        count(*) AS total_pairs,
        count(*) FILTER (WHERE matched) AS matched_pairs,
        count(*) FILTER (WHERE NOT matched) AS mismatched_pairs
      FROM v_reconciliation;
    `);

    const runsRes = await query(`
      SELECT run_id, started_at, finished_at, pairs_checked, issues_found
      FROM reconciliation_run
      ORDER BY run_id DESC LIMIT 10;
    `);

    const issuesRes = await query(`
      SELECT i.issue_id, i.run_id, i.account_id, a.account_no, i.asset_id, s.symbol, s.name AS asset_name,
             i.holding_qty, i.ledger_qty, (i.holding_qty - i.ledger_qty) AS variance,
             i.status, i.resolution_note, i.resolved_at
      FROM reconciliation_issue i
      JOIN account a ON a.account_id = i.account_id
      JOIN asset s ON s.asset_id = i.asset_id
      ORDER BY i.issue_id DESC LIMIT 25;
    `);

    return NextResponse.json({
      summary: summaryRes.rows[0],
      runs: runsRes.rows,
      issues: issuesRes.rows,
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST() {
  try {
    await requireRole(['ADMIN']);

    const runRes = await query(`SELECT run_reconciliation() AS run_id;`);
    const runId = runRes.rows[0].run_id;

    const detailRes = await query(
      `SELECT run_id, started_at, finished_at, pairs_checked, issues_found
       FROM reconciliation_run WHERE run_id = $1;`,
      [runId]
    );

    return NextResponse.json({
      success: true,
      message: 'Reconciliation run completed successfully against real PostgreSQL ledger.',
      run: detailRes.rows[0],
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN']);
    const staffId = session.staffId || 1;

    const body = await req.json();
    const data = fixIssueSchema.parse(body);

    const res = await query(
      `SELECT reconcile_fix_issue($1, $2, $3) AS resolved;`,
      [data.issueId, staffId, data.resolutionNote]
    );

    const resolved = res.rows[0]?.resolved;
    if (!resolved) {
      throw new AppError(400, 'INTERNAL_ERROR', 'Failed to resolve reconciliation issue');
    }

    return NextResponse.json({
      success: true,
      message: 'Reconciliation issue resolved: compensatory ledger entry posted without altering past history.',
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

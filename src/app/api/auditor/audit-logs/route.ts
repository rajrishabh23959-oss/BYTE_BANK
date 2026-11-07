
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

    const action = url.searchParams.get('action');
    const actor = url.searchParams.get('actor');

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (action) {
      conditions.push(`action = $${pIdx++}`);
      params.push(action);
    }
    if (actor) {
      conditions.push(`actor ILIKE $${pIdx++}`);
      params.push(`%${actor}%`);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT count(*) FROM audit_log ${whereSql};`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    const listRes = await query(
      `SELECT log_id, actor, action, resource, old_value, new_value, at, request_ref
       FROM audit_log
       ${whereSql}
       ORDER BY at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx++};`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      auditLogs: listRes.rows,
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


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

    const countRes = await query(`SELECT count(*) FROM access_log;`);
    const total = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    const listRes = await query(
      `SELECT al.access_id, al.staff_id, s.name AS staff_name, s.role AS staff_role,
              al.resource_id, al.data_category, al.purpose_code, al.accessed_at, al.request_ref
       FROM access_log al
       JOIN staff s ON s.staff_id = al.staff_id
       ORDER BY al.accessed_at DESC
       LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );

    return NextResponse.json({
      accessLogs: listRes.rows,
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

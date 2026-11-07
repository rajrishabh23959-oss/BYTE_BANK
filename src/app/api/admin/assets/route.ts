
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse, AppError } from '@/lib/errors';

const assetCreateSchema = z.object({
  name: z.string().min(2),
  symbol: z.string().min(2).max(10).toUpperCase(),
  type: z.enum(['crypto', 'stock']),
  quantityScale: z.number().int().min(0).max(18),
  simRefPrice: z.number().positive(),
});

export async function GET() {
  try {
    const res = await query(`
      SELECT asset_id, name, symbol, type, quantity_scale, sim_ref_price, price_updated_at
      FROM asset
      ORDER BY asset_id ASC;
    `);
    return NextResponse.json({ assets: res.rows });
  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN']);
    const body = await req.json();
    const data = assetCreateSchema.parse(body);

    const res = await query(
      `INSERT INTO asset (name, symbol, type, quantity_scale, sim_ref_price, price_updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *;`,
      [data.name, data.symbol, data.type, data.quantityScale, data.simRefPrice]
    );

    const newAsset = res.rows[0];

    await query(`
      INSERT INTO holding (account_id, asset_id, quantity)
      VALUES
        (1, $1, 1000000.0),
        (2, $1, 100000.0)
      ON CONFLICT DO NOTHING;
    `, [newAsset.asset_id]);

    await query(`
      INSERT INTO audit_log (actor, action, resource, new_value)
      VALUES ($1, 'ASSET_CREATED', 'asset:' || $2, jsonb_build_object(
        'name', $3,
        'symbol', $2,
        'type', $4,
        'sim_ref_price', $5
      ));
    `, [`admin:${session.staffId || session.username}`, newAsset.symbol, newAsset.name, newAsset.type, newAsset.sim_ref_price]);

    return NextResponse.json({
      success: true,
      asset: newAsset,
      message: `Asset ${newAsset.symbol} created successfully.`,
    }, { status: 201 });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

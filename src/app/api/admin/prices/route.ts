
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse, AppError } from '@/lib/errors';
import { broadcastPriceTick } from '@/lib/sse';

const priceUpdateSchema = z.object({
  assetId: z.number().int().positive(),
  newPrice: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN']);
    const body = await req.json();
    const data = priceUpdateSchema.parse(body);

    const res = await query(
      `UPDATE asset
       SET sim_ref_price = $1, price_updated_at = now()
       WHERE asset_id = $2
       RETURNING asset_id, name, symbol, sim_ref_price, price_updated_at;`,
      [data.newPrice, data.assetId]
    );

    const updated = res.rows[0];
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Asset not found');

    broadcastPriceTick(updated.symbol, parseFloat(updated.sim_ref_price));

    return NextResponse.json({
      success: true,
      asset: updated,
      message: `Simulated reference price for ${updated.symbol} updated to ${updated.sim_ref_price} SRU.`,
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

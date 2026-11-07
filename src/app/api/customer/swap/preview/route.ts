
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatErrorResponse, AppError } from '@/lib/errors';

const swapPreviewSchema = z.object({
  fromAssetId: z.number().int().positive(),
  toAssetId: z.number().int().positive(),
  fromQuantity: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['CUSTOMER']);
    const customerId = session.customerId!;

    const body = await req.json();
    const data = swapPreviewSchema.parse(body);

    if (data.fromAssetId === data.toAssetId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Cannot swap an asset to itself');
    }

    const accRes = await query(`SELECT account_id, status FROM account WHERE customer_id = $1;`, [customerId]);
    const account = accRes.rows[0];
    if (!account) throw new AppError(404, 'NOT_FOUND', 'Customer account not found');

    const fromAssetRes = await query(`SELECT * FROM asset WHERE asset_id = $1;`, [data.fromAssetId]);
    const toAssetRes = await query(`SELECT * FROM asset WHERE asset_id = $1;`, [data.toAssetId]);

    const fromAsset = fromAssetRes.rows[0];
    const toAsset = toAssetRes.rows[0];

    if (!fromAsset || !toAsset) {
      throw new AppError(404, 'NOT_FOUND', 'Specified assets not found');
    }

    const fromPrice = parseFloat(fromAsset.sim_ref_price);
    const toPrice = parseFloat(toAsset.sim_ref_price);

    const rate = fromPrice / toPrice;
    const rawToQty = data.fromQuantity * rate;
    const scaleFactor = Math.pow(10, toAsset.quantity_scale);
    const calculatedToQty = Math.floor(rawToQty * scaleFactor) / scaleFactor;

    if (calculatedToQty <= 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Calculated target amount is zero; increase swap input quantity.');
    }

    const availRes = await query(
      `SELECT available_qty FROM v_available_quantity WHERE account_id = $1 AND asset_id = $2;`,
      [account.account_id, data.fromAssetId]
    );
    const availableQty = parseFloat(availRes.rows[0]?.available_qty || '0');

    const mmRes = await query(
      `SELECT h.quantity
       FROM holding h
       JOIN account a ON a.account_id = h.account_id
       WHERE a.is_system = true AND a.account_no = 'BB-MARKETMAKER' AND h.asset_id = $1;`,
      [data.toAssetId]
    );
    const mmLiquidity = parseFloat(mmRes.rows[0]?.quantity || '0');

    return NextResponse.json({
      success: true,
      preview: {
        fromAsset: {
          assetId: fromAsset.asset_id,
          name: fromAsset.name,
          symbol: fromAsset.symbol,
          type: fromAsset.type,
          scale: fromAsset.quantity_scale,
          simRefPrice: fromPrice,
        },
        toAsset: {
          assetId: toAsset.asset_id,
          name: toAsset.name,
          symbol: toAsset.symbol,
          type: toAsset.type,
          scale: toAsset.quantity_scale,
          simRefPrice: toPrice,
        },
        fromQuantity: data.fromQuantity,
        estimatedToQuantity: calculatedToQty,
        exchangeRate: parseFloat(rate.toFixed(8)),
        availableBalance: availableQty,
        hasSufficientBalance: availableQty >= data.fromQuantity,
        marketMakerLiquidity: mmLiquidity,
        hasSufficientLiquidity: mmLiquidity >= calculatedToQty,
        pricingMechanism: 'Stored Simulated Reference Rate (SRU)',
      },
    });

  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

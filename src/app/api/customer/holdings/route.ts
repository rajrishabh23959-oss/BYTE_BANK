
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { withRole, query } from '@/lib/db';
import { formatErrorResponse } from '@/lib/errors';

export async function GET() {
  try {
    const session = await requireRole(['CUSTOMER']);
    const customerId = session.customerId!;

    const result = await withRole('CUSTOMER', customerId, async (client) => {

      const accRes = await client.query(
        `SELECT account_id, account_no, status, created_at FROM account WHERE customer_id = $1;`,
        [customerId]
      );
      const account = accRes.rows[0];

      if (!account) {
        return { account: null, holdings: [], totalPortfolioValue: 0 };
      }

      const holdRes = await client.query(
        `SELECT
           asset_id, asset_name, symbol, asset_type, quantity_scale,
           quantity, available_qty, reserved_qty, sim_ref_price,
           simulated_value_sru, price_updated_at
         FROM v_portfolio_valuation
         WHERE account_id = $1
         ORDER BY simulated_value_sru DESC;`,
        [account.account_id]
      );

      const holdings = holdRes.rows.map(row => ({
        assetId: row.asset_id,
        name: row.asset_name,
        symbol: row.symbol,
        type: row.asset_type,
        scale: row.quantity_scale,
        totalQuantity: parseFloat(row.quantity),
        availableQuantity: parseFloat(row.available_qty),
        reservedQuantity: parseFloat(row.reserved_qty),
        simRefPrice: parseFloat(row.sim_ref_price),
        simulatedValueSru: parseFloat(row.simulated_value_sru),
        priceUpdatedAt: row.price_updated_at,
      }));

      const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.simulatedValueSru, 0);

      return { account, holdings, totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(2)) };
    });

    return NextResponse.json(result);
  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

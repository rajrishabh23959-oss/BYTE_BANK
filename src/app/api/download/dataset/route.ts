import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        c.customer_id,
        c.full_name,
        c.email,
        c.phone,
        c.kyc_status,
        a.account_no,
        a.status as account_status,
        c.created_at
      FROM customer c
      LEFT JOIN account a ON a.customer_id = c.customer_id
      ORDER BY c.customer_id ASC;
    `);

    let csv = 'Customer ID,Full Name,Email,Phone,KYC Status,Account Number,Account Status,Created At\n';
    for (const r of res.rows) {
      csv += `${r.customer_id},"${r.full_name}","${r.email}","${r.phone}","${r.kyc_status}","${r.account_no || ''}","${r.account_status || ''}","${r.created_at}"\n`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="bytebank-125-customers.csv"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabaseBootstrapped } from '@/lib/bootstrap';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const force = req.nextUrl.searchParams.get('force') === 'true';
    const result = await ensureDatabaseBootstrapped(force);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Bootstrap failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let force = false;
    try {
      const body = await req.json();
      force = Boolean(body?.force);
    } catch {}

    const result = await ensureDatabaseBootstrapped(force);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Bootstrap failed' },
      { status: 500 }
    );
  }
}


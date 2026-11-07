
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth';
import { formatErrorResponse } from '@/lib/errors';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('bytebank_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } },
        { status: 401 }
      );
    }

    const payload = await verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' } },
        { status: 401 }
      );
    }

    const newAccessToken = await createAccessToken(payload);
    const newRefreshToken = await createRefreshToken(payload);

    await setAuthCookies(newAccessToken, newRefreshToken);

    return NextResponse.json({ success: true });
  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

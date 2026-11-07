import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { verifyPassword, createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth';
import { formatErrorResponse } from '@/lib/errors';

const loginSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON request payload' } },
        { status: 400 }
      );
    }
    const parsed = loginSchema.parse(body);

    const identifier = (parsed.email || parsed.username || parsed.identifier || '').trim();
    if (!identifier) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email or username is required' } },
        { status: 400 }
      );
    }

    const res = await query(
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.role, u.customer_id, u.staff_id,
              c.full_name, c.kyc_status, a.account_id, a.account_no, a.status AS account_status,
              s.name AS staff_name, s.role AS staff_role
       FROM app_user u
       LEFT JOIN customer c ON c.customer_id = u.customer_id
       LEFT JOIN account a ON a.customer_id = c.customer_id
       LEFT JOIN staff s ON s.staff_id = u.staff_id
       WHERE LOWER(u.email) = LOWER($1) OR LOWER(u.username) = LOWER($1);`,
      [identifier]
    );

    const user = res.rows[0];
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(parsed.password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    const tokenPayload = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      customerId: user.customer_id,
      staffId: user.staff_id,
      accountNo: user.account_no,
      accountId: user.account_id,
    };

    const accessToken = await createAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(tokenPayload);

    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name || user.staff_name,
        customerId: user.customer_id,
        staffId: user.staff_id,
        accountNo: user.account_no,
        accountId: user.account_id,
        accountStatus: user.account_status,
        kycStatus: user.kyc_status,
      },
    });
  } catch (err) {
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

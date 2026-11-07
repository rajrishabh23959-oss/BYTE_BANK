
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { query } from './db';
import { AppError } from './errors';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'bytebank-super-secret-production-grade-signing-key-2026'
);

export interface TokenPayload {
  userId: number;
  username: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'AUDITOR';
  customerId?: number | null;
  staffId?: number | null;
  accountNo?: string | null;
  accountId?: number | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash?: string | null): Promise<boolean> {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function createAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

export async function createRefreshToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bytebank_access_token')?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
  }
  return session;
}

export async function requireRole(allowedRoles: Array<'CUSTOMER' | 'ADMIN' | 'AUDITOR'>): Promise<TokenPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new AppError(403, 'FORBIDDEN', `Forbidden: Action requires role ${allowedRoles.join(' or ')}`);
  }
  return session;
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set('bytebank_access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  });

  cookieStore.set('bytebank_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('bytebank_access_token');
  cookieStore.delete('bytebank_refresh_token');
}

export async function getUserById(userId: number) {
  const res = await query(
    `SELECT u.user_id, u.username, u.email, u.role, u.customer_id, u.staff_id,
            c.full_name, c.kyc_status, a.account_id, a.account_no, a.status AS account_status,
            s.name AS staff_name, s.role AS staff_role
     FROM app_user u
     LEFT JOIN customer c ON c.customer_id = u.customer_id
     LEFT JOIN account a ON a.customer_id = c.customer_id
     LEFT JOIN staff s ON s.staff_id = u.staff_id
     WHERE u.user_id = $1`,
    [userId]
  );
  return res.rows[0] || null;
}

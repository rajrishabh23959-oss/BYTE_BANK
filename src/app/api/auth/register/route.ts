
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { withTransaction } from '@/lib/db';
import { hashPassword, createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth';
import { formatErrorResponse, AppError } from '@/lib/errors';

const registerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  address: z.string().min(5),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be YYYY-MM-DD'),
  idProofNumber: z.string().min(6),
  password: z.string().min(6),
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
    const data = registerSchema.parse(body);

    const idHash = crypto.createHash('sha256').update(data.idProofNumber).digest('hex');
    const idLast4 = data.idProofNumber.slice(-4);
    const pwdHash = await hashPassword(data.password);
    const username = data.email.split('@')[0];

    const result = await withTransaction(async (client) => {

      const custRes = await client.query(
        `INSERT INTO customer (full_name, phone, email, address, date_of_birth, id_proof_hash, id_proof_last4, kyc_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING customer_id, full_name, email, kyc_status;`,
        [data.fullName, data.phone, data.email, data.address, data.dateOfBirth, idHash, idLast4]
      );
      const customer = custRes.rows[0];

      const nextAccNum = 5000 + customer.customer_id;
      const accountNo = `BB-ACC-${nextAccNum}`;

      const accRes = await client.query(
        `INSERT INTO account (account_no, customer_id, account_type, status)
         VALUES ($1, $2, 'standard', 'active')
         RETURNING account_id, account_no, status;`,
        [accountNo, customer.customer_id]
      );
      const account = accRes.rows[0];

      const userRes = await client.query(
        `INSERT INTO app_user (username, email, password_hash, role, customer_id)
         VALUES ($1, $2, $3, 'CUSTOMER', $4)
         RETURNING user_id, username, email, role;`,
        [username, data.email, pwdHash, customer.customer_id]
      );
      const user = userRes.rows[0];

      await client.query(
        `INSERT INTO notification (customer_id, type, title, body)
         VALUES ($1, 'WELCOME', 'Welcome to ByteBank', 'Account ' || $2::text || ' successfully registered. KYC verification is pending review.');`,
        [customer.customer_id, account.account_no]
      );

      const auditValue = JSON.stringify({
        customer_id: customer.customer_id,
        email: customer.email,
        account_no: account.account_no,
        kyc_status: 'pending'
      });

      await client.query(
        `INSERT INTO audit_log (actor, action, resource, new_value)
         VALUES ('system', 'CUSTOMER_REGISTRATION', 'customer:' || $1::text, $2::jsonb);`,
        [customer.customer_id, auditValue]
      );

      return { customer, account, user };
    });

    const tokenPayload = {
      userId: result.user.user_id,
      username: result.user.username,
      email: result.user.email,
      role: result.user.role as 'CUSTOMER',
      customerId: result.customer.customer_id,
      staffId: null,
      accountNo: result.account.account_no,
      accountId: result.account.account_id,
    };

    const accessToken = await createAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(tokenPayload);

    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      success: true,
      user: {
        userId: result.user.user_id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
        fullName: result.customer.full_name,
        customerId: result.customer.customer_id,
        accountNo: result.account.account_no,
        accountId: result.account.account_id,
        accountStatus: result.account.status,
        kycStatus: result.customer.kyc_status,
      },
    }, { status: 201 });

  } catch (err: any) {
    if (err.code === '23505') {
      const detail = err.detail || '';
      if (detail.includes('email')) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'An account with this email address already exists.' } },
          { status: 409 }
        );
      }
      if (detail.includes('phone')) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'An account with this phone number already exists.' } },
          { status: 409 }
        );
      }
    }
    const { error, status } = formatErrorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

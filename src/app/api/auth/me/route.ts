import { NextResponse } from 'next/server';
import { getSession, getUserById } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
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
  } catch {
    return NextResponse.json({ user: null });
  }
}

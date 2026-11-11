import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { checkHonarHubPaymentStatus } from '@/lib/honarhubPay';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const body = await req.json();
    const { identifier } = body;

    if (!identifier) {
      return NextResponse.json({ error: 'شناسه پیگیری یا شناسه authority الزامی است.' }, { status: 400 });
    }

    const gatewayRes = await checkHonarHubPaymentStatus(identifier);

    if (!gatewayRes?.success || !gatewayRes?.data) {
      return NextResponse.json(
        { error: gatewayRes?.error || 'تراکنش با این شناسه در سامانه هنرهاب پی یافت نشد.' },
        { status: 404 }
      );
    }

    const data = gatewayRes.data;
    const status = data.status || 'PENDING';

    // Update payment log if exists
    const updatedLog = await prisma.paymentLog.updateMany({
      where: {
        OR: [
          { authority: identifier },
          { trackingCode: identifier },
        ],
      },
      data: {
        status,
        payableAmount: data.payableAmountToman,
        offsetAmount: data.offsetToman || 0,
        paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data,
      message: `استعلام موفق: وضعیت تراکنش «${status}» می‌باشد.`,
    });
  } catch (error: any) {
    console.error('Error inquiring payment status:', error);
    return NextResponse.json(
      { error: 'خطا در استعلام وضعیت پرداخت: ' + error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getHonarHubPayConfig } from '@/lib/honarhubPay';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        paymentLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش یافت نشد.' }, { status: 404 });
    }

    if (session.user.role !== 'ADMIN' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    if (order.status !== 'PENDING') {
      return NextResponse.redirect(new URL(`/panel/orders/${order.id}`, req.url));
    }

    const latestLog = order.paymentLogs[0];
    const config = await getHonarHubPayConfig();

    if (latestLog?.authority && config.baseUrl) {
      return NextResponse.redirect(`${config.baseUrl}/pay/${latestLog.authority}`);
    }

    return NextResponse.redirect(new URL(`/checkout/payment-gateway?orderId=${order.id}`, req.url));
  } catch (error: any) {
    console.error('Pay redirect error:', error);
    return NextResponse.redirect(new URL('/panel/orders', req.url));
  }
}

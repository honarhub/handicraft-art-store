import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, authority } = body;

    if (!orderId && !authority) {
      return NextResponse.json({ error: 'شناسه سفارش یا کد پیگیری الزامی است.' }, { status: 400 });
    }

    let targetOrderId = orderId;

    if (!targetOrderId && authority) {
      const log = await prisma.paymentLog.findFirst({
        where: { authority },
        select: { orderId: true },
      });
      if (log?.orderId) {
        targetOrderId = log.orderId;
      }
    }

    if (!targetOrderId) {
      return NextResponse.json({ error: 'سفارش یافت نشد.' }, { status: 404 });
    }

    // Check session permissions if available
    const session = await getServerSession(authOptions);
    const order = await prisma.order.findUnique({
      where: { id: targetOrderId },
      select: { id: true, userId: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش یافت نشد.' }, { status: 404 });
    }

    // Only allow cancelling if order is in PENDING state
    if (order.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        message: 'تنها سفارش‌های در انتظار پرداخت امکان لغو دارند.',
        status: order.status,
      });
    }

    // If session is present and not admin, ensure order belongs to this user
    if (session?.user?.id && session.user.role !== 'ADMIN' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    // Update order status to CANCELLED
    await prisma.order.update({
      where: { id: targetOrderId },
      data: { status: 'CANCELLED' },
    });

    // Also mark related pending payment logs as CANCELLED
    await prisma.paymentLog.updateMany({
      where: {
        orderId: targetOrderId,
        status: 'PENDING',
      },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت لغو شد.',
      orderId: targetOrderId,
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    return NextResponse.json({ error: 'خطا در لغو سفارش: ' + error.message }, { status: 500 });
  }
}

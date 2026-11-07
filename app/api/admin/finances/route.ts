import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const [
      ordersGrossAgg,
      settlementRequests,
      pendingRequests,
      paidRequests,
      orderItemsFeeAgg,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { total: true },
      }),
      prisma.settlementRequest.findMany({
        include: {
          artist: {
            select: {
              id: true,
              brandName: true,
              shebaNumber: true,
              balance: true,
              user: {
                select: {
                  name: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.settlementRequest.aggregate({
        where: { status: 'PENDING' },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.settlementRequest.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.orderItem.aggregate({
        where: { order: { status: 'PAID' } },
        _sum: { platformFee: true },
      }),
    ]);

    const totalOrdersGross = ordersGrossAgg._sum.total || 0;
    const totalPlatformFeeRevenue = orderItemsFeeAgg._sum.platformFee || Math.round(totalOrdersGross * 0.1);
    const pendingSettlementsCount = pendingRequests._count.id || 0;
    const pendingSettlementsAmount = pendingRequests._sum.amount || 0;
    const completedSettlementsAmount = paidRequests._sum.amount || 0;

    return NextResponse.json({
      success: true,
      metrics: {
        totalOrdersGross,
        totalPlatformFeeRevenue,
        pendingSettlementsCount,
        pendingSettlementsAmount,
        completedSettlementsAmount,
      },
      settlementRequests,
    });
  } catch (error: any) {
    console.error('Admin finances GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات مالی پلتفرم.' }, { status: 500 });
  }
}

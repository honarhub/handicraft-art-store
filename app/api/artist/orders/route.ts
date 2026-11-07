import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 });
    }

    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!artistProfile) {
      return NextResponse.json({ error: 'پروفایل هنرمند یافت نشد.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Find all orders that have items belonging to this artist
    const whereClause: any = {
      items: {
        some: {
          product: {
            artistId: artistProfile.id,
          },
        },
      },
    };

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        items: {
          where: {
            product: {
              artistId: artistProfile.id,
            },
          },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate artist specific stats
    const totalOrdersCount = orders.length;
    const processingCount = orders.filter((o) => o.status === 'PROCESSING' || o.status === 'PAID').length;
    const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
    const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

    return NextResponse.json({
      success: true,
      orders,
      stats: {
        totalOrdersCount,
        processingCount,
        shippedCount,
        deliveredCount,
      },
    });
  } catch (error: any) {
    console.error('Artist orders error:', error);
    return NextResponse.json({ error: 'خطا در بارگذاری سفارش‌های هنرمند' }, { status: 500 });
  }
}

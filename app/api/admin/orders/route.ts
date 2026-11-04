import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'all', 'test', 'real'

    const where: any = {};
    if (filter === 'test') {
      where.isTest = true;
    } else if (filter === 'real') {
      where.isTest = false;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                artist: {
                  select: {
                    id: true,
                    brandName: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Summary stats
    const [totalOrders, testOrders, realOrders, realRevenueAggregate] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { isTest: true } }),
      prisma.order.count({ where: { isTest: false } }),
      prisma.order.aggregate({
        where: { isTest: false, status: 'PAID' },
        _sum: { total: true }
      })
    ]);

    return NextResponse.json({
      success: true,
      orders,
      stats: {
        totalOrders,
        testOrders,
        realOrders,
        realRevenue: realRevenueAggregate._sum.total || 0,
      }
    });
  } catch (error: any) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست سفارش‌ها.' }, { status: 500 });
  }
}

// Bulk delete test orders
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const allTest = searchParams.get('allTest');

    if (allTest === 'true') {
      const deleteResult = await prisma.order.deleteMany({
        where: { isTest: true }
      });

      return NextResponse.json({
        success: true,
        deletedCount: deleteResult.count,
        message: `${deleteResult.count} سفارش آزمایشی با موفقیت حذف گردید.`
      });
    }

    return NextResponse.json({ error: 'دستور حذف نامعتبر است.' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin bulk delete test orders error:', error);
    return NextResponse.json({ error: 'خطا در پاکسازی سفارش‌های آزمایشی.' }, { status: 500 });
  }
}

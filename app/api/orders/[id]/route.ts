import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'شناسه سفارش الزامی است.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
          },
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
                    shebaNumber: true,
                    user: {
                      select: {
                        name: true,
                        phoneNumber: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش یافت نشد.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Fetch order error:', error);
    return NextResponse.json({ error: 'خطا در بارگذاری سفارش' }, { status: 500 });
  }
}

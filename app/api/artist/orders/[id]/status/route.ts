import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, postalTrackingCode } = body;

    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!artistProfile) {
      return NextResponse.json({ error: 'پروفایل هنرمند یافت نشد.' }, { status: 403 });
    }

    // Verify order contains artist items
    const order = await prisma.order.findFirst({
      where: {
        id,
        items: {
          some: {
            product: { artistId: artistProfile.id },
          },
        },
      },
      include: {
        items: {
          where: { product: { artistId: artistProfile.id } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش مورد نظر یافت نشد یا متعلق به شما نیست.' }, { status: 404 });
    }

    // Update data object
    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (postalTrackingCode !== undefined) {
      updateData.postalTrackingCode = postalTrackingCode ? postalTrackingCode.trim() : null;
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order
      const ord = await tx.order.update({
        where: { id },
        data: updateData,
      });

      // Also update OrderItem statuses belonging to this artist
      if (status) {
        await tx.orderItem.updateMany({
          where: {
            orderId: id,
            artistId: artistProfile.id,
          },
          data: {
            itemStatus: status,
            ...(postalTrackingCode ? { postalTrackingCode: postalTrackingCode.trim() } : {}),
          },
        });
      }

      return ord;
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'وضعیت سفارش با موفقیت بروزرسانی شد.',
    });
  } catch (error: any) {
    console.error('Update artist order status error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی وضعیت سفارش' }, { status: 500 });
  }
}

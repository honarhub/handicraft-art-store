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
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, postalTrackingCode } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (postalTrackingCode !== undefined) {
      updateData.postalTrackingCode = postalTrackingCode ? postalTrackingCode.trim() : null;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      order,
      message: 'سفارش با موفقیت بروزرسانی شد.',
    });
  } catch (error: any) {
    console.error('Admin order update error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی سفارش.' }, { status: 500 });
  }
}

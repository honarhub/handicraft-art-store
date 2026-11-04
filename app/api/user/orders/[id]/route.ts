import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'احراز هویت الزامی است.' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, isTest: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش یافت نشد.' }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    // Only allow users to delete test orders to prevent accidental data loss of real orders
    if (!order.isTest) {
      return NextResponse.json({ error: 'تنها سفارش‌های آزمایشی قابل حذف هستند.' }, { status: 400 });
    }

    await prisma.order.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'سفارش آزمایشی با موفقیت حذف گردید.'
    });
  } catch (error: any) {
    console.error('Error deleting test order:', error);
    return NextResponse.json({ error: 'خطا در حذف سفارش آزمایشی.' }, { status: 500 });
  }
}

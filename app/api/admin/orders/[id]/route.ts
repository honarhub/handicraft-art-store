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
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, isTest: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'سفارش یافت نشد.' }, { status: 404 });
    }

    await prisma.order.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت حذف گردید.'
    });
  } catch (error: any) {
    console.error('Admin delete single order error:', error);
    return NextResponse.json({ error: 'خطا در حذف سفارش.' }, { status: 500 });
  }
}

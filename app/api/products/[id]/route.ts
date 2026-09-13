import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, status, adminFeedback } = body;

    let updateData: any = {};

    if (action === 'updateStatus') {
      updateData.status = status;
      if (adminFeedback !== undefined) {
        updateData.adminFeedback = adminFeedback;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'خطا در آپدیت محصول' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف محصول' }, { status: 500 });
  }
}

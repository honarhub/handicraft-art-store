import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { artist: true, specialties: true }
    });
    
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, status, adminFeedback, title, description, stockQuantity, isUnique } = body;

    let updateData: any = {};

    if (action === 'updateStatus') {
      updateData.status = status;
      if (adminFeedback !== undefined) {
        updateData.adminFeedback = adminFeedback;
      }
    } else if (action === 'updateDetails') {
      updateData.title = title;
      updateData.description = description;
      updateData.stockQuantity = stockQuantity;
      updateData.isUnique = isUnique;
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

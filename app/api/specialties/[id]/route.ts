import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { isApproved } = await request.json();
    const updated = await prisma.specialty.update({
      where: { id },
      data: { isApproved }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در آپدیت' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.specialty.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { isApproved } = await request.json();
    const updated = await prisma.specialty.update({
      where: { id: params.id },
      data: { isApproved }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در آپدیت' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.specialty.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const dataToUpdate: any = {};
    if (body.isApproved !== undefined) dataToUpdate.isApproved = body.isApproved;
    if (body.name !== undefined && body.name.trim() !== '') dataToUpdate.name = body.name.trim();

    const updated = await prisma.specialty.update({
      where: { id },
      data: dataToUpdate
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

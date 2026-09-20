import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const updatedArtist = await prisma.artistProfile.update({
      where: { id },
      data: {
        isApproved: true,
        isActive: true,
      }
    });

    return NextResponse.json(updatedArtist);
  } catch (error) {
    console.error('Error approving artist:', error);
    return NextResponse.json({ error: 'خطا در تایید هنرمند' }, { status: 500 });
  }
}

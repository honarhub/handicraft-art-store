import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'ابتدا باید وارد حساب خود شوید' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if artist profile already exists
    let artist = await prisma.artistProfile.findUnique({
      where: { userId }
    });

    if (!artist) {
      artist = await prisma.artistProfile.create({
        data: {
          userId,
          isApproved: false,
          isActive: false
        }
      });
    }

    // Update role to ARTIST
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'ARTIST' }
    });

    return NextResponse.json({
      success: true,
      message: 'پروفایل هنرمندی با موفقیت فعال شد',
      artistId: artist.id
    });
  } catch (error: any) {
    console.error('Artist upgrade error:', error);
    return NextResponse.json({ error: 'خطا در ارتقای حساب به هنرمند', details: error.message }, { status: 500 });
  }
}

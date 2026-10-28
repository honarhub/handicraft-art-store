import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ensureArtistReferralCodes } from '@/lib/referral';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { artistProfile: true }
    });

    if (!user || (user.role !== 'ARTIST' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'دسترسی فقط برای هنرمندان مجاز است' }, { status: 403 });
    }

    // Ensure artist has up to 5 referral codes
    const codes = await ensureArtistReferralCodes(user.id, 5);

    return NextResponse.json({
      success: true,
      codes
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Artist referrals GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت کدهای معرف' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { 
        id: true,
        verificationLevel: true,
        isApproved: true,
        brandName: true,
        pendingEdits: true,
        adminFeedback: true
      }
    });

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const [unreadFeedbackCount, pendingCount, approvedCount] = await Promise.all([
      prisma.product.count({
        where: {
          artistId: artist.id,
          adminFeedbackRead: false,
          adminFeedback: { not: null }
        }
      }),
      prisma.product.count({
        where: {
          artistId: artist.id,
          status: 'PENDING',
          deletedAt: null
        }
      }),
      prisma.product.count({
        where: {
          artistId: artist.id,
          status: 'APPROVED',
          deletedAt: null
        }
      })
    ]);

    return NextResponse.json({
      unreadFeedbackCount,
      pendingCount,
      approvedCount,
      verificationLevel: artist.verificationLevel || 1,
      isApproved: artist.isApproved,
      brandName: artist.brandName,
      hasPendingEdits: Boolean(artist.pendingEdits),
      adminFeedback: artist.adminFeedback
    });
  } catch (error) {
    console.error('Error fetching artist counts:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

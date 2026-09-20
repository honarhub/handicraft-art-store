import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
    }
    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true, specialties: true }
    });
    if (!artist) return NextResponse.json({ error: 'هنرمند یافت نشد' }, { status: 404 });
    return NextResponse.json(artist);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
    }
    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id }
    });
    if (!artist) return NextResponse.json({ error: 'هنرمند یافت نشد' }, { status: 404 });
    const artistId = artist.id;

    if (!artistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Create the pending edits object
    const pendingEdits = {
      name: body.name,
      bio: body.bio,
      portfolioUrl: body.portfolioUrl,
      socialLinks: body.socialLinks,
      image: body.image, // Base64 image
      specialties: body.specialties,
      submittedAt: new Date().toISOString()
    };

    const updatedArtist = await prisma.artistProfile.update({
      where: { id: artistId },
      data: {
        pendingEdits: pendingEdits as any,
        adminFeedback: null // Clear previous feedback when they resubmit
      }
    });

    return NextResponse.json({ message: 'Edits submitted successfully', pendingEdits: updatedArtist.pendingEdits });
  } catch (error) {
    console.error('Failed to submit edits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

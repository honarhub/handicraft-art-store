import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const artistId = cookieStore.get('artistId')?.value;

    if (!artistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { id: artistId },
      include: { user: true, specialties: true }
    });

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    return NextResponse.json(artist);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const artistId = cookieStore.get('artistId')?.value;

    if (!artistId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Create the pending edits object
    const pendingEdits = {
      name: body.name,
      bio: body.bio,
      portfolioUrl: body.portfolioUrl,
      image: body.image, // Base64 image
      submittedAt: new Date().toISOString()
    };

    const artist = await prisma.artistProfile.update({
      where: { id: artistId },
      data: {
        pendingEdits: pendingEdits as any,
        adminFeedback: null // Clear previous feedback when they resubmit
      }
    });

    return NextResponse.json({ message: 'Edits submitted successfully', pendingEdits: artist.pendingEdits });
  } catch (error) {
    console.error('Failed to submit edits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { saveUploadImageSync } from '@/lib/fileUpload';

export const dynamic = 'force-dynamic';

// دریافت لیست هنرمندان
export async function GET() {
  try {
    const artists = await prisma.artistProfile.findMany({
      include: {
        user: true,
        specialties: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedArtists = artists.map(artist => {
      let hasEdits = false;
      let isLevel3Kyc = false;
      let level3Status = null;
      if (artist.pendingEdits) {
        try {
          const edits = typeof artist.pendingEdits === 'string' ? JSON.parse(artist.pendingEdits) : artist.pendingEdits;
          if (edits?.type === 'LEVEL_3_KYC') {
            isLevel3Kyc = true;
            level3Status = edits.status;
          } else {
            hasEdits = edits && typeof edits === 'object' && Object.keys(edits).length > 0;
          }
        } catch {
          hasEdits = false;
        }
      }

      const vLevel = artist.verificationLevel || 0;
      const isLevel2Pending = !artist.isDeleted && vLevel < 2 && hasEdits;
      
      // Level 3 requests appear in admin's pending table ONLY when waiting for admin action.
      // Once admin reviews and provides feedback (NEEDS_REVISION), it is removed until the artist revises and resubmits.
      const isL3WaitingAdmin = (isLevel3Kyc && level3Status === 'PENDING') ||
        (!artist.isDeleted && vLevel === 2 && (Boolean(artist.nationalId) || isLevel3Kyc) && level3Status !== 'NEEDS_REVISION' && !artist.adminFeedback);
      const isLevel3Pending = !artist.isDeleted && vLevel === 2 && isL3WaitingAdmin;
      
      const isProfileEditPending = !artist.isDeleted && vLevel >= 2 && hasEdits;

      return {
        id: artist.id,
        displayId: artist.displayId,
        name: artist.user.name || 'بدون نام',
        brandName: artist.brandName,
        email: artist.user.email,
        phoneNumber: artist.user.phoneNumber,
        image: artist.user.image,
        province: artist.province,
        city: artist.city,
        bio: artist.bio,
        verificationLevel: vLevel,
        nationalId: artist.nationalId,
        nationalCardImage: artist.nationalCardImage,
        birthDate: artist.birthDate,
        address: artist.address,
        postalCode: artist.postalCode,
        shebaNumber: artist.shebaNumber,
        specialties: artist.specialties || [],
        status: artist.isDeleted ? 'DELETED' : 'ACTIVE',
        isActive: artist.isActive,
        isApproved: artist.isApproved,
        productsCount: artist._count.products,
        hasPendingEdits: hasEdits,
        pendingEdits: artist.pendingEdits,
        adminFeedback: artist.adminFeedback,
        deletionRequested: Boolean(artist.deletionRequested),
        deletionReason: artist.deletionReason,
        deletionRequestedAt: artist.deletionRequestedAt,
        isLevel2Pending,
        isLevel3Pending,
        isProfileEditPending,
        createdAt: artist.createdAt || artist.user.createdAt
      };
    });

    return NextResponse.json(formattedArtists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست هنرمندان' }, { status: 500 });
  }
}

// ثبت هنرمند جدید
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, specialties, bio, avatar } = body;

    if (!name) {
      return NextResponse.json({ error: 'نام هنرمند الزامی است' }, { status: 400 });
    }

    let imageUrl = null;
    if (avatar) {
      imageUrl = saveUploadImageSync(avatar, 'artists', 'artist');
    }

    // ایجاد یک کاربر جدید به عنوان هنرمند
    const newArtist = await prisma.user.create({
      data: {
        name: name,
        role: 'ARTIST',
        image: imageUrl,
        artistProfile: {
          create: {
            bio: bio || '',
            isApproved: true,
            isActive: true,
            specialties: specialties && specialties.length > 0 ? {
              connect: specialties.map((id: string) => ({ id }))
            } : undefined,
            portfolioUrl: body.portfolioUrl || null,
            socialLinks: body.socialLinks || {},
          }
        }
      },
      include: {
        artistProfile: true
      }
    });

    return NextResponse.json(newArtist);
  } catch (error) {
    console.error('Error creating artist:', error);
    return NextResponse.json({ error: 'خطا در ثبت هنرمند' }, { status: 500 });
  }
}


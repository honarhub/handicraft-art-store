import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { saveUploadImageSync } from '@/lib/fileUpload';

// دریافت اطلاعات یک هنرمند برای ویرایش
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: artistId } = await params;
    const artist = await prisma.artistProfile.findUnique({
      where: { id: artistId },
      include: { user: true, specialties: true }
    });
    
    if (!artist) return NextResponse.json({ error: 'هنرمند یافت نشد' }, { status: 404 });
    return NextResponse.json(artist);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات هنرمند' }, { status: 500 });
  }
}

// بروزرسانی وضعیت هنرمند (ویرایش کامل، حذف نرم یا تغییر وضعیت فعال/غیرفعال)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: artistId } = await params;
    const body = await request.json().catch(() => ({})); 
    const { action, isActive, name, specialties, bio, avatar } = body;

    let updateData = {};

    if (action === 'toggleActive') {
      updateData = { 
        isActive: Boolean(isActive),
        ...(body.adminFeedback !== undefined ? { adminFeedback: body.adminFeedback || null } : {}),
        ...(Boolean(isActive) ? { isDeleted: false, adminFeedback: null } : {}) // اگر فعال شد لاگ خطا و بایگانی هم پاک شود
      };
      
      const updatedArtist = await prisma.artistProfile.update({
        where: { id: artistId },
        data: updateData
      });
      return NextResponse.json(updatedArtist);
    } 
    
    if (action === 'edit') {
      let imageUrl: string | null | undefined = undefined;
      
      if (avatar && typeof avatar === 'string' && avatar.startsWith('data:image')) {
        imageUrl = saveUploadImageSync(avatar, 'artists', 'artist');
      } else if (avatar === '') {
        imageUrl = null;
      }

      const updatedArtist = await prisma.artistProfile.update({
        where: { id: artistId },
        data: {
          specialties: specialties && specialties.length > 0 ? {
            set: specialties.map((id: string) => ({ id }))
          } : { set: [] },
          bio,
          portfolioUrl: body.portfolioUrl || null,
          socialLinks: body.socialLinks || {},
          user: {
            update: {
              name,
              ...(imageUrl !== undefined ? { image: imageUrl } : {})
            }
          }
        }
      });
      return NextResponse.json(updatedArtist);
    }

    if (action === 'granularReview') {
      try {
        const { approvedFields = [], rejectedFields = {}, adminFeedback } = body;
        const artist = await prisma.artistProfile.findUnique({
          where: { id: artistId },
          include: { user: true }
        });
        if (!artist || !artist.pendingEdits) {
          return NextResponse.json({ error: 'درخواستی برای بررسی وجود ندارد.' }, { status: 400 });
        }

        const edits = typeof artist.pendingEdits === 'string'
          ? JSON.parse(artist.pendingEdits)
          : artist.pendingEdits as any;

        const userUpdate: any = {};
        const artistUpdate: any = {};

        if (approvedFields.includes('name') && edits.name) userUpdate.name = edits.name;
        if (approvedFields.includes('image') && edits.image) {
          let imageUrl = edits.image;
          if (imageUrl.startsWith('data:image')) {
            imageUrl = saveUploadImageSync(imageUrl, 'artists', 'artist');
          }
          userUpdate.image = imageUrl;
        }
        if (approvedFields.includes('phoneNumber') && edits.phoneNumber) userUpdate.phoneNumber = edits.phoneNumber;
        if (approvedFields.includes('email') && edits.email) userUpdate.email = edits.email;

        if (approvedFields.includes('brandName')) artistUpdate.brandName = edits.brandName || null;
        if (approvedFields.includes('province') && edits.province) artistUpdate.province = edits.province;
        if (approvedFields.includes('city') && edits.city) artistUpdate.city = edits.city;
        if (approvedFields.includes('bio') && edits.bio) artistUpdate.bio = edits.bio;
        if (approvedFields.includes('portfolioUrl')) artistUpdate.portfolioUrl = edits.portfolioUrl || null;
        if (approvedFields.includes('socialLinks')) artistUpdate.socialLinks = edits.socialLinks || {};
        if (approvedFields.includes('specialties') && Array.isArray(edits.specialties)) {
          artistUpdate.specialties = {
            set: edits.specialties.map((s: any) => ({ id: s.id }))
          };
        }

        const hasRejections = Object.keys(rejectedFields).length > 0;
        let finalFeedback: string | null = null;
        if (hasRejections) {
          finalFeedback = JSON.stringify(rejectedFields);
        }

        // Full approval if no rejections
        const isFullApproval = !hasRejections;
        if (isFullApproval) {
          artistUpdate.isApproved = true;
          artistUpdate.isActive = true;
          artistUpdate.verificationLevel = 2; // Promoted to Level 2
          artistUpdate.adminFeedback = null;
        } else {
          // Revert to level 1 if any field was rejected until re-submitted and fully approved
          artistUpdate.verificationLevel = 1;
          artistUpdate.adminFeedback = finalFeedback || adminFeedback || 'برخی از موارد نیاز به بازبینی و اصلاح دارند.';
        }

        artistUpdate.pendingEdits = null;

        if (Object.keys(userUpdate).length > 0) {
          artistUpdate.user = { update: userUpdate };
        }

        const updatedArtist = await prisma.artistProfile.update({
          where: { id: artistId },
          data: artistUpdate
        });

        return NextResponse.json({ success: true, artist: updatedArtist });
      } catch (err: any) {
        console.error('Granular Review Error:', err);
        return NextResponse.json({ error: 'خطا در ثبت بررسی: ' + err.message }, { status: 500 });
      }
    }

    if (action === 'approveEdits') {
      try {
        const artist = await prisma.artistProfile.findUnique({ where: { id: artistId } });
        if (!artist || !artist.pendingEdits) return NextResponse.json({ error: 'No pending edits' }, { status: 400 });
        
        const edits = typeof artist.pendingEdits === 'string' ? JSON.parse(artist.pendingEdits) : artist.pendingEdits as any;
        let imageUrl: string | null | undefined = edits.image;
        
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('data:image')) {
          imageUrl = saveUploadImageSync(imageUrl, 'artists', 'artist');
        } else if (imageUrl === '') {
          imageUrl = null;
        }

        const updatedArtist = await prisma.artistProfile.update({
          where: { id: artistId },
          data: {
            bio: edits.bio,
            portfolioUrl: edits.portfolioUrl,
            socialLinks: edits.socialLinks || {},
            ...(Array.isArray(edits.specialties) ? {
              specialties: {
                set: edits.specialties.map((s: any) => ({ id: s.id }))
              }
            } : {}),
            isActive: true, // خودکار فعال شود اگر غیرفعال بوده
            isApproved: true, // خودکار تایید ثبت‌نام هم بخورد
            pendingEdits: null,
            adminFeedback: null,
            user: {
              update: {
                name: edits.name,
                ...(imageUrl !== undefined ? { image: imageUrl } : {})
              }
            }
          }
        });
        return NextResponse.json(updatedArtist);
      } catch (err: any) {
        console.error('Approve Edits Error:', err);
        return NextResponse.json({ error: 'خطا در تایید تغییرات: ' + err.message }, { status: 500 });
      }
    }

    if (action === 'rejectEdits') {
      const updatedArtist = await prisma.artistProfile.update({
        where: { id: artistId },
        data: {
          pendingEdits: null,
          adminFeedback: body.adminFeedback || 'درخواست رد شد'
        }
      });
      return NextResponse.json(updatedArtist);
    }
    
    if (action === 'rejectRegistration') {
      const artist = await prisma.artistProfile.findUnique({
        where: { id: artistId },
        select: { userId: true }
      });
      if (artist) {
        await prisma.user.delete({ where: { id: artist.userId } });
      }
      return NextResponse.json({ success: true });
    }
    
    // پیش‌فرض یا action === 'delete'
    updateData = { 
      isDeleted: true, 
      isActive: false,
      pendingEdits: null,
      adminFeedback: null
    };
    const deletedArtist = await prisma.artistProfile.update({
      where: { id: artistId },
      data: updateData
    });

    return NextResponse.json(deletedArtist);
  } catch (error) {
    console.error('Error updating artist:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی هنرمند' }, { status: 500 });
  }
}

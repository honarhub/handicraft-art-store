import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'artists');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        const fileName = `artist_${Date.now()}.png`;
        const filePath = path.join(uploadsDir, fileName);
        const base64Data = avatar.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(filePath, base64Data, 'base64');
        imageUrl = `/uploads/artists/${fileName}`;
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

    if (action === 'approveEdits') {
      try {
        const artist = await prisma.artistProfile.findUnique({ where: { id: artistId } });
        if (!artist || !artist.pendingEdits) return NextResponse.json({ error: 'No pending edits' }, { status: 400 });
        
        const edits = typeof artist.pendingEdits === 'string' ? JSON.parse(artist.pendingEdits) : artist.pendingEdits as any;
        let imageUrl: string | null | undefined = edits.image;
        
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('data:image')) {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'artists');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          
          const fileName = `artist_${Date.now()}.png`;
          const filePath = path.join(uploadsDir, fileName);
          const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
          fs.writeFileSync(filePath, base64Data, 'base64');
          imageUrl = `/uploads/artists/${fileName}`;
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

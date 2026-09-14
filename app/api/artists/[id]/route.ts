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
        ...(Boolean(isActive) ? { isDeleted: false } : {}) // خروج اتوماتیک از حالت بایگانی اگر فعال شد
      };
      
      const updatedArtist = await prisma.artistProfile.update({
        where: { id: artistId },
        data: updateData
      });
      return NextResponse.json(updatedArtist);
    } 
    
    if (action === 'edit') {
      let imageUrl = undefined;
      
      if (avatar && avatar.startsWith('data:image')) {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'artists');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        const fileName = `artist_${Date.now()}.png`;
        const filePath = path.join(uploadsDir, fileName);
        const base64Data = avatar.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(filePath, base64Data, 'base64');
        imageUrl = `/uploads/artists/${fileName}`;
      }

      const updatedArtist = await prisma.artistProfile.update({
        where: { id: artistId },
        data: {
          specialties: specialties && specialties.length > 0 ? {
            set: specialties.map((id: string) => ({ id }))
          } : { set: [] },
          bio,
          user: {
            update: {
              name,
              ...(imageUrl ? { image: imageUrl } : {})
            }
          }
        }
      });
      return NextResponse.json(updatedArtist);
    }

    if (action === 'approveEdits') {
      const artist = await prisma.artistProfile.findUnique({ where: { id: artistId } });
      if (!artist || !artist.pendingEdits) return NextResponse.json({ error: 'No pending edits' }, { status: 400 });
      
      const edits = artist.pendingEdits as any;
      let imageUrl = edits.image;
      
      if (imageUrl && imageUrl.startsWith('data:image')) {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'artists');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        const fileName = `artist_${Date.now()}.png`;
        const filePath = path.join(uploadsDir, fileName);
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(filePath, base64Data, 'base64');
        imageUrl = `/uploads/artists/${fileName}`;
      }

      const updatedArtist = await prisma.artistProfile.update({
        where: { id: artistId },
        data: {
          bio: edits.bio,
          portfolioUrl: edits.portfolioUrl,
          socialLinks: edits.socialLinks || Prisma.DbNull,
          ...(edits.specialties ? {
            specialties: {
              set: edits.specialties.map((s: any) => ({ id: s.id }))
            }
          } : {}),
          pendingEdits: Prisma.DbNull,
          adminFeedback: null,
          user: {
            update: {
              name: edits.name,
              ...(imageUrl ? { image: imageUrl } : {})
            }
          }
        }
      });
      return NextResponse.json(updatedArtist);
    }

    if (action === 'rejectEdits') {
      const updatedArtist = await prisma.artistProfile.update({
        where: { id: artistId },
        data: {
          pendingEdits: Prisma.DbNull,
          adminFeedback: body.adminFeedback || 'درخواست رد شد'
        }
      });
      return NextResponse.json(updatedArtist);
    }
    
    
    // پیش‌فرض یا action === 'delete'
    updateData = { isDeleted: true, isActive: false };
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

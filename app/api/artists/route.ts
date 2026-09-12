import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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

    const formattedArtists = artists.map(artist => ({
      id: artist.id,
      displayId: artist.displayId,
      name: artist.user.name || 'بدون نام',
      specialties: artist.specialties || [],
      status: artist.isDeleted ? 'DELETED' : 'ACTIVE',
      isActive: artist.isActive,
      productsCount: artist._count.products
    }));

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
      // ذخیره فایل در پوشه public/uploads
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'artists');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const fileName = `artist_${Date.now()}.png`;
      const filePath = path.join(uploadsDir, fileName);
      
      // دیتای base64 را دیکد کرده و ذخیره می‌کنیم
      const base64Data = avatar.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(filePath, base64Data, 'base64');
      
      imageUrl = `/uploads/artists/${fileName}`;
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
            specialties: specialties && specialties.length > 0 ? {
              connect: specialties.map((id: string) => ({ id }))
            } : undefined
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


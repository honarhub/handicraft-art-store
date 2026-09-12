import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ artists: [], products: [] });
    }

    // جستجو در هنرمندان (بر اساس نام، تخصص و بیوگرافی)
    const artists = await prisma.artistProfile.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        OR: [
          { specialties: { some: { name: { contains: q, mode: 'insensitive' } } } },
          { bio: { contains: q, mode: 'insensitive' } },
          { user: { name: { contains: q, mode: 'insensitive' } } }
        ]
      },
      include: { user: true, specialties: true },
      take: 5
    });

    // جستجو در محصولات (بر اساس عنوان، توضیحات)
    const products = await prisma.product.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { artist: { user: { name: { contains: q, mode: 'insensitive' } } } } // جستجوی نام هنرمند در محصولات
        ]
      },
      include: { artist: { include: { user: true } } },
      take: 5
    });

    const formattedArtists = artists.map(a => ({
      id: a.id,
      type: 'artist',
      title: a.user.name || 'هنرمند بدون نام',
      subtitle: a.specialties.map((s: any) => s.name).join('، ') || '',
      image: a.user.image,
      url: `/artist/${a.id}`
    }));

    const formattedProducts = products.map(p => ({
      id: p.id,
      type: 'product',
      title: p.title,
      subtitle: `اثر: ${p.artist.user.name}`,
      image: p.imageUrl,
      url: `/product/${p.id}`
    }));

    return NextResponse.json({
      results: [...formattedArtists, ...formattedProducts]
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'خطا در جستجو' }, { status: 500 });
  }
}

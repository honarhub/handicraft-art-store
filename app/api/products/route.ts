import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { saveUploadImage } from '@/lib/fileUpload';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        artist: {
          include: { user: true }
        },
        specialties: true,
        pricingTiers: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = products.map(p => ({
      id: p.id,
      title: p.title,
      imageUrl: p.imageUrl,
      artistName: p.artist.user.name || 'بدون نام',
      status: p.status,
      price: p.pricingTiers[0]?.price || 0,
      specialties: p.specialties.map(s => s.name).join('، '),
      stockQuantity: p.stockQuantity,
      shippingMode: p.shippingMode || 'ARTIST_DIRECT',
      isPreOrderEnabled: p.isPreOrderEnabled,
      hasPendingEdits: Boolean(
        p.pendingEdits && (
          typeof p.pendingEdits === 'string'
            ? p.pendingEdits !== 'null' && p.pendingEdits !== '{}'
            : Object.keys(p.pendingEdits as object).length > 0
        )
      ),
      pendingEdits: typeof p.pendingEdits === 'string' ? JSON.parse(p.pendingEdits) : p.pendingEdits,
      mediaUrls: p.mediaUrls,
      description: p.description
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست محصولات' }, { status: 500 });
  }
}

    import { cookies } from 'next/headers';
    
    export async function POST(request: Request) {
      try {
        const body = await request.json();
        const cookieStore = await cookies();
      let artistId = null;

      // check admin or artist session
      const { getServerSession } = require('next-auth');
      const { authOptions } = require('@/lib/auth');
      const session = await getServerSession(authOptions);

      if (session?.user?.id) {
        const artist = await prisma.artistProfile.findUnique({
          where: { userId: session.user.id }
        });
        if (artist) artistId = artist.id;
      }
        
        const { title, description, image, images, artistId: bodyArtistId, specialties, seoMetaTitle, seoMetaDesc, seoKeywords, price, stockQuantity, shippingMode, isPreOrderEnabled, preOrderTiers } = body;
        artistId = artistId || bodyArtistId;

        if (!title || !artistId) {
          return NextResponse.json({ error: 'عنوان محصول و شناسایی هنرمند الزامی است' }, { status: 400 });
        }

    let imageUrl = '';
    let mediaUrls: string[] = [];
    const imagesToProcess = images && images.length > 0 ? images : (image ? [image] : []);

    if (imagesToProcess.length > 0) {
      for (let i = 0; i < imagesToProcess.length; i++) {
        const saved = await saveUploadImage(imagesToProcess[i], 'products', 'product', i);
        mediaUrls.push(saved);
      }
      imageUrl = mediaUrls[0];
    }

    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin') === 'true';

    const newProduct = await prisma.product.create({
      data: {
        title,
        description: description || '',
        imageUrl,
        mediaUrls,
        artistId,
        shippingMode: shippingMode || 'ARTIST_DIRECT',
        isPreOrderEnabled: Boolean(isPreOrderEnabled),
        preOrderTiers: preOrderTiers || undefined,
        seoMetaTitle,
        seoMetaDesc,
        seoKeywords,
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 1,
        status: isAdmin ? 'APPROVED' : 'PENDING',
        specialties: specialties && specialties.length > 0 ? {
          connect: specialties.map((id: string) => ({ id }))
        } : undefined,
        pricingTiers: {
          create: {
            tierType: 'STANDARD',
            title: 'قیمت پایه',
            description: 'نسخه استاندارد محصول',
            price: Number(price) || 0,
            deliveryTime: 'آماده ارسال / پیش‌فرض'
          }
        }
      }
    });

    return NextResponse.json(newProduct);
  } catch (error: any) {
    console.error('Error creating product:', error);
    fs.writeFileSync('debug_error.txt', error.stack || error.message || String(error));
    return NextResponse.json({ error: 'خطا در ثبت محصول' }, { status: 500 });
  }
}

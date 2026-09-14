import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

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
      stockQuantity: p.stockQuantity
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
        const artistIdFromCookie = cookieStore.get('artistId')?.value;
        
        const { title, description, image, images, artistId = artistIdFromCookie, specialties, seoMetaTitle, seoMetaDesc, seoKeywords, price } = body;

        if (!title || !artistId) {
          return NextResponse.json({ error: 'عنوان محصول و شناسایی هنرمند الزامی است' }, { status: 400 });
        }

    let imageUrl = '';
    let mediaUrls: string[] = [];
    const imagesToProcess = images && images.length > 0 ? images : (image ? [image] : []);

    if (imagesToProcess.length > 0) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        const img = imagesToProcess[i];
        const commaIndex = img.indexOf(',');
        const header = commaIndex !== -1 ? img.substring(0, commaIndex) : '';
        let ext = 'png';
        if (header.includes('video/')) ext = 'mp4';
        else if (header.includes('image/jpeg')) ext = 'jpg';
        else if (header.includes('image/webp')) ext = 'webp';
        
        const base64Data = commaIndex !== -1 ? img.substring(commaIndex + 1) : img;
        
        const fileName = `product_${Date.now()}_${i}.${ext}`;
        const filePath = path.join(uploadsDir, fileName);
        await fsPromises.writeFile(filePath, Buffer.from(base64Data, 'base64'));
        mediaUrls.push(`/uploads/products/${fileName}`);
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
        seoMetaTitle,
        seoMetaDesc,
        seoKeywords,
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

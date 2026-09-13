import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
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
      specialties: p.specialties.map(s => s.name).join('، ')
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست محصولات' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, image, artistId, specialties, seoMetaTitle, seoMetaDesc, seoKeywords, price } = body;

    if (!title || !artistId) {
      return NextResponse.json({ error: 'عنوان محصول و انتخاب هنرمند الزامی است' }, { status: 400 });
    }

    let imageUrl = '';
    if (image) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      
      const fileName = `product_${Date.now()}.png`;
      const filePath = path.join(uploadsDir, fileName);
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(filePath, base64Data, 'base64');
      imageUrl = `/uploads/products/${fileName}`;
    }

    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin') === 'true';

    const newProduct = await prisma.product.create({
      data: {
        title,
        description: description || '',
        imageUrl,
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
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'خطا در ثبت محصول' }, { status: 500 });
  }
}

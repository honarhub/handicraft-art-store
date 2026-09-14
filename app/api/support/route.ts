import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { promises as fsPromises } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const contact = formData.get('contact') as string;
    const message = formData.get('message') as string;
    const productId = formData.get('productId') as string | null;
    const file = formData.get('file') as File | null;
    
    // IP-based Rate Limiting (Simple)
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    const recentMessages = await prisma.supportMessage.count({
      where: {
        ipAddress,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
      }
    });

    if (recentMessages >= 5) {
      return NextResponse.json({ error: 'شما بیش از حد مجاز پیام ارسال کرده‌اید. لطفا ۱۵ دقیقه دیگر تلاش کنید.' }, { status: 429 });
    }

    if (!name || !contact || !message) {
      return NextResponse.json({ error: 'نام، اطلاعات تماس و متن پیام الزامی است.' }, { status: 400 });
    }

    let attachmentUrl = null;

    if (file) {
      if (file.size > 500 * 1024) {
        return NextResponse.json({ error: 'حجم فایل نمی‌تواند بیشتر از ۵۰۰ کیلوبایت باشد.' }, { status: 400 });
      }
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split('.').pop();
      const fileName = `support_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      // Store in private directory
      const privateDir = path.join(process.cwd(), 'private', 'uploads', 'support');
      await fsPromises.mkdir(privateDir, { recursive: true });
      
      const filePath = path.join(privateDir, fileName);
      await fsPromises.writeFile(filePath, buffer);
      
      // Save internal path
      attachmentUrl = `/api/admin/files?path=${fileName}`;
    }

    await prisma.supportMessage.create({
      data: {
        name,
        contact,
        message,
        attachmentUrl,
        ipAddress,
        productId: productId || undefined
      }
    });

    return NextResponse.json({ success: true, message: 'پیام شما با موفقیت ثبت شد.' });
  } catch (error: any) {
    console.error('Support API Error:', error);
    return NextResponse.json({ error: 'خطا در ثبت پیام.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { contact, productId } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

    if (!contact || !productId) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 });
    }

    // Rate Limiting
    const recentRequests = await prisma.stockNotification.count({
      where: {
        ipAddress,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last 1 hour
      }
    });

    if (recentRequests >= 10) {
      return NextResponse.json({ error: 'بیش از حد مجاز. لطفا بعدا تلاش کنید.' }, { status: 429 });
    }

    // Check if already requested
    const existing = await prisma.stockNotification.findFirst({
      where: { contact, productId, isNotified: false }
    });

    if (existing) {
      return NextResponse.json({ error: 'شما قبلا برای این محصول درخواست ثبت کرده‌اید.' }, { status: 400 });
    }

    await prisma.stockNotification.create({
      data: {
        contact,
        productId,
        ipAddress
      }
    });

    return NextResponse.json({ success: true, message: 'درخواست شما ثبت شد. موجود شد خبر می‌دیم!' });
  } catch (error) {
    console.error('Stock Request Error:', error);
    return NextResponse.json({ error: 'خطا در ثبت درخواست' }, { status: 500 });
  }
}

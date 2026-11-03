import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'عدم دسترسی' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10')));
    const category = searchParams.get('category') || 'ALL';
    const search = searchParams.get('search')?.trim() || '';

    // Build filter where clause
    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Execute queries in parallel
    const [totalItems, items, totalCount, referralCount, feedbackCount, directContactCount] = await Promise.all([
      prisma.onlineSupportMessage.count({ where }),
      prisma.onlineSupportMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.onlineSupportMessage.count(),
      prisma.onlineSupportMessage.count({ where: { category: 'REFERRAL_CODE' } }),
      prisma.onlineSupportMessage.count({ where: { category: 'FEEDBACK' } }),
      prisma.onlineSupportMessage.count({ where: { category: 'DIRECT_CONTACT' } })
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return NextResponse.json({
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        pageSize: limit
      },
      stats: {
        totalCount,
        referralCount,
        feedbackCount,
        directContactCount
      }
    });
  } catch (error) {
    console.error('Error fetching admin online support messages:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست پیام‌های پشتیبانی آنلاین' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'عدم دسترسی' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'شناسه پیام الزامی است' }, { status: 400 });
    }

    await prisma.onlineSupportMessage.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting support message:', error);
    return NextResponse.json({ error: 'خطا در حذف پیام' }, { status: 500 });
  }
}

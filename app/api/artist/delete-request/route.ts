import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: بررسی وضعیت درخواست حذف حساب کاربری هنرمند
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'احراز هویت نشده‌اید' }, { status: 401 });
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        isDeleted: true,
        deletionRequested: true,
        deletionReason: true,
        deletionRequestedAt: true,
      }
    });

    if (!artist) {
      return NextResponse.json({ error: 'پروفایل هنرمند یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({
      deletionRequested: Boolean(artist.deletionRequested),
      deletionReason: artist.deletionReason,
      deletionRequestedAt: artist.deletionRequestedAt,
    });
  } catch (error) {
    console.error('Error fetching deletion request status:', error);
    return NextResponse.json({ error: 'خطا در دریافت وضعیت درخواست حذف' }, { status: 500 });
  }
}

// POST: ثبت درخواست حذف کامل حساب کاربری
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'احراز هویت نشده‌اید' }, { status: 401 });
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isDeleted: true }
    });

    if (!artist) {
      return NextResponse.json({ error: 'پروفایل هنرمند یافت نشد' }, { status: 404 });
    }

    if (artist.isDeleted) {
      return NextResponse.json({ error: 'این حساب کاربری قبلاً حذف یا بایگانی شده است.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

    const updated = await prisma.artistProfile.update({
      where: { id: artist.id },
      data: {
        deletionRequested: true,
        deletionReason: reason || 'درخواست حذف توسط هنرمند ثبت شده است.',
        deletionRequestedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'درخواست حذف پروفایل شما با موفقیت ثبت شد و در انتظار تایید مدیریت سیستم قرار گرفت.',
      deletionRequested: updated.deletionRequested,
      deletionReason: updated.deletionReason,
      deletionRequestedAt: updated.deletionRequestedAt
    });
  } catch (error) {
    console.error('Error submitting deletion request:', error);
    return NextResponse.json({ error: 'خطا در ثبت درخواست حذف' }, { status: 500 });
  }
}

// DELETE: انصراف و لغو درخواست حذف
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'احراز هویت نشده‌اید' }, { status: 401 });
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!artist) {
      return NextResponse.json({ error: 'پروفایل هنرمند یافت نشد' }, { status: 404 });
    }

    await prisma.artistProfile.update({
      where: { id: artist.id },
      data: {
        deletionRequested: false,
        deletionReason: null,
        deletionRequestedAt: null,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'درخواست حذف پروفایل با موفقیت لغو شد.'
    });
  } catch (error) {
    console.error('Error canceling deletion request:', error);
    return NextResponse.json({ error: 'خطا در لغو درخواست حذف' }, { status: 500 });
  }
}

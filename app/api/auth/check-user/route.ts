import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json({ error: 'شماره موبایل یا ایمیل الزامی است.' }, { status: 400 });
    }

    const trimmed = identifier.trim();
    const isMobile = isValidIranianMobile(trimmed) || /^(0|\+98)9\d{9}$/.test(trimmed.replace(/\s+/g, ''));

    let user = null;
    let identifierType: 'phone' | 'email' = 'email';
    let normalized = trimmed;

    if (isMobile) {
      identifierType = 'phone';
      normalized = normalizePhoneNumber(trimmed);
      user = await prisma.user.findFirst({
        where: { phoneNumber: normalized },
        include: { artistProfile: true }
      });
    } else {
      identifierType = 'email';
      normalized = trimmed.toLowerCase();
      user = await prisma.user.findUnique({
        where: { email: normalized },
        include: { artistProfile: true }
      });
    }

    if (!user) {
      return NextResponse.json({
        exists: false,
        identifierType,
        normalized,
        message: 'این شماره موبایل یا ایمیل در سیستم تعریف نشده است و باید ابتدا ثبت‌نام انجام دهید.'
      });
    }

    if (user.artistProfile?.isDeleted) {
      return NextResponse.json({
        exists: false,
        isDeleted: true,
        message: 'حساب کاربری هنرمندی شما غیرفعال یا حذف شده است. لطفاً با پشتیبانی در ارتباط باشید.'
      }, { status: 403 });
    }

    return NextResponse.json({
      exists: true,
      identifierType,
      normalized,
      hasPassword: Boolean(user.password),
      role: user.role
    });
  } catch (error: any) {
    console.error('Check user error:', error);
    return NextResponse.json({ error: 'خطای سرور در بررسی اطلاعات' }, { status: 500 });
  }
}

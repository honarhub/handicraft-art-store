import { NextResponse } from 'next/server';
import prisma, { ensureDatabaseSchema } from '@/lib/prisma';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'فرمت داده‌های ارسالی نامعتبر است.' }, { status: 400 });
    }

    const { identifier, loginType } = body || {};

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json({ error: 'شماره موبایل یا ایمیل الزامی است.' }, { status: 400 });
    }

    await ensureDatabaseSchema();

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

    // Check account deletion/archival
    if (user.isDeleted || (loginType === 'artist' && user.artistProfile?.isDeleted)) {
      return NextResponse.json({
        exists: false,
        isArchived: true,
        isDeleted: true,
        message: 'حساب کاربری شما بایگانی شده است. لطفاً جهت پیگیری یا فعال‌سازی مجدد با پشتیبانی در ارتباط باشید.'
      }, { status: 403 });
    }

    // Check account deactivation
    if (!user.isActive || (loginType === 'artist' && user.artistProfile && !user.artistProfile.isActive)) {
      return NextResponse.json({
        exists: false,
        isDeactivated: true,
        message: 'حساب کاربری شما توسط مدیریت غیرفعال شده است. لطفاً جهت پیگیری با پشتیبانی در ارتباط باشید.'
      }, { status: 403 });
    }

    return NextResponse.json({
      exists: true,
      identifierType,
      normalized,
      hasPassword: Boolean(user.password),
      role: user.role,
      name: user.name
    });
  } catch (error: any) {
    console.error('Check user error:', error);
    return NextResponse.json({ error: error?.message || 'خطای سرور در بررسی اطلاعات' }, { status: 500 });
  }
}

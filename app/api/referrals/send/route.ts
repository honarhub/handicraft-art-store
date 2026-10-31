import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCanonicalBaseUrl } from '@/lib/referral';
import { isValidIranianMobile, normalizePhoneNumber, sendReferralInviteSms } from '@/lib/sms';
import { sendReferralInviteEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' }, { status: 401 });
    }

    const body = await req.json();
    const { code, target, channel = 'auto' } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'کد معرف نامعتبر است.' }, { status: 400 });
    }

    if (!target || typeof target !== 'string') {
      return NextResponse.json({ error: 'لطفاً شماره موبایل یا آدرس ایمیل مقصد را وارد نمایید.' }, { status: 400 });
    }

    const cleanTarget = target.trim();
    const cleanCode = code.trim().toUpperCase();

    // 1. Verify Referral Code in Database
    const referral = await prisma.referralCode.findUnique({
      where: { code: cleanCode },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
            artistProfile: {
              select: { brandName: true }
            }
          }
        }
      }
    });

    if (!referral) {
      return NextResponse.json({ error: 'کد معرف مورد نظر یافت نشد.' }, { status: 404 });
    }

    if (referral.isUsed) {
      return NextResponse.json({ error: 'این کد معرف قبلاً استفاده شده و سوخته است؛ امکان ارسال آن وجود ندارد.' }, { status: 400 });
    }

    // Only Admin or the Code Creator can send this code
    const isAdmin = session.user.role === 'ADMIN';
    if (!isAdmin && referral.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'شما دسترسی مجاز برای ارسال این کد معرف را ندارید.' }, { status: 403 });
    }

    // Construct the canonical registration link with referral code (guarantees production domain and invite as primary param)
    const baseUrl = getCanonicalBaseUrl(req);
    const registerUrl = `${baseUrl}/artist-panel/login?invite=${encodeURIComponent(cleanCode)}&tab=register`;

    // Determine delivery channel: SMS or Email
    const isEmailLike = cleanTarget.includes('@');
    const isPhoneLike = cleanTarget.startsWith('09') || cleanTarget.startsWith('+98') || cleanTarget.startsWith('98') || /^\d{10,11}$/.test(cleanTarget.replace(/\s+/g, ''));

    let activeChannel: 'sms' | 'email' = 'sms';
    if (channel === 'email' || (channel === 'auto' && isEmailLike)) {
      activeChannel = 'email';
    } else if (channel === 'sms' || (channel === 'auto' && isPhoneLike)) {
      activeChannel = 'sms';
    } else if (isEmailLike) {
      activeChannel = 'email';
    } else {
      activeChannel = 'sms';
    }

    const isCreatorAdmin = referral.creator?.role === 'ADMIN' || session.user.role === 'ADMIN';
    const senderName = isCreatorAdmin 
      ? 'مدیریت سایت' 
      : (referral.creator?.artistProfile?.brandName || referral.creator?.name || 'مدیریت سایت');

    if (activeChannel === 'sms') {
      const normalizedPhone = normalizePhoneNumber(cleanTarget);
      if (!isValidIranianMobile(normalizedPhone)) {
        return NextResponse.json({ error: 'شماره موبایل وارد شده نامعتبر است (نمونه صحیح: 09121234567).' }, { status: 400 });
      }

      const smsResult = await sendReferralInviteSms({
        mobile: normalizedPhone,
        referralCode: cleanCode,
        registerUrl
      });

      if (!smsResult.success) {
        return NextResponse.json({ error: smsResult.error || 'خطا در ارسال پیامک دعوت‌نامه' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `پیامک دعوت‌نامه حاوی لینک اختصاصی ثبت‌نام با موفقیت به شماره ${normalizedPhone} ارسال شد.`,
        channel: 'sms',
        target: normalizedPhone
      });
    } else {
      // Email delivery
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanTarget.toLowerCase())) {
        return NextResponse.json({ error: 'فرمت آدرس ایمیل وارد شده نامعتبر است.' }, { status: 400 });
      }

      const emailResult = await sendReferralInviteEmail({
        toEmail: cleanTarget,
        referralCode: cleanCode,
        registerUrl,
        senderName
      });

      if (!emailResult.success) {
        return NextResponse.json({ error: emailResult.error || 'خطا در ارسال ایمیل دعوت‌نامه' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `ایمیل دعوت‌نامه با موفقیت به آدرس ${cleanTarget.toLowerCase()} ارسال شد.`,
        channel: 'email',
        target: cleanTarget.toLowerCase()
      });
    }
  } catch (error: any) {
    console.error('Send referral invitation error:', error);
    return NextResponse.json({ error: 'خطای غیرمنتظره در ارسال دعوت‌نامه' }, { status: 500 });
  }
}

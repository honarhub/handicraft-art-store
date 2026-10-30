import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePhoneNumber, isValidIranianMobile, sendSmsOtp } from '@/lib/sms';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, email, type, referralCode } = body;

    if (!phone && !email) {
      return NextResponse.json({ error: 'شماره موبایل یا ایمیل الزامی است.' }, { status: 400 });
    }

    const isEmail = Boolean(email && !phone);
    const targetType = type || (isEmail ? 'EMAIL_OTP' : 'PHONE_OTP');
    
    let normalizedTarget = '';

    if (isEmail) {
      const emailTrimmed = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        return NextResponse.json({ error: 'فرمت ایمیل نامعتبر است.' }, { status: 400 });
      }
      normalizedTarget = emailTrimmed;
    } else {
      normalizedTarget = normalizePhoneNumber(phone);
      if (!isValidIranianMobile(normalizedTarget)) {
        return NextResponse.json({ 
          error: 'شماره موبایل نامعتبر است. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹' 
        }, { status: 400 });
      }
    }

    // Special validation for registration OTP
    if (type === 'REGISTER_OTP') {
      // 1. Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: isEmail ? { email: normalizedTarget } : { phoneNumber: normalizedTarget },
        include: { artistProfile: true }
      });
      if (existingUser) {
        if (existingUser.artistProfile?.isDeleted) {
          return NextResponse.json({ 
            error: 'حساب کاربری شما قبلاً بایگانی شده است. لطفاً جهت فعال‌سازی مجدد با پشتیبانی در تماس باشید.' 
          }, { status: 400 });
        }
        if (existingUser.artistProfile && !existingUser.artistProfile.isActive) {
          return NextResponse.json({ 
            error: 'حساب کاربری شما توسط ادمین غیرفعال شده است. لطفاً جهت پیگیری با پشتیبانی در تماس باشید.' 
          }, { status: 400 });
        }
        return NextResponse.json({ 
          error: 'این حساب قبلاً ثبت‌نام شده است. لطفاً از بخش ورود اقدام نمایید.' 
        }, { status: 400 });
      }

      // 2. Validate referral code
      if (!referralCode || !referralCode.trim()) {
        return NextResponse.json({ error: 'کد معرف الزامی است.' }, { status: 400 });
      }

      const cleanRefCode = referralCode.trim().toUpperCase();
      const refRecord = await prisma.referralCode.findUnique({
        where: { code: cleanRefCode }
      });

      if (!refRecord) {
        return NextResponse.json({ error: 'کد معرف وارد شده نامعتبر است.' }, { status: 400 });
      }

      if (refRecord.isUsed) {
        return NextResponse.json({ error: 'این کد معرف قبلاً استفاده شده است و دیگر قابل استفاده نمی‌باشد.' }, { status: 400 });
      }
    }

    // Special validation for login PHONE_OTP
    if (targetType === 'PHONE_OTP') {
      const existingUser = await prisma.user.findFirst({
        where: { phoneNumber: normalizedTarget },
        include: { artistProfile: true }
      });
      if (existingUser) {
        if (existingUser.artistProfile?.isDeleted) {
          return NextResponse.json({ 
            error: 'حساب کاربری هنرمندی شما بایگانی شده است. لطفاً جهت پیگیری یا فعال‌سازی مجدد با پشتیبانی در تماس باشید.' 
          }, { status: 400 });
        }
        if (existingUser.artistProfile && !existingUser.artistProfile.isActive) {
          return NextResponse.json({ 
            error: 'حساب کاربری هنرمندی شما توسط ادمین غیرفعال شده است. لطفاً جهت پیگیری با پشتیبانی در تماس باشید.' 
          }, { status: 400 });
        }
      }
    }

    // Rate Limiting: Check last created code for this target within last 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        target: normalizedTarget,
        type: targetType,
        createdAt: { gte: sixtySecondsAgo },
        used: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentCode) {
      const waitSeconds = Math.ceil((recentCode.createdAt.getTime() + 60000 - Date.now()) / 1000);
      return NextResponse.json({ 
        error: `لطفاً ${waitSeconds > 0 ? waitSeconds : 10} ثانیه صبر کرده و سپس مجدداً تلاش کنید.` 
      }, { status: 429 });
    }

    // Invalidate existing unused codes for this target & type
    await prisma.verificationCode.updateMany({
      where: {
        target: normalizedTarget,
        type: targetType,
        used: false
      },
      data: { used: true }
    });

    // Generate 5-digit OTP (10000 - 99999)
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    await prisma.verificationCode.create({
      data: {
        target: normalizedTarget,
        code,
        type: targetType,
        expiresAt,
        used: false
      }
    });

    // Send SMS if mobile
    if (!isEmail) {
      await sendSmsOtp(normalizedTarget, code);
    } else {
      console.log(`[EMAIL OTP] Code for ${normalizedTarget}: ${code}`);
    }

    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: true,
      message: isEmail ? 'کد تایید به ایمیل شما ارسال شد.' : 'کد تایید با موفقیت پیامک شد.',
      expiresIn: 120,
      target: normalizedTarget,
      ...(isDev ? { devCode: code } : {})
    });
  } catch (error: any) {
    console.error('[API /api/auth/otp/send] Error:', error);
    return NextResponse.json({ error: 'خطای سرور در ارسال کد تایید.' }, { status: 500 });
  }
}

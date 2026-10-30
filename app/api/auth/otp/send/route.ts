import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePhoneNumber, isValidIranianMobile, sendSmsOtp } from '@/lib/sms';
import { checkAndEnforceOtpLimits, logOtpSent, logOtpFailure, isLocalhostRequest } from '@/lib/otp-security';

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

    // Security & Anti-abuse checks (Kill switch, IP flood protection, per-phone quota, cooldown)
    const securityCheck = await checkAndEnforceOtpLimits(req, normalizedTarget, targetType, isEmail);
    if (!securityCheck.allowed) {
      return NextResponse.json({ 
        error: securityCheck.error,
        isMobileOtpDisabled: securityCheck.isMobileOtpDisabled
      }, { status: securityCheck.status });
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
    const intervalSec = securityCheck.siteSettings.otpResendIntervalSeconds || 60;
    const expiresAt = new Date(Date.now() + Math.max(intervalSec * 2, 120) * 1000);

    await prisma.verificationCode.create({
      data: {
        target: normalizedTarget,
        code,
        type: targetType,
        expiresAt,
        used: false
      }
    });

    const isLocalhost = isLocalhostRequest(req);

    // Send SMS if mobile
    let smsMode: 'MOCK' | 'SANDBOX' | 'PRODUCTION' = 'PRODUCTION';
    let devCodeToReturn: string | undefined = undefined;

    if (!isEmail) {
      const smsRes = await sendSmsOtp(normalizedTarget, code);
      if (!smsRes.success) {
        await logOtpFailure(securityCheck.clientIp, normalizedTarget, targetType, smsRes.error || 'خطا در ارسال پیامک');
        return NextResponse.json({
          error: smsRes.error || 'خطا در ارسال پیامک از طریق سامانه. لطفاً بعداً تلاش نمایید یا با پشتیبانی تماس بگیرید.'
        }, { status: 502 });
      }

      smsMode = smsRes.mode || 'PRODUCTION';

      if (isLocalhost) {
        if (smsMode === 'MOCK') {
          console.log('====================================================');
          console.log(`[SMS-MOCK] Localhost Mock OTP for ${normalizedTarget}: [ ${code} ]`);
          console.log('====================================================');
          devCodeToReturn = code;
        } else if (smsMode === 'SANDBOX') {
          console.log('====================================================');
          console.log(`[SMS.IR-SANDBOX] Verified by SMS.ir (ID: ${smsRes.messageId}, Cost: ${smsRes.cost ?? 0}). Code: [ ${code} ]`);
          console.log('====================================================');
          devCodeToReturn = code;
        } else if (smsMode === 'PRODUCTION') {
          console.log(`[SMS.IR-PRODUCTION] Live SMS dispatched to ${normalizedTarget} (MessageID: ${smsRes.messageId})`);
        }
      } else {
        // NOT localhost (live domain): Strictly production, never log code, never return devCode
        if (smsMode === 'PRODUCTION') {
          console.log(`[SMS.IR-PRODUCTION] Live SMS dispatched to ${normalizedTarget} (MessageID: ${smsRes.messageId})`);
        }
      }
    } else {
      // Email handling
      if (isLocalhost) {
        console.log(`[EMAIL-DEV] Code for ${normalizedTarget}: ${code}`);
        devCodeToReturn = code;
        smsMode = 'MOCK';
      }
    }

    // Log successful OTP dispatch
    await logOtpSent(securityCheck.clientIp, normalizedTarget, targetType);

    return NextResponse.json({
      success: true,
      message: isEmail ? 'کد تایید به ایمیل شما ارسال شد.' : 'کد تایید با موفقیت ارسال شد.',
      expiresIn: intervalSec,
      target: normalizedTarget,
      mode: isLocalhost ? smsMode : 'PRODUCTION',
      ...(devCodeToReturn ? { devCode: devCodeToReturn } : {})
    });
  } catch (error: any) {
    console.error('[API /api/auth/otp/send] Error:', error);
    return NextResponse.json({ error: 'خطای سرور در ارسال کد تایید.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { normalizePhoneNumber, isValidIranianMobile, sendSmsOtp } from '@/lib/sms';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkAndEnforceOtpLimits, logOtpSent, logOtpFailure, isLocalhostRequest } from '@/lib/otp-security';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, target, code, newPassword } = body;

    // Action 1: Request Password Reset Code
    if (action === 'request') {
      if (!target) {
        return NextResponse.json({ error: 'شماره موبایل یا ایمیل الزامی است.' }, { status: 400 });
      }

      const isMobile = isValidIranianMobile(target);
      const normalizedTarget = isMobile ? normalizePhoneNumber(target) : target.trim().toLowerCase();

      // Find user
      const user = await prisma.user.findFirst({
        where: isMobile ? { phoneNumber: normalizedTarget } : { email: normalizedTarget },
        include: { artistProfile: true }
      });

      if (!user) {
        // Return friendly message without leaking account existence
        return NextResponse.json({ 
          success: true, 
          message: 'در صورت ثبت بودن حساب، کد بازیابی ارسال شد.' 
        });
      }

      if (user.artistProfile?.isDeleted) {
        return NextResponse.json({ 
          error: 'حساب کاربری شما بایگانی شده است. لطفاً جهت پیگیری یا فعال‌سازی مجدد با پشتیبانی در تماس باشید.' 
        }, { status: 400 });
      }

      if (user.artistProfile && !user.artistProfile.isActive) {
        return NextResponse.json({ 
          error: 'حساب کاربری شما توسط ادمین غیرفعال شده است. لطفاً جهت پیگیری با پشتیبانی در تماس باشید.' 
        }, { status: 400 });
      }

      // Security & Anti-abuse checks (Kill switch, IP flood protection, per-phone quota, cooldown)
      const securityCheck = await checkAndEnforceOtpLimits(req, normalizedTarget, 'PASSWORD_RESET', !isMobile);
      if (!securityCheck.allowed) {
        return NextResponse.json({ 
          error: securityCheck.error,
          isMobileOtpDisabled: securityCheck.isMobileOtpDisabled
        }, { status: securityCheck.status });
      }

      // Generate 5-digit OTP
      const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
      const intervalSec = securityCheck.siteSettings.otpResendIntervalSeconds || 60;
      const expiresAt = new Date(Date.now() + Math.max(intervalSec * 3, 300) * 1000); // at least 5 minutes

      // Invalidate existing unused codes
      await prisma.verificationCode.updateMany({
        where: {
          target: normalizedTarget,
          type: 'PASSWORD_RESET',
          used: false
        },
        data: { used: true }
      });

      await prisma.verificationCode.create({
        data: {
          target: normalizedTarget,
          code: otpCode,
          type: 'PASSWORD_RESET',
          expiresAt,
          used: false
        }
      });

      const isLocalhost = isLocalhostRequest(req);
      let smsMode: 'MOCK' | 'SANDBOX' | 'PRODUCTION' = 'PRODUCTION';
      let devCodeToReturn: string | undefined = undefined;

      if (isMobile) {
        const smsRes = await sendSmsOtp(normalizedTarget, otpCode);
        if (!smsRes.success) {
          await logOtpFailure(securityCheck.clientIp, normalizedTarget, 'PASSWORD_RESET', smsRes.error || 'خطا در ارسال پیامک');
          return NextResponse.json({
            error: smsRes.error || 'خطا در ارسال پیامک از طریق سامانه. لطفاً بعداً تلاش نمایید.'
          }, { status: 502 });
        }
        smsMode = smsRes.mode || 'PRODUCTION';

        if (isLocalhost) {
          if (smsMode === 'MOCK') {
            console.log('====================================================');
            console.log(`[FORGOT-SMS-MOCK] Localhost OTP for ${normalizedTarget}: [ ${otpCode} ]`);
            console.log('====================================================');
            devCodeToReturn = otpCode;
          } else if (smsMode === 'SANDBOX') {
            console.log('====================================================');
            console.log(`[FORGOT-SMS.IR-SANDBOX] Verified by SMS.ir (ID: ${smsRes.messageId}, Cost: ${smsRes.cost ?? 0}). Code: [ ${otpCode} ]`);
            console.log('====================================================');
            devCodeToReturn = otpCode;
          } else if (smsMode === 'PRODUCTION') {
            console.log(`[FORGOT-SMS.IR-PRODUCTION] Live SMS sent to ${normalizedTarget} (MessageID: ${smsRes.messageId})`);
          }
        } else {
          // NOT localhost (live domain)
          if (smsMode === 'PRODUCTION') {
            console.log(`[FORGOT-SMS.IR-PRODUCTION] Live SMS sent to ${normalizedTarget} (MessageID: ${smsRes.messageId})`);
          }
        }
      } else {
        // For email
        const emailRes = await sendPasswordResetEmail(normalizedTarget, otpCode);
        if (!emailRes.success) {
          await logOtpFailure(securityCheck.clientIp, normalizedTarget, 'PASSWORD_RESET', emailRes.error || 'خطا در ارسال ایمیل');
          return NextResponse.json({
            error: emailRes.error || 'خطا در ارسال ایمیل بازیابی رمز عبور.'
          }, { status: 502 });
        }

        smsMode = emailRes.mode || 'PRODUCTION';

        if (isLocalhost) {
          if (emailRes.devCode) {
            devCodeToReturn = emailRes.devCode;
          } else {
            console.log(`[RESEND-RESET-EMAIL] Reset email sent to ${normalizedTarget} (ID: ${emailRes.id})`);
          }
        } else if (emailRes.id) {
          console.log(`[RESEND-RESET-EMAIL] Reset email sent to ${normalizedTarget} (ID: ${emailRes.id})`);
        }
      }

      await logOtpSent(securityCheck.clientIp, normalizedTarget, 'PASSWORD_RESET');

      return NextResponse.json({
        success: true,
        message: 'کد بازیابی ارسال شد.',
        target: normalizedTarget,
        mode: isLocalhost ? smsMode : 'PRODUCTION',
        ...(devCodeToReturn ? { devCode: devCodeToReturn } : {})
      });
    }

    // Action 2: Reset Password with Verified Code
    if (action === 'reset') {
      if (!target || !code || !newPassword) {
        return NextResponse.json({ error: 'اطلاعات ارسالی ناقص است.' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' }, { status: 400 });
      }

      const isMobile = isValidIranianMobile(target);
      const normalizedTarget = isMobile ? normalizePhoneNumber(target) : target.trim().toLowerCase();
      const cleanedCode = code.toString().trim();

      const record = await prisma.verificationCode.findFirst({
        where: {
          target: normalizedTarget,
          code: cleanedCode,
          type: 'PASSWORD_RESET',
          used: false,
          expiresAt: { gte: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!record) {
        return NextResponse.json({ error: 'کد بازیابی نامعتبر یا منقضی شده است.' }, { status: 400 });
      }

      // Mark code as used
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true }
      });

      // Update user password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const user = await prisma.user.findFirst({
        where: isMobile ? { phoneNumber: normalizedTarget } : { email: normalizedTarget }
      });

      if (!user) {
        return NextResponse.json({ error: 'کاربر یافت نشد.' }, { status: 404 });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, mustChangePassword: false }
      });

      return NextResponse.json({
        success: true,
        message: 'رمز عبور شما با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید.'
      });
    }

    return NextResponse.json({ error: 'اکشن نامعتبر است.' }, { status: 400 });
  } catch (error: any) {
    console.error('[API /api/auth/forgot-password] Error:', error);
    return NextResponse.json({ error: 'خطای سرور در پردازش درخواست.' }, { status: 500 });
  }
}

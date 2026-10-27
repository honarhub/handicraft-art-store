import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePhoneNumber, isValidIranianMobile, sendSmsOtp } from '@/lib/sms';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, type = 'PHONE_OTP' } = body;

    if (!phone) {
      return NextResponse.json({ error: 'شماره موبایل الزامی است.' }, { status: 400 });
    }

    const normalized = normalizePhoneNumber(phone);

    if (!isValidIranianMobile(normalized)) {
      return NextResponse.json({ 
        error: 'شماره موبایل نامعتبر است. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹' 
      }, { status: 400 });
    }

    // Rate Limiting: Check last created code for this phone within last 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        target: normalized,
        type,
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

    // Invalidate existing unused codes for this phone & type
    await prisma.verificationCode.updateMany({
      where: {
        target: normalized,
        type,
        used: false
      },
      data: { used: true }
    });

    // Generate cryptographically secure-ish 5-digit OTP (10000 - 99999)
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    await prisma.verificationCode.create({
      data: {
        target: normalized,
        code,
        type,
        expiresAt,
        used: false
      }
    });

    // Send SMS
    await sendSmsOtp(normalized, code);

    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: true,
      message: 'کد تایید با موفقیت ارسال شد.',
      expiresIn: 120,
      phone: normalized,
      ...(isDev ? { devCode: code } : {})
    });
  } catch (error: any) {
    console.error('[API /api/auth/otp/send] Error:', error);
    return NextResponse.json({ error: 'خطای سرور در ارسال پیامک.' }, { status: 500 });
  }
}

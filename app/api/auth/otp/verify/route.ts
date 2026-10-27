import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePhoneNumber } from '@/lib/sms';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, code, type = 'PHONE_OTP' } = body;

    if (!phone || !code) {
      return NextResponse.json({ error: 'شماره موبایل و کد تایید الزامی است.' }, { status: 400 });
    }

    const normalized = normalizePhoneNumber(phone);
    const cleanedCode = code.toString().trim();

    const record = await prisma.verificationCode.findFirst({
      where: {
        target: normalized,
        code: cleanedCode,
        type,
        used: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return NextResponse.json({ 
        error: 'کد تایید اشتباه است یا منقضی شده است.' 
      }, { status: 400 });
    }

    // Mark as used
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true }
    });

    return NextResponse.json({
      success: true,
      message: 'کد تایید با موفقیت اعتبارسنجی شد.',
      phone: normalized
    });
  } catch (error: any) {
    console.error('[API /api/auth/otp/verify] Error:', error);
    return NextResponse.json({ error: 'خطای سرور در اعتبارسنجی کد.' }, { status: 500 });
  }
}

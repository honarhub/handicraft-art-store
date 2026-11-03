import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, name, password, code } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'شماره موبایل الزامی است.' }, { status: 400 });
    }

    if (!code || typeof code !== 'string' || code.trim().length !== 5) {
      return NextResponse.json({ error: 'کد تایید ۵ رقمی الزامی است.' }, { status: 400 });
    }

    const normalized = normalizePhoneNumber(phone);
    if (!isValidIranianMobile(normalized)) {
      return NextResponse.json({ error: 'فرمت شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).' }, { status: 400 });
    }

    // 1. Verify OTP
    const cleanedCode = code.trim();
    const otpRecord = await prisma.verificationCode.findFirst({
      where: {
        target: normalized,
        code: cleanedCode,
        used: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'کد تایید وارد شده نامعتبر است یا منقضی شده است.' }, { status: 400 });
    }

    // 2. Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { phoneNumber: normalized }
    });

    if (existing) {
      return NextResponse.json({ error: 'این شماره موبایل قبلاً ثبت‌نام شده است. لطفاً وارد شوید.' }, { status: 400 });
    }

    // 3. Hash password if provided
    let hashedPassword = null;
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      hashedPassword = await bcrypt.hash(password.trim(), 10);
    }

    const cleanName = (name && typeof name === 'string' && name.trim()) 
      ? name.trim() 
      : `کاربر هنرهاب`;

    // 4. Create user with role USER
    const newUser = await prisma.user.create({
      data: {
        phoneNumber: normalized,
        name: cleanName,
        password: hashedPassword,
        role: 'USER'
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Customer register error:', error);
    return NextResponse.json({ error: 'خطای سرور در ثبت‌نام کاربر.' }, { status: 500 });
  }
}

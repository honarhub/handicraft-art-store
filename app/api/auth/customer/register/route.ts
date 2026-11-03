import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, email, name, password, code } = body;

    if (!phone && !email) {
      return NextResponse.json({ error: 'شماره موبایل یا ایمیل الزامی است.' }, { status: 400 });
    }

    if (!code || typeof code !== 'string' || code.trim().length !== 5) {
      return NextResponse.json({ error: 'کد تایید ۵ رقمی الزامی است.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.trim().length < 6) {
      return NextResponse.json({ error: 'تعیین رمز عبور (حداقل ۶ کاراکتر) برای ورودهای بعدی الزامی است.' }, { status: 400 });
    }

    const isEmail = Boolean(email && !phone);
    let normalizedTarget = '';

    if (isEmail) {
      const cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json({ error: 'فرمت آدرس ایمیل نامعتبر است.' }, { status: 400 });
      }
      normalizedTarget = cleanEmail;
    } else {
      normalizedTarget = normalizePhoneNumber(phone);
      if (!isValidIranianMobile(normalizedTarget)) {
        return NextResponse.json({ error: 'فرمت شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).' }, { status: 400 });
      }
    }

    // 1. Verify OTP
    const cleanedCode = code.trim();
    const otpRecord = await prisma.verificationCode.findFirst({
      where: {
        target: normalizedTarget,
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
      where: isEmail ? { email: normalizedTarget } : { phoneNumber: normalizedTarget }
    });

    if (existing) {
      return NextResponse.json({ 
        error: isEmail ? 'این ایمیل قبلاً در سیستم ثبت‌نام شده است. لطفاً وارد شوید.' : 'این شماره موبایل قبلاً ثبت‌نام شده است. لطفاً وارد شوید.' 
      }, { status: 400 });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const cleanName = (name && typeof name === 'string' && name.trim()) 
      ? name.trim() 
      : `کاربر هنرهاب`;

    // 4. Create user with role USER and mark emailVerified if registered via email OTP
    const newUser = await prisma.user.create({
      data: {
        phoneNumber: isEmail ? null : normalizedTarget,
        email: isEmail ? normalizedTarget : null,
        emailVerified: isEmail ? new Date() : null,
        name: cleanName,
        password: hashedPassword,
        role: 'USER'
      }
    });

    // 5. Invalidate used OTP code
    await prisma.verificationCode.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email,
        emailVerified: newUser.emailVerified,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Customer register error:', error);
    return NextResponse.json({ error: 'خطای سرور در انجام ثبت‌نام کاربر.' }, { status: 500 });
  }
}

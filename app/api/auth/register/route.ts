import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';
import { ensureArtistReferralCodes } from '@/lib/referral';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      identifierType, // 'phone' | 'email'
      identifier, 
      referralCode, 
      password, 
      otpCode, 
      name 
    } = body;

    // 1. Basic validation
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json({ error: 'شماره موبایل یا ایمیل الزامی است.' }, { status: 400 });
    }
    if (!referralCode || typeof referralCode !== 'string' || !referralCode.trim()) {
      return NextResponse.json({ error: 'کد معرف الزامی است.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' }, { status: 400 });
    }
    if (!otpCode || typeof otpCode !== 'string' || otpCode.trim().length !== 5) {
      return NextResponse.json({ error: 'کد تایید ۵ رقمی الزامی است.' }, { status: 400 });
    }

    const isEmail = identifierType === 'email' || (!isValidIranianMobile(identifier) && identifier.includes('@'));
    let normalizedTarget = '';

    if (isEmail) {
      normalizedTarget = identifier.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedTarget)) {
        return NextResponse.json({ error: 'فرمت ایمیل نامعتبر است.' }, { status: 400 });
      }
    } else {
      normalizedTarget = normalizePhoneNumber(identifier);
      if (!isValidIranianMobile(normalizedTarget)) {
        return NextResponse.json({ error: 'فرمت شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).' }, { status: 400 });
      }
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: isEmail ? { email: normalizedTarget } : { phoneNumber: normalizedTarget }
    });
    if (existingUser) {
      return NextResponse.json({ 
        error: 'این شماره موبایل یا ایمیل قبلاً ثبت‌نام شده است. لطفاً وارد شوید.' 
      }, { status: 400 });
    }

    // 3. Verify Referral Code
    const cleanRefCode = referralCode.trim().toUpperCase();
    const refRecord = await prisma.referralCode.findUnique({
      where: { code: cleanRefCode }
    });

    if (!refRecord) {
      return NextResponse.json({ error: 'کد معرف وارد شده معتبر نمی‌باشد.' }, { status: 400 });
    }

    if (refRecord.isUsed) {
      return NextResponse.json({ error: 'این کد معرف قبلاً توسط هنرمند دیگری استفاده شده است و فاقد اعتبار است.' }, { status: 400 });
    }

    // 4. Verify OTP Code
    const cleanedOtp = otpCode.trim();
    const otpRecord = await prisma.verificationCode.findFirst({
      where: {
        target: normalizedTarget,
        code: cleanedOtp,
        used: false,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'کد تایید وارد شده نامعتبر یا منقضی شده است.' }, { status: 400 });
    }

    // Invalidate OTP
    await prisma.verificationCode.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    // 5. Hash Password & Create User + ArtistProfile
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultName = name?.trim() || (isEmail ? normalizedTarget.split('@')[0] : `هنرمند ${normalizedTarget.slice(-4)}`);

    const newUser = await prisma.user.create({
      data: {
        name: defaultName,
        email: isEmail ? normalizedTarget : null,
        phoneNumber: isEmail ? null : normalizedTarget,
        password: hashedPassword,
        role: 'ARTIST',
        artistProfile: {
          create: {
            verificationLevel: 0,
            isApproved: false,
            isActive: true
          }
        }
      },
      include: {
        artistProfile: true
      }
    });

    // 6. Mark Referral Code as used
    await prisma.referralCode.update({
      where: { id: refRecord.id },
      data: {
        isUsed: true,
        usedById: newUser.id,
        usedAt: new Date()
      }
    });

    // 7. Auto-generate 5 referral codes for this new artist
    try {
      await ensureArtistReferralCodes(newUser.id, 5);
    } catch (e) {
      console.error('Failed to auto-generate referral codes for new artist:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'ثبت‌نام با موفقیت انجام شد.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role
      }
    });
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: 'خطای سرور در ثبت‌نام. لطفاً مجدداً تلاش نمایید.' }, { status: 500 });
  }
}

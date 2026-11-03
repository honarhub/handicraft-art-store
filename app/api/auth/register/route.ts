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
      where: isEmail ? { email: normalizedTarget } : { phoneNumber: normalizedTarget },
      include: { artistProfile: true }
    });

    if (existingUser) {
      if (existingUser.isDeleted || existingUser.artistProfile?.isDeleted) {
        return NextResponse.json({ 
          error: 'حساب کاربری شما قبلاً بایگانی شده است. لطفاً جهت فعال‌سازی مجدد با پشتیبانی در تماس باشید.' 
        }, { status: 400 });
      }
      if (!existingUser.isActive || (existingUser.artistProfile && !existingUser.artistProfile.isActive)) {
        return NextResponse.json({ 
          error: 'حساب کاربری شما توسط ادمین غیرفعال شده است. لطفاً جهت پیگیری با پشتیبانی در تماس باشید.' 
        }, { status: 400 });
      }

      // If user is already an artist or admin, don't allow duplicate registration
      if (existingUser.role === 'ARTIST' || existingUser.role === 'ADMIN') {
        return NextResponse.json({ 
          error: 'این شماره موبایل یا ایمیل قبلاً به عنوان هنرمند ثبت‌نام شده است. لطفاً از بخش ورود اقدام فرمایید.' 
        }, { status: 400 });
      }
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

    // 5. Hash Password & Create or Upgrade User + ArtistProfile
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultName = name?.trim() || null;

    let targetUser: any = null;

    if (existingUser && existingUser.role === 'USER') {
      // Automatic Role Upgrade from USER to ARTIST
      targetUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'ARTIST',
          name: defaultName || existingUser.name,
          password: hashedPassword,
          ...(isEmail && !existingUser.email ? { email: normalizedTarget, emailVerified: new Date() } : {}),
          ...(!isEmail && !existingUser.phoneNumber ? { phoneNumber: normalizedTarget } : {}),
          ...(!existingUser.artistProfile ? {
            artistProfile: {
              create: {
                verificationLevel: 0,
                isApproved: false,
                isActive: true
              }
            }
          } : {})
        },
        include: {
          artistProfile: true
        }
      });
    } else {
      // Create Brand New ARTIST User
      targetUser = await prisma.user.create({
        data: {
          name: defaultName,
          email: isEmail ? normalizedTarget : null,
          emailVerified: isEmail ? new Date() : null,
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
    }

    // 6. Mark Referral Code as used
    await prisma.referralCode.update({
      where: { id: refRecord.id },
      data: {
        isUsed: true,
        usedById: targetUser.id,
        usedAt: new Date()
      }
    });

    // 7. Ensure new artist gets their initial set of referral codes generated
    await ensureArtistReferralCodes(targetUser.id, targetUser.role);

    return NextResponse.json({
      success: true,
      message: existingUser ? 'حساب کاربری شما با موفقیت به نقش هنرمند ارتقا یافت.' : 'ثبت‌نام هنرمند با موفقیت انجام شد.',
      user: {
        id: targetUser.id,
        role: targetUser.role
      }
    });
  } catch (error: any) {
    console.error('Artist register error:', error);
    return NextResponse.json({ error: 'خطای سرور در انجام ثبت‌نام هنرمند.' }, { status: 500 });
  }
}

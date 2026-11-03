import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد حساب کاربری شوید' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phoneNumber: true,
        image: true,
        role: true,
        createdAt: true,
        password: true,
        artistProfile: {
          select: {
            id: true,
            brandName: true,
            verificationLevel: true,
            isActive: true
          }
        },
        _count: {
          select: {
            orders: true,
            wishlistItems: true,
            addresses: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: Boolean(user.emailVerified || user.email),
        phoneNumber: user.phoneNumber,
        image: user.image,
        role: user.role,
        hasPassword: Boolean(user.password),
        isArtist: user.role === 'ARTIST' || Boolean(user.artistProfile),
        isAdmin: user.role === 'ADMIN',
        artistProfile: user.artistProfile,
        createdAt: user.createdAt,
        counts: user._count
      }
    });
  } catch (error) {
    console.error('User profile GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات کاربری' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد حساب کاربری شوید' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phoneNumber, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const updateData: any = {};

    if (name && typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }

    // Allow setting / updating phone number if user does not already have a locked phone number
    if (phoneNumber !== undefined && !user.phoneNumber) {
      const cleanPhone = phoneNumber ? normalizePhoneNumber(phoneNumber.trim()) : null;
      if (cleanPhone) {
        if (!isValidIranianMobile(cleanPhone)) {
          return NextResponse.json({ error: 'شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).' }, { status: 400 });
        }
        const phoneTaken = await prisma.user.findFirst({
          where: { phoneNumber: cleanPhone, NOT: { id: user.id } }
        });
        if (phoneTaken) {
          return NextResponse.json({ error: 'این شماره موبایل قبلاً توسط کاربر دیگری در سیستم ثبت شده است.' }, { status: 400 });
        }
        updateData.phoneNumber = cleanPhone;
      }
    }

    if (email !== undefined) {
      const cleanEmail = email ? email.trim().toLowerCase() : null;
      if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json({ error: 'فرمت ایمیل نامعتبر است' }, { status: 400 });
      }
      if (cleanEmail && cleanEmail !== user.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: cleanEmail }
        });
        if (emailTaken) {
          return NextResponse.json({ error: 'این ایمیل قبلاً در سیستم ثبت شده است' }, { status: 400 });
        }
        updateData.email = cleanEmail;
      }
    }

    // Handle password change / set
    if (newPassword && typeof newPassword === 'string' && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' }, { status: 400 });
      }

      // If user already has a password, verify current password
      if (user.password) {
        if (!currentPassword) {
          return NextResponse.json({ error: 'لطفاً رمز عبور فعلی خود را وارد کنید' }, { status: 400 });
        }
        const matches = await bcrypt.compare(currentPassword, user.password);
        if (!matches) {
          return NextResponse.json({ error: 'رمز عبور فعلی اشتباه است' }, { status: 400 });
        }
      }

      updateData.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phoneNumber: true,
        image: true,
        role: true
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        emailVerified: Boolean(updatedUser.emailVerified || updatedUser.email)
      }
    });
  } catch (error) {
    console.error('User profile PUT error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی اطلاعات حساب' }, { status: 500 });
  }
}

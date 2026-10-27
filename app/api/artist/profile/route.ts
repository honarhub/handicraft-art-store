import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveUploadImageSync } from '@/lib/fileUpload';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
    }
    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      include: { 
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            image: true,
            emailVerified: true,
            accounts: {
              select: { provider: true }
            }
          }
        }, 
        specialties: true 
      }
    });
    if (!artist) return NextResponse.json({ error: 'هنرمند یافت نشد' }, { status: 404 });

    const isSsoUser = artist.user.accounts.some(a => a.provider === 'google');
    const isPhoneVerified = Boolean(artist.user.phoneNumber);
    const isEmailVerified = Boolean(artist.user.emailVerified || isSsoUser);

    return NextResponse.json({
      ...artist,
      isSsoUser,
      isPhoneVerified,
      isEmailVerified
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
    }
    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          include: { accounts: true }
        }
      }
    });
    if (!artist) return NextResponse.json({ error: 'هنرمند یافت نشد' }, { status: 404 });
    if (!artist.isActive) {
      return NextResponse.json({ error: 'حساب کاربری شما توسط ادمین غیرفعال شده است و امکان ویرایش وجود ندارد.' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      brandName, 
      bio, 
      portfolioUrl, 
      socialLinks, 
      image, 
      specialties, 
      phoneNumber, 
      email, 
      phoneOtpVerified, 
      emailOtpVerified 
    } = body;

    // Strict Validation per requirements:
    if (!name?.trim()) {
      return NextResponse.json({ error: 'نام و نام خانوادگی الزامی است.' }, { status: 400 });
    }
    if (!bio?.trim()) {
      return NextResponse.json({ error: 'درباره شما (بیوگرافی) الزامی است.' }, { status: 400 });
    }
    if (!image && !artist.user.image) {
      return NextResponse.json({ error: 'تصویر پروفایل الزامی است.' }, { status: 400 });
    }

    const isSsoUser = artist.user.accounts.some(a => a.provider === 'google');
    
    // Phone number validation:
    const rawPhone = phoneNumber?.trim() || artist.user.phoneNumber;
    if (!rawPhone) {
      return NextResponse.json({ error: 'شماره موبایل الزامی است.' }, { status: 400 });
    }
    const normalizedPhone = normalizePhoneNumber(rawPhone);
    if (!isValidIranianMobile(normalizedPhone)) {
      return NextResponse.json({ error: 'فرمت شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).' }, { status: 400 });
    }

    // Save image if new base64
    let finalImageUrl = artist.user.image;
    if (image && typeof image === 'string' && image.startsWith('data:image')) {
      finalImageUrl = saveUploadImageSync(image, 'artists', 'artist');
    }

    // Filter clean social links: ignore empty entries
    const cleanSocialLinks: Record<string, string> = {};
    if (socialLinks && typeof socialLinks === 'object') {
      Object.entries(socialLinks).forEach(([p, val]) => {
        if (typeof val === 'string' && val.trim().length > 0) {
          cleanSocialLinks[p] = val.trim();
        }
      });
    }

    const pendingEdits = {
      name: name.trim(),
      brandName: brandName?.trim() || null,
      bio: bio.trim(),
      portfolioUrl: portfolioUrl?.trim() || null,
      socialLinks: cleanSocialLinks,
      image: finalImageUrl,
      specialties: Array.isArray(specialties) ? specialties : [],
      phoneNumber: normalizedPhone,
      email: email?.trim() || artist.user.email || null,
      submittedAt: new Date().toISOString()
    };

    // Update user info
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        ...(finalImageUrl ? { image: finalImageUrl } : {}),
        ...(phoneOtpVerified || !isSsoUser ? { phoneNumber: normalizedPhone } : {}),
        ...(emailOtpVerified && email ? { email: email.trim().toLowerCase(), emailVerified: new Date() } : {})
      }
    });

    // Update artist profile (promote to Level 2)
    const updatedArtist = await prisma.artistProfile.update({
      where: { id: artist.id },
      data: {
        brandName: brandName?.trim() || null,
        verificationLevel: Math.max(artist.verificationLevel || 0, 2),
        pendingEdits: pendingEdits as any,
        adminFeedback: null
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'پروفایل با موفقیت ثبت شد و در انتظار تایید ناظر قرار گرفت.',
      artist: updatedArtist
    });
  } catch (error: any) {
    console.error('Failed to submit edits:', error);
    return NextResponse.json({ error: 'خطای سرور در ثبت اطلاعات' }, { status: 500 });
  }
}

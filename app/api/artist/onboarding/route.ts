import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { normalizePhoneNumber } from '@/lib/sms';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'احراز هویت الزامی است.' }, { status: 401 });
    }

    let artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true, email: true, phoneNumber: true, image: true } },
        specialties: { select: { id: true, name: true, parentId: true } }
      }
    });

    if (!artist) {
      // Auto-create artist profile for user if missing
      artist = await prisma.artistProfile.create({
        data: {
          userId: session.user.id,
          verificationLevel: 0,
          isApproved: false,
          isActive: true
        },
        include: {
          user: { select: { name: true, email: true, phoneNumber: true, image: true } },
          specialties: { select: { id: true, name: true, parentId: true } }
        }
      });
    }

    // Also fetch all available specialties for selection
    const allSpecialties = await prisma.specialty.findMany({
      where: { isApproved: true },
      select: { id: true, name: true, parentId: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      artist,
      allSpecialties
    });
  } catch (error: any) {
    console.error('[API /api/artist/onboarding GET] Error:', error);
    return NextResponse.json({ error: 'خطای سرور در دریافت اطلاعات آنبوردینگ.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'احراز هویت الزامی است.' }, { status: 401 });
    }

    const body = await req.json();
    const { step } = body;

    let artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!artist) {
      artist = await prisma.artistProfile.create({
        data: {
          userId: session.user.id,
          verificationLevel: 0,
          isApproved: false,
          isActive: true
        }
      });
    }

    const currentLevel = artist.verificationLevel || 0;

    // --- STEP 1: Basic Info (Name, Brand, Province, City) ---
    if (step === 1) {
      const { name, brandName, province, city, phone, specialtyIds } = body;

      if (!name?.trim() || !province || !city) {
        return NextResponse.json({ error: 'نام و نام خانوادگی، استان و شهر الزامی هستند.' }, { status: 400 });
      }

      // Update User info
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: name.trim(),
          ...(phone ? { phoneNumber: normalizePhoneNumber(phone) } : {})
        }
      });

      // Update ArtistProfile info
      const updatedArtist = await prisma.artistProfile.update({
        where: { id: artist.id },
        data: {
          brandName: brandName?.trim() || null,
          province,
          city,
          verificationLevel: Math.max(currentLevel, 1),
          ...(Array.isArray(specialtyIds) && specialtyIds.length > 0 ? {
            specialties: {
              set: specialtyIds.map((id: string) => ({ id }))
            }
          } : {})
        },
        include: {
          specialties: true,
          user: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'اطلاعات مرحله ۱ (پایه و تخصص‌ها) با موفقیت ثبت شد.',
        artist: updatedArtist
      });
    }

    // --- STEP 2: Artistic Identity (Bio, Avatar, Banner, Socials) ---
    if (step === 2) {
      const { bio, bannerUrl, avatarUrl, socialLinks } = body;

      if (avatarUrl) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { image: avatarUrl }
        });
      }

      const updatedArtist = await prisma.artistProfile.update({
        where: { id: artist.id },
        data: {
          bio,
          bannerUrl,
          socialLinks: socialLinks || undefined,
          verificationLevel: Math.max(currentLevel, 2)
        },
        include: {
          specialties: true,
          user: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'اطلاعات مرحله ۲ (رزومه و هویت بصری) با موفقیت ثبت شد.',
        artist: updatedArtist
      });
    }

    // --- STEP 3: KYC & Legal Identity (National ID, Card Image, Address, Sheba) ---
    if (step === 3) {
      const { nationalId, nationalCardImage, address, postalCode, shebaNumber } = body;

      if (!nationalId || !address || !shebaNumber) {
        return NextResponse.json({ error: 'کد ملی، آدرس و شماره شبا الزامی هستند.' }, { status: 400 });
      }

      const updatedArtist = await prisma.artistProfile.update({
        where: { id: artist.id },
        data: {
          nationalId,
          nationalCardImage,
          address,
          postalCode,
          shebaNumber: shebaNumber.replace(/^IR/i, '').trim(),
          verificationLevel: Math.max(currentLevel, 3)
        },
        include: {
          specialties: true,
          user: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'مدارک و اطلاعات هویتی و مالی مرحله ۳ با موفقیت ثبت شد.',
        artist: updatedArtist
      });
    }

    return NextResponse.json({ error: 'مرحله نامعتبر است.' }, { status: 400 });
  } catch (error: any) {
    console.error('[API /api/artist/onboarding POST] Error:', error);
    return NextResponse.json({ error: 'خطای سرور در ثبت اطلاعات.' }, { status: 500 });
  }
}

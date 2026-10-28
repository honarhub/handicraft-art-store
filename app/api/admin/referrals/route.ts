import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateRandomCode } from '@/lib/referral';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی فقط برای ادمین کل مجاز است.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim() || '';
    const status = searchParams.get('status')?.trim() || 'all'; // 'all' | 'active' | 'used'

    const where: any = {};

    if (status === 'active') {
      where.isUsed = false;
    } else if (status === 'used') {
      where.isUsed = true;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { creator: { name: { contains: search, mode: 'insensitive' } } },
        { creator: { email: { contains: search, mode: 'insensitive' } } },
        { creator: { phoneNumber: { contains: search, mode: 'insensitive' } } },
        { usedBy: { name: { contains: search, mode: 'insensitive' } } },
        { usedBy: { email: { contains: search, mode: 'insensitive' } } },
        { usedBy: { phoneNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [totalCodes, activeCodes, usedCodes, codes] = await Promise.all([
      prisma.referralCode.count(),
      prisma.referralCode.count({ where: { isUsed: false } }),
      prisma.referralCode.count({ where: { isUsed: true } }),
      prisma.referralCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              role: true,
              artistProfile: {
                select: { displayId: true, brandName: true }
              }
            }
          },
          usedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              role: true,
              artistProfile: {
                select: { displayId: true, brandName: true }
              }
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalCodes,
        activeCodes,
        usedCodes
      },
      codes
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Admin referrals GET error:', error);
    return NextResponse.json({ error: 'خطای سرور در دریافت کدهای معرف' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const body = await req.json();
    const { count = 1, customCode, targetArtistUserId } = body;

    const creatorId = targetArtistUserId || session.user.id;

    if (customCode && typeof customCode === 'string') {
      const cleanCustom = customCode.trim().toUpperCase();
      if (cleanCustom.length < 3) {
        return NextResponse.json({ error: 'کد سفارشی باید حداقل ۳ کاراکتر باشد.' }, { status: 400 });
      }

      const existing = await prisma.referralCode.findUnique({
        where: { code: cleanCustom }
      });

      if (existing) {
        return NextResponse.json({ error: 'این کد معرف قبلاً در سیستم ثبت شده است.' }, { status: 400 });
      }

      const created = await prisma.referralCode.create({
        data: {
          code: cleanCustom,
          creatorId,
          isUsed: false
        }
      });

      return NextResponse.json({
        success: true,
        message: 'کد معرف سفارشی با موفقیت ایجاد شد.',
        code: created
      });
    }

    const requestedCount = Math.min(Math.max(1, Number(count) || 1), 50);
    const newCodes: string[] = [];

    while (newCodes.length < requestedCount) {
      const candidate = generateRandomCode();
      if (!newCodes.includes(candidate)) {
        const exists = await prisma.referralCode.findUnique({ where: { code: candidate } });
        if (!exists) {
          newCodes.push(candidate);
        }
      }
    }

    await prisma.referralCode.createMany({
      data: newCodes.map(code => ({
        code,
        creatorId,
        isUsed: false
      }))
    });

    return NextResponse.json({
      success: true,
      message: `${newCodes.length} کد معرف با موفقیت ایجاد گردید.`,
      codes: newCodes
    });
  } catch (error: any) {
    console.error('Admin referrals POST error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد کدهای معرف' }, { status: 500 });
  }
}

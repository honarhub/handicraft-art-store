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

    // 1. Live Artist Autocomplete Search for Modal
    const artistSearch = searchParams.get('artistSearch');
    if (artistSearch !== null) {
      const cleanArtistQ = artistSearch.trim();
      const artists = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'ARTIST' },
            { artistProfile: { isNot: null } }
          ],
          artistProfile: { isDeleted: false },
          ...(cleanArtistQ ? {
            OR: [
              { name: { contains: cleanArtistQ, mode: 'insensitive' } },
              { phoneNumber: { contains: cleanArtistQ, mode: 'insensitive' } },
              { email: { contains: cleanArtistQ, mode: 'insensitive' } },
              { artistProfile: { brandName: { contains: cleanArtistQ, mode: 'insensitive' } } }
            ]
          } : {})
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          artistProfile: {
            select: { displayId: true, brandName: true }
          },
          _count: {
            select: { createdReferrals: true }
          }
        },
        take: 12,
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({ success: true, artists }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    // 2. Filtered Referral Codes Query with Pagination & Specific Column Search
    const search = searchParams.get('q')?.trim() || '';
    const creatorSearch = searchParams.get('creator')?.trim() || '';
    const usedBySearch = searchParams.get('usedBy')?.trim() || '';
    const status = searchParams.get('status')?.trim() || 'all'; // 'all' | 'active' | 'used'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = { AND: [] };

    if (status === 'active') {
      where.AND.push({ isUsed: false });
    } else if (status === 'used') {
      where.AND.push({ isUsed: true });
    }

    if (search) {
      where.AND.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { creator: { name: { contains: search, mode: 'insensitive' } } },
          { creator: { email: { contains: search, mode: 'insensitive' } } },
          { creator: { phoneNumber: { contains: search, mode: 'insensitive' } } },
          { creator: { artistProfile: { brandName: { contains: search, mode: 'insensitive' } } } },
          { usedBy: { name: { contains: search, mode: 'insensitive' } } },
          { usedBy: { email: { contains: search, mode: 'insensitive' } } },
          { usedBy: { phoneNumber: { contains: search, mode: 'insensitive' } } },
          { usedBy: { artistProfile: { brandName: { contains: search, mode: 'insensitive' } } } },
        ]
      });
    }

    if (creatorSearch) {
      where.AND.push({
        OR: [
          { creator: { name: { contains: creatorSearch, mode: 'insensitive' } } },
          { creator: { email: { contains: creatorSearch, mode: 'insensitive' } } },
          { creator: { phoneNumber: { contains: creatorSearch, mode: 'insensitive' } } },
          { creator: { artistProfile: { brandName: { contains: creatorSearch, mode: 'insensitive' } } } },
        ]
      });
    }

    if (usedBySearch) {
      where.AND.push({
        OR: [
          { usedBy: { name: { contains: usedBySearch, mode: 'insensitive' } } },
          { usedBy: { email: { contains: usedBySearch, mode: 'insensitive' } } },
          { usedBy: { phoneNumber: { contains: usedBySearch, mode: 'insensitive' } } },
          { usedBy: { artistProfile: { brandName: { contains: usedBySearch, mode: 'insensitive' } } } },
        ]
      });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const [totalCodes, activeCodes, usedCodes, totalFiltered, codes] = await Promise.all([
      prisma.referralCode.count(),
      prisma.referralCode.count({ where: { isUsed: false } }),
      prisma.referralCode.count({ where: { isUsed: true } }),
      prisma.referralCode.count({ where }),
      prisma.referralCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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

    const totalPages = Math.ceil(totalFiltered / limit) || 1;

    return NextResponse.json({
      success: true,
      stats: {
        totalCodes,
        activeCodes,
        usedCodes
      },
      pagination: {
        totalItems: totalFiltered,
        totalPages,
        currentPage: page,
        pageSize: limit
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

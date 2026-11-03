import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';
    const role = searchParams.get('role')?.trim() || 'ALL';
    const status = searchParams.get('status')?.trim() || 'ALL';

    const where: any = {
      isDeleted: false
    };

    if (role !== 'ALL') {
      where.role = role;
    }

    if (status === 'ACTIVE') {
      where.isActive = true;
    } else if (status === 'INACTIVE') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, totalCount, activeCount, artistsCount, adminsCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          phoneNumber: true,
          image: true,
          role: true,
          isActive: true,
          isDeleted: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              addresses: true,
              wishlistItems: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: false, isActive: true } }),
      prisma.user.count({ where: { isDeleted: false, role: 'ARTIST' } }),
      prisma.user.count({ where: { isDeleted: false, role: 'ADMIN' } })
    ]);

    return NextResponse.json({
      success: true,
      users,
      stats: {
        total: totalCount,
        active: activeCount,
        artists: artistsCount,
        admins: adminsCount
      }
    });
  } catch (error: any) {
    console.error('[API /api/admin/users GET] Error:', error);
    return NextResponse.json({ error: 'خطای سرور در دریافت کاربران' }, { status: 500 });
  }
}

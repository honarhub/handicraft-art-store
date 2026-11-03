import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        artistProfile: {
          select: {
            id: true,
            brandName: true,
            verificationLevel: true,
            isApproved: true,
            isActive: true
          }
        },
        addresses: {
          orderBy: { createdAt: 'desc' }
        },
        orders: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    title: true,
                    imageUrl: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        wishlistItems: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            orders: true,
            addresses: true,
            wishlistItems: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر مورد نظر یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('[API /api/admin/users/[id] GET] Error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, phoneNumber, role, isActive } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name ? name.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (role && ['USER', 'ARTIST', 'ADMIN'].includes(role)) {
      updateData.role = role;
    }

    if (email !== undefined) {
      const cleanEmail = email ? email.trim().toLowerCase() : null;
      if (cleanEmail) {
        // Check uniqueness
        const conflict = await prisma.user.findFirst({
          where: { email: cleanEmail, NOT: { id } }
        });
        if (conflict) {
          return NextResponse.json({ error: 'این ایمیل توسط کاربر دیگری ثبت شده است' }, { status: 400 });
        }
      }
      updateData.email = cleanEmail;
    }

    if (phoneNumber !== undefined) {
      let cleanPhone = phoneNumber ? normalizePhoneNumber(phoneNumber.trim()) : null;
      if (cleanPhone) {
        if (!isValidIranianMobile(cleanPhone)) {
          return NextResponse.json({ error: 'شماره موبایل وارد شده نامعتبر است' }, { status: 400 });
        }
        const conflict = await prisma.user.findFirst({
          where: { phoneNumber: cleanPhone, NOT: { id } }
        });
        if (conflict) {
          return NextResponse.json({ error: 'این شماره موبایل توسط کاربر دیگری ثبت شده است' }, { status: 400 });
        }
      }
      updateData.phoneNumber = cleanPhone;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('[API /api/admin/users/[id] PUT] Error:', error);
    return NextResponse.json({ error: 'خطای سرور در ویرایش اطلاعات کاربر' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json({ error: 'امکان حذف حساب کاربری خودتان وجود ندارد' }, { status: 400 });
    }

    // Soft delete: mark as isDeleted and isActive = false
    await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false
      }
    });

    return NextResponse.json({ success: true, message: 'کاربر با موفقیت حذف / بایگانی شد' });
  } catch (error: any) {
    console.error('[API /api/admin/users/[id] DELETE] Error:', error);
    return NextResponse.json({ error: 'خطای سرور در حذف کاربر' }, { status: 500 });
  }
}

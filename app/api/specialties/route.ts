import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const isAdmin = searchParams.get('admin') === 'true';
    const hierarchy = searchParams.get('hierarchy') === 'true';
    
    let specialties = [];
    if (hierarchy) {
      // دریافت درخت کامل دسته‌بندی‌های اصلی به همراه زیرمجموعه‌های تایید شده
      specialties = await prisma.specialty.findMany({
        where: { parentId: null, isApproved: true },
        include: {
          children: {
            where: { isApproved: true },
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      });
    } else if (isAdmin) {
      // ادمین کل لیست را همراه با دسته والد، زیرمجموعه‌ها و هنرمندان درخواست دهنده می‌بیند
      specialties = await prisma.specialty.findMany({
        orderBy: [
          { isApproved: 'asc' },
          { parentId: 'asc' },
          { name: 'asc' }
        ],
        include: {
          parent: {
            select: { id: true, name: true }
          },
          children: {
            select: { id: true, name: true, isApproved: true }
          },
          artists: {
            select: { user: { select: { name: true } } }
          }
        }
      });
    } else if (q) {
      specialties = await prisma.specialty.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        include: {
          parent: { select: { id: true, name: true } }
        },
        take: 15
      });
    } else {
      specialties = await prisma.specialty.findMany({
        where: { isApproved: true },
        include: {
          parent: { select: { id: true, name: true } }
        },
        take: 100,
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json(specialties);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت تخصص‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, parentId } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'نام تخصص الزامی است' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // بررسی اینکه از قبل وجود دارد یا نه
    const existing = await prisma.specialty.findUnique({
      where: { name: trimmedName },
      include: { parent: true }
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    // دسته پیش‌فرض برای تخصص‌های پیشنهادی: سایر هنرهای دستی و دکوراتیو
    let targetParentId = parentId || null;
    if (!targetParentId) {
      const defaultParent = await prisma.specialty.findUnique({
        where: { name: 'سایر هنرهای دستی و دکوراتیو' }
      });
      if (defaultParent) {
        targetParentId = defaultParent.id;
      }
    }

    // ساخت تخصص جدید (پیش‌فرض نیازمند تایید ادمین با قرارگیری در دسته پیش‌فرض)
    const newSpecialty = await prisma.specialty.create({
      data: {
        name: trimmedName,
        isApproved: false,
        parentId: targetParentId
      },
      include: {
        parent: true
      }
    });

    return NextResponse.json(newSpecialty);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ثبت تخصص' }, { status: 500 });
  }
}

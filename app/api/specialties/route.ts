import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const isAdmin = searchParams.get('admin') === 'true';
    
    let specialties = [];
    if (isAdmin) {
      // ادمین کل لیست را همراه با هنرمندان درخواست دهنده می‌بیند
      specialties = await prisma.specialty.findMany({
        orderBy: [ { isApproved: 'asc' }, { name: 'asc' } ],
        include: {
          artists: {
            select: { user: { select: { name: true } } }
          }
        }
      });
    } else if (q) {
      specialties = await prisma.specialty.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        take: 10
      });
    } else {
      // این حالت دیگر توسط فرانت‌اند به دلیل تایمر سرچ فراخوانی نمی‌شود ولی محض احتیاط
      specialties = await prisma.specialty.findMany({
        where: { isApproved: true },
        take: 50,
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
    const { name } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'نام تخصص الزامی است' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // بررسی اینکه از قبل وجود دارد یا نه
    const existing = await prisma.specialty.findUnique({ where: { name: trimmedName } });
    if (existing) {
      return NextResponse.json(existing);
    }

    // ساخت تخصص جدید (نیازمند تایید ادمین)
    const newSpecialty = await prisma.specialty.create({
      data: { name: trimmedName, isApproved: false }
    });

    return NextResponse.json(newSpecialty);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ثبت تخصص' }, { status: 500 });
  }
}

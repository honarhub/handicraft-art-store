import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    let specialties = [];
    if (q) {
      specialties = await prisma.specialty.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        take: 10
      });
    } else {
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

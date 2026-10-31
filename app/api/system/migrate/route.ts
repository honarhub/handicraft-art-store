import { NextResponse } from 'next/server';
import { ensureDatabaseSchema } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDatabaseSchema();
    return NextResponse.json({
      success: true,
      message: 'بروزرسانی ساختار دیتابیس با موفقیت انجام شد.',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'خطا در بروزرسانی دیتابیس',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}

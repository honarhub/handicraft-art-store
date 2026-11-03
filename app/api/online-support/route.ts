import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function normalizeIranianPhone(input: string): string | null {
  if (!input) return null;
  // Convert Persian/Arabic digits to English
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  let clean = input.trim();
  for (let i = 0; i < 10; i++) {
    clean = clean.replace(new RegExp(persianDigits[i], 'g'), String(i));
    clean = clean.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  // Strip non-digits except +
  clean = clean.replace(/[^\d+]/g, '');

  if (clean.startsWith('+98')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('0098')) {
    clean = '0' + clean.slice(4);
  } else if (clean.startsWith('98') && clean.length === 12) {
    clean = '0' + clean.slice(2);
  } else if (clean.length === 10 && clean.startsWith('9')) {
    clean = '0' + clean;
  }

  // Validate Iranian mobile pattern: 09xxxxxxxxx (11 digits)
  const mobileRegex = /^09[0-9]{9}$/;
  if (mobileRegex.test(clean)) {
    return clean;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, category, message } = body;

    const normalizedPhone = normalizeIranianPhone(phoneNumber);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'لطفاً یک شماره موبایل معتبر ۱۱ رقمی (مثال: ۰۹۱۲۳۴۵۶۷۸۹) وارد فرمایید.' },
        { status: 400 }
      );
    }

    const validCategories = ['REFERRAL_CODE', 'FEEDBACK', 'DIRECT_CONTACT'];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'نوع درخواست مشخص شده نامعتبر است.' },
        { status: 400 }
      );
    }

    // Prevent duplicate records:
    // If user previously selected REFERRAL_CODE or DIRECT_CONTACT, don't re-insert into database
    if (category === 'REFERRAL_CODE' || category === 'DIRECT_CONTACT') {
      const existing = await prisma.onlineSupportMessage.findFirst({
        where: {
          phoneNumber: normalizedPhone,
          category
        },
        orderBy: { createdAt: 'desc' }
      });

      if (existing) {
        return NextResponse.json({
          success: true,
          id: existing.id,
          displayId: existing.displayId,
          isDuplicate: true
        });
      }
    } else if (category === 'FEEDBACK') {
      // Prevent rapid duplicate submission of identical feedback text
      const cleanMessage = typeof message === 'string' ? message.trim() : null;
      if (cleanMessage) {
        const recentDuplicate = await prisma.onlineSupportMessage.findFirst({
          where: {
            phoneNumber: normalizedPhone,
            category: 'FEEDBACK',
            message: cleanMessage,
            createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // within last 1 hour
          }
        });

        if (recentDuplicate) {
          return NextResponse.json({
            success: true,
            id: recentDuplicate.id,
            displayId: recentDuplicate.displayId,
            isDuplicate: true
          });
        }
      }
    }

    // IP address for rate-limiting reference if available
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;

    const record = await prisma.onlineSupportMessage.create({
      data: {
        phoneNumber: normalizedPhone,
        category,
        message: typeof message === 'string' ? message.trim() : null,
        ipAddress: ip
      }
    });

    return NextResponse.json({
      success: true,
      id: record.id,
      displayId: record.displayId
    });
  } catch (error) {
    console.error('Error recording online support message:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت درخواست پشتیبانی. لطفاً مجدداً تلاش نمایید.' },
      { status: 500 }
    );
  }
}

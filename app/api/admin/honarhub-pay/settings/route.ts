import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const body = await req.json();
    const { apiKey, isSandbox, baseUrl } = body;

    const updated = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: {
        honarhubPayApiKey: apiKey?.trim() || undefined,
        honarhubPayIsSandbox: typeof isSandbox === 'boolean' ? isSandbox : true,
        honarhubPayBaseUrl: baseUrl?.trim() || 'https://pay.honarhub.com',
      },
      create: {
        id: 'default',
        honarhubPayApiKey: apiKey?.trim() || 'hp_sandbox_test_key_2026',
        honarhubPayIsSandbox: typeof isSandbox === 'boolean' ? isSandbox : true,
        honarhubPayBaseUrl: baseUrl?.trim() || 'https://pay.honarhub.com',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تنظیمات درگاه هنرهاب پی با موفقیت ذخیره شد.',
      config: {
        apiKey: updated.honarhubPayApiKey,
        isSandbox: updated.honarhubPayIsSandbox,
        baseUrl: updated.honarhubPayBaseUrl,
      },
    });
  } catch (error: any) {
    console.error('Error saving HonarHub Pay settings:', error);
    return NextResponse.json(
      { error: 'خطا در ذخیره تنظیمات درگاه: ' + error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const vercelJsonPath = path.join(process.cwd(), 'vercel.json');

// GET /api/admin/cron-settings - دریافت تنظیمات فعلی vercel.json
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let isEnabled = false;
    let schedule = '0 8 * * *';
    let pathEndpoint = '/api/cron/ai-blogger';

    if (fs.existsSync(vercelJsonPath)) {
      const raw = fs.readFileSync(vercelJsonPath, 'utf-8');
      const data = JSON.parse(raw);
      const aiCron = data.crons?.find((c: any) => c.path === '/api/cron/ai-blogger');
      if (aiCron) {
        isEnabled = true;
        schedule = aiCron.schedule || '0 8 * * *';
        pathEndpoint = aiCron.path;
      }
    }

    return NextResponse.json({
      success: true,
      isEnabled,
      schedule,
      path: pathEndpoint
    });
  } catch (error: any) {
    console.error('Error reading vercel.json:', error);
    return NextResponse.json({ error: error.message || 'خطا در خواندن تنظیمات' }, { status: 500 });
  }
}

// POST /api/admin/cron-settings - ذخیره و بروزرسانی تنظیمات در vercel.json
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isEnabled, schedule } = body;

    let existingData: any = {};
    if (fs.existsSync(vercelJsonPath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
      } catch (e) {
        existingData = {};
      }
    }

    let crons = existingData.crons || [];
    // Remove existing ai-blogger cron
    crons = crons.filter((c: any) => c.path !== '/api/cron/ai-blogger');

    if (isEnabled) {
      crons.push({
        path: '/api/cron/ai-blogger',
        schedule: schedule || '0 8 * * *'
      });
    }

    existingData.crons = crons;

    fs.writeFileSync(vercelJsonPath, JSON.stringify(existingData, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'تنظیمات کرون‌جاب با موفقیت ذخیره و در vercel.json اعمال شد.',
      isEnabled,
      schedule
    });
  } catch (error: any) {
    console.error('Error saving vercel.json:', error);
    return NextResponse.json({ error: error.message || 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}

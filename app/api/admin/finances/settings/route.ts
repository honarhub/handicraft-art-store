import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCommissionSettings } from '@/lib/commission';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const settings = await getCommissionSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Fetch commission settings error:', error);
    return NextResponse.json({ error: 'خطا در دریافت تنظیمات کارمزد' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز.' }, { status: 403 });
    }

    const body = await req.json();

    const updatedSettings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: {
        commissionBronzeRate: Number(body.commissionBronzeRate) ?? 5.0,
        commissionSilverRate: Number(body.commissionSilverRate) ?? 3.0,
        commissionSilverMonthlySales: Math.max(1, parseInt(body.commissionSilverMonthlySales, 10) || 10),
        commissionSilverYearlySales: Math.max(1, parseInt(body.commissionSilverYearlySales, 10) || 50),
        commissionGoldenRate: Number(body.commissionGoldenRate) ?? 1.0,
        commissionGoldenMonthlySales: Math.max(1, parseInt(body.commissionGoldenMonthlySales, 10) || 30),
        commissionGoldenYearlySales: Math.max(1, parseInt(body.commissionGoldenYearlySales, 10) || 200),
        commissionIranZaminRate: Number(body.commissionIranZaminRate) ?? 0.0,
        commissionIranZaminMonthlySales: Math.max(1, parseInt(body.commissionIranZaminMonthlySales, 10) || 100),
        specialOfferLaunchActive: Boolean(body.specialOfferLaunchActive),
        specialOfferLaunchDeadline: String(body.specialOfferLaunchDeadline || '1406/01/01').trim(),
        specialOfferLaunchTier: String(body.specialOfferLaunchTier || 'GOLDEN').trim(),
        specialOfferLaunchRate: Number(body.specialOfferLaunchRate) ?? 1.0,
      },
      create: {
        id: 'default',
        commissionBronzeRate: Number(body.commissionBronzeRate) ?? 5.0,
        commissionSilverRate: Number(body.commissionSilverRate) ?? 3.0,
        commissionSilverMonthlySales: Math.max(1, parseInt(body.commissionSilverMonthlySales, 10) || 10),
        commissionSilverYearlySales: Math.max(1, parseInt(body.commissionSilverYearlySales, 10) || 50),
        commissionGoldenRate: Number(body.commissionGoldenRate) ?? 1.0,
        commissionGoldenMonthlySales: Math.max(1, parseInt(body.commissionGoldenMonthlySales, 10) || 30),
        commissionGoldenYearlySales: Math.max(1, parseInt(body.commissionGoldenYearlySales, 10) || 200),
        commissionIranZaminRate: Number(body.commissionIranZaminRate) ?? 0.0,
        commissionIranZaminMonthlySales: Math.max(1, parseInt(body.commissionIranZaminMonthlySales, 10) || 100),
        specialOfferLaunchActive: Boolean(body.specialOfferLaunchActive),
        specialOfferLaunchDeadline: String(body.specialOfferLaunchDeadline || '1406/01/01').trim(),
        specialOfferLaunchTier: String(body.specialOfferLaunchTier || 'GOLDEN').trim(),
        specialOfferLaunchRate: Number(body.specialOfferLaunchRate) ?? 1.0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تنظیمات سطوح کارمزد و آفر ویژه با موفقیت ذخیره شد.',
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error('Update commission settings error:', error);
    return NextResponse.json({ error: 'خطا در ذخیره تنظیمات کارمزد: ' + error.message }, { status: 500 });
  }
}

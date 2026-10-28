import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. تخصص‌های در انتظار تایید
    const pendingSpecialtiesCount = await prisma.specialty.count({
      where: { isApproved: false }
    });

    // 2. شمارش درخواست‌های احراز هویت (قرمز) و ویرایش‌ها (زرد) و فیلترهای سطوح
    const allArtistsForCount = await prisma.artistProfile.findMany({
      where: { isDeleted: false },
      select: { verificationLevel: true, pendingEdits: true, nationalId: true }
    });

    const hasEdits = (pendingEdits: any) => {
      if (!pendingEdits) return false;
      try {
        const parsed = typeof pendingEdits === 'string' ? JSON.parse(pendingEdits) : pendingEdits;
        if (parsed?.type === 'LEVEL_3_KYC') return false;
        return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
      } catch {
        return false;
      }
    };

    // درخواست‌های احراز هویت سطح ۲ (قرمز): سطح ۰ یا ۱ که پروفایل فرستاده‌اند
    const level2PendingCount = allArtistsForCount.filter(a => (a.verificationLevel || 0) < 2 && hasEdits(a.pendingEdits)).length;

    // درخواست‌های احراز هویت سطح ۳ (قرمز): سطح ۲ که مدارک مالی ثبت کرده‌اند
    const isL3Pending = (a: any) => {
      if ((a.verificationLevel || 0) !== 2) return false;
      if (a.nationalId) return true;
      try {
        const pe = typeof a.pendingEdits === 'string' ? JSON.parse(a.pendingEdits) : a.pendingEdits;
        if (pe?.type === 'LEVEL_3_KYC') return true;
      } catch {}
      return false;
    };
    const level3PendingCount = allArtistsForCount.filter(isL3Pending).length;

    // کل نوتیف‌های قرمز برای منوی هنرمندان
    const verificationRequestsCount = level2PendingCount + level3PendingCount;

    // درخواست‌های ویرایش پروفایل هنرمندان تایید شده (زرد): سطح ۲ یا ۳ که ادیت دارند
    const profileEditsCount = allArtistsForCount.filter(a => (a.verificationLevel || 0) >= 2 && hasEdits(a.pendingEdits)).length;

    // تعداد هنرمندان سطح صفر (جهت دکمه فیلتر بالای صفحه)
    const level0Count = allArtistsForCount.filter(a => (a.verificationLevel || 0) === 0).length;

    // تعداد هنرمندان سطح یک (جهت دکمه فیلتر بالای صفحه)
    const level1Count = allArtistsForCount.filter(a => (a.verificationLevel || 0) === 1).length;

    // 4. محصولات: جدید (PENDING بدون ویرایش) و محصولات دارای تغییرات پیشنهادی (pendingEdits)
    const allProductsForCount = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { pendingEdits: true, status: true }
    });
    const hasProductEdits = (p: any) => {
      if (!p.pendingEdits) return false;
      try {
        const edits = typeof p.pendingEdits === 'string' ? JSON.parse(p.pendingEdits) : p.pendingEdits;
        return edits && typeof edits === 'object' && Object.keys(edits).length > 0;
      } catch {
        return false;
      }
    };

    const pendingProductEditsCount = allProductsForCount.filter((p) => hasProductEdits(p)).length;
    // محصولات جدید: فقط آن‌هایی که PENDING هستند و اصلاحیه/ویرایش نیستند
    const newProductsCount = allProductsForCount.filter((p) => p.status === 'PENDING' && !hasProductEdits(p)).length;

    // 5. پیام‌های پشتیبانی در انتظار پاسخ
    const pendingSupportCount = await prisma.supportMessage.count({
      where: { status: 'PENDING' }
    });

    // 6. درخواست‌های موجودی که هنوز اطلاع‌رسانی نشده‌اند
    const pendingStockRequestsCount = await prisma.stockNotification.count({
      where: { isNotified: false }
    });

    return NextResponse.json({
      newRegistrationsCount: verificationRequestsCount, // Red notification badge
      pendingArtistsCount: profileEditsCount, // Yellow notification badge
      verificationRequestsCount,
      profileEditsCount,
      level0Count,
      level1Count,
      level2PendingCount,
      level3PendingCount,
      newProductsCount,
      pendingProductEditsCount,
      pendingSpecialtiesCount,
      pendingSupportCount,
      pendingStockRequestsCount
    });
  } catch (error) {
    console.error('Error fetching admin counts:', error);
    return NextResponse.json({ error: 'Failed to fetch counts' }, { status: 500 });
  }
}

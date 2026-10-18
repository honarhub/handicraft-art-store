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

    // 2. هنرمندان جدید (ثبت‌نام شده ولی هنوز تایید نشده)
    const newRegistrationsCount = await prisma.artistProfile.count({
      where: { isApproved: false, isDeleted: false }
    });

    // 3. درخواست‌های ویرایش پروفایل هنرمندان
    const allArtistsForCount = await prisma.artistProfile.findMany({
      where: { isDeleted: false },
      select: { pendingEdits: true }
    });
    const pendingArtistsCount = allArtistsForCount.filter((a) => {
      if (!a.pendingEdits) return false;
      try {
        const edits = typeof a.pendingEdits === 'string' ? JSON.parse(a.pendingEdits) : a.pendingEdits;
        return edits && typeof edits === 'object' && Object.keys(edits).length > 0;
      } catch {
        return false;
      }
    }).length;

    // 4. محصولات: جدید (PENDING) و محصولات دارای تغییرات پیشنهادی (pendingEdits)
    const allProductsForCount = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { pendingEdits: true, status: true }
    });
    const pendingProductEditsCount = allProductsForCount.filter((p) => {
      if (!p.pendingEdits) return false;
      try {
        const edits = typeof p.pendingEdits === 'string' ? JSON.parse(p.pendingEdits) : p.pendingEdits;
        return edits && typeof edits === 'object' && Object.keys(edits).length > 0;
      } catch {
        return false;
      }
    }).length;
    const newProductsCount = allProductsForCount.filter((p) => p.status === 'PENDING').length;

    // 5. پیام‌های پشتیبانی در انتظار پاسخ
    const pendingSupportCount = await prisma.supportMessage.count({
      where: { status: 'PENDING' }
    });

    // 6. درخواست‌های موجودی که هنوز اطلاع‌رسانی نشده‌اند
    const pendingStockRequestsCount = await prisma.stockNotification.count({
      where: { isNotified: false }
    });

    return NextResponse.json({
      newRegistrationsCount,
      pendingArtistsCount,
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

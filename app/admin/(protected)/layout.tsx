import React from 'react';
import prisma from '@/lib/prisma';

import { Prisma } from '@prisma/client';
import AdminSidebarNav from './AdminSidebarNav';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LogoutButton from '@/app/components/LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Admin Auth Check
  if (!session || !session.user || !session.user.id) {
    redirect('/admin/login');
  } else if (session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="text-5xl mb-4">🛑</div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">دسترسی غیرمجاز</h1>
          <p className="text-slate-600 mb-6">
            شما با حساب کاربری <strong>{session.user.name || session.user.email || 'ناشناس'}</strong> (نقش: {session.user.role || 'نامشخص'}) وارد شده‌اید که دسترسی ادمین ندارد.
          </p>
          <div className="space-y-3">
            <LogoutButton callbackUrl="/admin/login" className="block w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">
              خروج از حساب فعلی
            </LogoutButton>
            <a href="/" className="block w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition">
              بازگشت به صفحه اصلی
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Get pending specialties count
  const pendingSpecialtiesCount = await prisma.specialty.count({
    where: { isApproved: false }
  });

  // Get count of artists for verification requests (RED) and profile edits (YELLOW)
  const allArtistsForCount = await prisma.artistProfile.findMany({
    where: { isDeleted: false },
    select: { verificationLevel: true, pendingEdits: true, nationalId: true, deletionRequested: true }
  });

  const hasEditsLayout = (pendingEdits: any) => {
    if (!pendingEdits) return false;
    try {
      const parsed = typeof pendingEdits === 'string' ? JSON.parse(pendingEdits) : pendingEdits;
      return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
    } catch {
      return false;
    }
  };

  const level2PendingCount = allArtistsForCount.filter(a => (a.verificationLevel || 0) < 2 && hasEditsLayout(a.pendingEdits)).length;
  const level3PendingCount = allArtistsForCount.filter(a => a.verificationLevel === 2 && Boolean(a.nationalId)).length;
  const deletionRequestsCount = allArtistsForCount.filter(a => Boolean(a.deletionRequested)).length;
  // Red notification badge: requests for Level 2 & Level 3 & Deletion requests
  const newRegistrationsCount = level2PendingCount + level3PendingCount + deletionRequestsCount;
  // Yellow notification badge: edits by verified artists (Level 2 & 3)
  const pendingArtistsCount = allArtistsForCount.filter(a => (a.verificationLevel || 0) >= 2 && hasEditsLayout(a.pendingEdits)).length;

  // Get products count: new and pending edits
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
  const newProductsCount = allProductsForCount.filter((p) => p.status === 'PENDING' && !hasProductEdits(p)).length;

  // Support messages count
  const pendingSupportCount = await prisma.supportMessage.count({
    where: { status: 'PENDING' }
  });

  // Stock notification requests count
  const pendingStockRequestsCount = await prisma.stockNotification.count({
    where: { isNotified: false }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* سایدبار ادمین کل */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 shadow-xl z-20">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {/* لوگوی هنرهاب ارجاع به صفحه اصلی سایت */}
              <a
                href="/"
                className="text-xl font-black tracking-tight flex items-center select-none group"
                dir="rtl"
                title="مشاهده صفحه اصلی فروشگاه هنرهاب"
              >
                <span className="text-white">هنر</span>
                <span className="bg-[#FF9900] text-black px-1.5 py-0.5 rounded mr-1 text-xs font-black shadow-sm group-hover:scale-105 transition-transform">
                  هاب
                </span>
              </a>
            </div>
            <h1 className="text-sm sm:text-base font-black text-white tracking-tight">کنترل پنل ارشد</h1>
            <p className="text-[11px] text-slate-400">مدیریت کل سیستم</p>
          </div>

          <a
            href="/"
            title="بازگشت به صفحه اصلی سایت"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>صفحه اصلی</span>
          </a>
        </div>
        <AdminSidebarNav 
          initialCounts={{
            newRegistrationsCount,
            pendingArtistsCount,
            newProductsCount,
            pendingProductEditsCount,
            pendingSpecialtiesCount,
            pendingSupportCount,
            pendingStockRequestsCount
          }}
        />
        <div className="p-4 mt-auto border-t border-slate-800">
          <a href="/" target="_blank" className="px-4 py-2 w-full text-center rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors text-xs text-slate-400 block">
            مشاهده سایت
          </a>
        </div>
      </aside>

      {/* محتوای اصلی */}
      <main className="flex-1 w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

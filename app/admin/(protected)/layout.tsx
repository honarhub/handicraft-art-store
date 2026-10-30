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
  if (!session || !session.user) {
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
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black text-white tracking-tight">کنترل پنل ارشد</h1>
          <p className="text-xs text-slate-500 mt-1">مدیریت کل سیستم</p>
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

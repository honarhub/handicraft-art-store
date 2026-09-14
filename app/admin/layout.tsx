import React from 'react';
import prisma from '@/lib/prisma';

import { Prisma } from '@prisma/client';
import AdminSidebarNav from './AdminSidebarNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // گرفتن تعداد تخصص‌های در انتظار تایید
  const pendingSpecialtiesCount = await prisma.specialty.count({
    where: { isApproved: false }
  });

  // گرفتن تعداد درخواست‌های ویرایش پروفایل هنرمندان
  const pendingArtistsCount = await prisma.artistProfile.count({
    where: { pendingEdits: { not: Prisma.AnyNull } }
  });

  const pendingProductsCount = await prisma.product.count({
    where: { status: 'PENDING' }
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
          pendingArtistsCount={pendingArtistsCount}
          pendingProductsCount={pendingProductsCount}
          pendingSpecialtiesCount={pendingSpecialtiesCount}
        />
        <div className="p-4 mt-auto border-t border-slate-800">
          <a href="/" className="px-4 py-2 w-full text-center rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors text-xs text-slate-400 block">
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

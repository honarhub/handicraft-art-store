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

  // گرفتن تعداد تخصص‌های در انتظار تایید
  const pendingSpecialtiesCount = await prisma.specialty.count({
    where: { isApproved: false }
  });

  // گرفتن تعداد هنرمندان جدید (ثبت‌نام شده ولی هنوز تایید نشده)
  const newRegistrationsCount = await prisma.artistProfile.count({
    where: { isApproved: false, isDeleted: false }
  });

  // گرفتن تعداد درخواست‌های ویرایش پروفایل هنرمندان
  // با دریافت اطلاعات و فیلتر در مموری برای جلوگیری از مشکلات Null در فیلد JSON
  const allArtistsForCount = await prisma.artistProfile.findMany({
    where: { isDeleted: false },
    select: { pendingEdits: true }
  });
  const pendingArtistsCount = allArtistsForCount.filter((a) => {
    if (!a.pendingEdits) return false;
    // Check if it's a string (like "null" or "{}") or object
    const edits = typeof a.pendingEdits === 'string' ? JSON.parse(a.pendingEdits) : a.pendingEdits;
    return edits && typeof edits === 'object' && Object.keys(edits).length > 0;
  }).length;

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
          newRegistrationsCount={newRegistrationsCount}
          pendingArtistsCount={pendingArtistsCount}
          pendingProductsCount={pendingProductsCount}
          pendingSpecialtiesCount={pendingSpecialtiesCount}
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

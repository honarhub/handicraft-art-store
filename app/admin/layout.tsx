import React from 'react';
import prisma from '@/lib/prisma';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // گرفتن تعداد تخصص‌های در انتظار تایید
  const pendingSpecialtiesCount = await prisma.specialty.count({
    where: { isApproved: false }
  });

  // گرفتن تعداد درخواست‌های ویرایش پروفایل هنرمندان
  const pendingArtistsCount = await prisma.artistProfile.count({
    where: { pendingEdits: { not: null } }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* سایدبار ادمین کل */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black text-white tracking-tight">کنترل پنل ارشد</h1>
          <p className="text-xs text-slate-500 mt-1">مدیریت کل سیستم</p>
        </div>
        <nav className="p-4 flex flex-col gap-2">
          <a href="/admin/dashboard" className="px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm flex items-center gap-3">
            📊 پیشخوان اصلی
          </a>
          <a href="/admin/artists" className="px-4 py-3 rounded-lg bg-slate-800 text-white font-medium text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              🎭 مدیریت هنرمندان
            </div>
            {pendingArtistsCount > 0 && (
              <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                {pendingArtistsCount}
              </span>
            )}
          </a>
          <a href="/admin/products" className="px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm flex items-center gap-3">
            📦 تایید محصولات
          </a>
          <a href="/admin/specialties" className="px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              🏷️ مدیریت تخصص‌ها
            </div>
            {pendingSpecialtiesCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingSpecialtiesCount}
              </span>
            )}
          </a>
        </nav>
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

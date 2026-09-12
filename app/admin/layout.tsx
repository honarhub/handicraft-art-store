import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
          <a href="/admin/artists" className="px-4 py-3 rounded-lg bg-slate-800 text-white font-medium text-sm flex items-center gap-3">
            🎭 مدیریت هنرمندان
          </a>
          <a href="/admin/products" className="px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm flex items-center gap-3">
            📦 تایید محصولات
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

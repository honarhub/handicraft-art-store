import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import LogoutButton from '@/app/components/LogoutButton';

export default async function ArtistPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN')) {
    redirect('/artist-panel/login');
  }

  const artist = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true }
  });

  if (!artist) {
    redirect('/artist-panel/login');
  }


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* سایدبار هنرمند */}
      <aside className="w-full md:w-64 bg-teal-900 text-teal-100 flex-shrink-0 shadow-xl z-20">
        <div className="p-6 border-b border-teal-800 flex items-center gap-4">
          {artist.user.image ? (
            <img src={artist.user.image} alt={artist.user.name || ''} className="w-12 h-12 rounded-full border-2 border-teal-700 object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-teal-800 flex items-center justify-center font-bold text-xl">
              {artist.user.name?.[0]}
            </div>
          )}
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">{artist.user.name}</h1>
            <p className="text-xs text-teal-400 mt-1">پنل اختصاصی هنرمند</p>
          </div>
        </div>
        <nav className="p-4 flex flex-col gap-2">
          <a href="/artist-panel/dashboard" className="px-4 py-3 rounded-lg hover:bg-teal-800 transition-colors font-medium text-sm flex items-center gap-3">
            📊 پیشخوان من
          </a>
          <a href="/artist-panel/products" className="px-4 py-3 rounded-lg hover:bg-teal-800 transition-colors font-medium text-sm flex items-center gap-3">
            📦 مدیریت آثار و محصولات
          </a>
          <a href="/artist-panel/profile" className="px-4 py-3 rounded-lg hover:bg-teal-800 transition-colors font-medium text-sm flex items-center gap-3">
            👤 ویرایش پروفایل
          </a>
          <a href="/artist-panel/security" className="px-4 py-3 rounded-lg hover:bg-teal-800 transition-colors font-medium text-sm flex items-center gap-3">
            🔒 تنظیمات امنیتی
          </a>
        </nav>
        <div className="p-4 mt-auto border-t border-teal-800 space-y-2">
          <a href={`/artist/${artist.id}`} target="_blank" className="px-4 py-2 w-full text-center rounded-lg border border-teal-700 hover:bg-teal-800 transition-colors text-xs text-teal-300 block">
            مشاهده صفحه عمومی من
          </a>
          <LogoutButton callbackUrl="/artist-panel/login" className="px-4 py-2 w-full text-center rounded-lg hover:bg-red-900/50 text-red-300 transition-colors text-xs font-bold block">
            خروج از حساب
          </LogoutButton>
        </div>
      </aside>

      {/* محتوای اصلی */}
      <main className="flex-1 w-full overflow-y-auto flex flex-col">
        {artist.user.mustChangePassword && (
          <div className="bg-red-500 text-white p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="font-bold text-sm">رمز عبور شما توسط ادمین تغییر یافته است. برای امنیت حساب، لطفاً هرچه سریع‌تر رمز عبور جدیدی تنظیم کنید.</p>
            </div>
            <a href="/artist-panel/security" className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors whitespace-nowrap mr-4">
              تغییر رمز عبور
            </a>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

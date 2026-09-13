import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function ArtistPanelLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const artistId = cookieStore.get('artistId')?.value;

  if (!artistId) {
    redirect('/artist-panel/login');
  }

  const artist = await prisma.artistProfile.findUnique({
    where: { id: artistId },
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
        </nav>
        <div className="p-4 mt-auto border-t border-teal-800 space-y-2">
          <a href={`/artist/${artist.id}`} target="_blank" className="px-4 py-2 w-full text-center rounded-lg border border-teal-700 hover:bg-teal-800 transition-colors text-xs text-teal-300 block">
            مشاهده صفحه عمومی من
          </a>
          <a href="/artist-panel/login" className="px-4 py-2 w-full text-center rounded-lg hover:bg-red-900/50 text-red-300 transition-colors text-xs font-bold block">
            خروج از حساب
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

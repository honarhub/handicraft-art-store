import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import LogoutButton from '@/app/components/LogoutButton';
import ArtistSidebarNav from './ArtistSidebarNav';
import ArtistVerificationBanner from './ArtistVerificationBanner';

export default async function ArtistPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/artist-panel/login');
  }

  // Ensure user has artist or admin privileges
  if (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN') {
    redirect('/artist-panel/login?error=not_artist');
  }

  let artist = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true }
  });

  // Auto-create artist profile for admin users if testing or managing artist panel
  if (!artist && session.user.role === 'ADMIN') {
    artist = await prisma.artistProfile.create({
      data: {
        userId: session.user.id,
        isApproved: true,
        isActive: true,
        bio: 'مدیر کل سیستم (Master Admin)',
      },
      include: { user: true }
    });
  }

  if (!artist) {
    redirect('/artist-panel/login?error=no_profile');
  }

  if (artist.isDeleted) {
    redirect('/artist-panel/login?error=deleted');
  }

  // If artist is at Level 0 (hasn't completed Level 1 onboarding), redirect to onboarding
  if ((artist.verificationLevel || 0) === 0 && session.user.role !== 'ADMIN') {
    redirect('/artist-panel/onboarding');
  }

  const unreadFeedbackCount = await prisma.product.count({
    where: {
      artistId: artist.id,
      adminFeedbackRead: false,
      adminFeedback: { not: null }
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* Artist Sidebar */}
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
        <ArtistSidebarNav initialUnreadFeedbackCount={unreadFeedbackCount} />
        <div className="p-4 mt-auto border-t border-teal-800 space-y-2">
          {session.user.role === 'ADMIN' && (
            <a href="/admin" className="px-4 py-2 w-full text-center rounded-lg bg-amber-500 hover:bg-amber-600 transition-colors text-xs text-slate-900 font-bold block shadow-sm">
              👑 ورود به کنترل پنل ارشد
            </a>
          )}
          <a href={`/artist/${artist.id}`} target="_blank" className="px-4 py-2 w-full text-center rounded-lg border border-teal-700 hover:bg-teal-800 transition-colors text-xs text-teal-300 block">
            مشاهده صفحه عمومی من
          </a>
          <LogoutButton callbackUrl="/artist-panel/login" className="px-4 py-2 w-full text-center rounded-lg hover:bg-red-900/50 text-red-300 transition-colors text-xs font-bold block">
            خروج از حساب
          </LogoutButton>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-y-auto flex flex-col p-4 sm:p-8">
        <ArtistVerificationBanner
          verificationLevel={artist.verificationLevel || 0}
          isApproved={artist.isApproved}
          brandName={artist.brandName}
        />
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

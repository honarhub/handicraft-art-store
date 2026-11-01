import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ArtistSidebar from './ArtistSidebar';
import ArtistVerificationBanner from './ArtistVerificationBanner';
import { hasProfilePendingEdits } from '@/lib/sms';

export default async function ArtistPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
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
      {/* Artist Sidebar (Desktop persistent + Mobile sticky top header) */}
      <ArtistSidebar 
        artist={artist} 
        unreadFeedbackCount={unreadFeedbackCount} 
        verificationLevel={artist.verificationLevel || 0} 
        isAdmin={session.user.role === 'ADMIN'} 
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-y-auto flex flex-col p-3 sm:p-6 md:p-8">
        <ArtistVerificationBanner
          artistId={artist.id}
          verificationLevel={artist.verificationLevel || 0}
          isApproved={artist.isApproved}
          brandName={artist.brandName}
          hasPendingEdits={hasProfilePendingEdits(artist.pendingEdits)}
          adminFeedback={artist.adminFeedback}
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

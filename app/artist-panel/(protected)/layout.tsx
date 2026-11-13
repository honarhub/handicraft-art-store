import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import LogoutButton from '@/app/components/LogoutButton';
import ArtistSidebar from './ArtistSidebar';
import ArtistVerificationBanner from './ArtistVerificationBanner';
import PasswordChangeWarningBanner from './PasswordChangeWarningBanner';
import { hasProfilePendingEdits } from '@/lib/sms';

export default async function ArtistPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect('/artist-panel/login');
  }

  // Ensure user has artist or admin privileges
  if (session.user.role !== 'ARTIST' && session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-200/80">
          <div className="text-5xl mb-4">🎨</div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">دسترسی به استودیوی هنرمندان</h1>
          <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed">
            شما با حساب کاربری <strong>{session.user.name || session.user.email || 'هنرهاب'}</strong> (نقش: {session.user.role === 'USER' ? 'کاربر عادی / هنردوست' : session.user.role}) وارد شده‌اید که دسترسی هنرمند ندارد.
          </p>
          <div className="space-y-3">
            <Link
              href="/artist-panel/login?tab=register"
              className="block w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20 text-xs sm:text-sm"
            >
              ثبت‌نام و ارتقای حساب به هنرمند
            </Link>
            <LogoutButton callbackUrl="/artist-panel/login" className="block w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition text-xs sm:text-sm">
              خروج از حساب فعلی
            </LogoutButton>
            <Link href="/" className="block w-full py-2.5 text-slate-500 text-xs font-bold hover:text-slate-700 transition">
              بازگشت به فروشگاه هنرهاب
            </Link>
          </div>
        </div>
      </div>
    );
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
      deletedAt: null,
      adminFeedbackRead: false,
      AND: [
        { adminFeedback: { not: null } },
        { adminFeedback: { not: '' } }
      ]
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-x-hidden max-w-full" dir="rtl">
      {/* Artist Sidebar (Desktop persistent + Mobile sticky top header) */}
      <ArtistSidebar 
        artist={artist} 
        unreadFeedbackCount={unreadFeedbackCount} 
        verificationLevel={artist.verificationLevel || 0} 
        isAdmin={session.user.role === 'ADMIN'} 
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0 max-w-full overflow-x-hidden flex flex-col p-3 sm:p-6 md:p-8">
        <ArtistVerificationBanner
          artistId={artist.id}
          verificationLevel={artist.verificationLevel || 0}
          isApproved={artist.isApproved}
          brandName={artist.brandName}
          hasPendingEdits={hasProfilePendingEdits(artist.pendingEdits)}
          adminFeedback={artist.adminFeedback}
        />
        {artist.user.mustChangePassword && (
          <PasswordChangeWarningBanner userId={artist.userId} />
        )}
        {children}
      </main>
    </div>
  );
}

import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import PanelNav from './PanelNav';

export const metadata = {
  title: 'پیشخوان کاربری و باشگاه هنردوستان | هنرهاب',
  description: 'مدیریت سفارش‌ها، آدرس‌ها و لیست علاقه‌مندی‌های آثار صنایع دستی',
};

export default async function CustomerPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/panel');
  }

  const [userRecord, ordersCount, wishlistCount, addressesCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true }
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
    prisma.wishlistItem.count({ where: { userId: session.user.id } }),
    prisma.userAddress.count({ where: { userId: session.user.id } }),
  ]);

  if (!userRecord?.password) {
    redirect('/auth/set-password');
  }

  const userRole = session.user.role || 'USER';
  const isArtist = userRole === 'ARTIST' || userRole === 'ADMIN';
  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" dir="rtl">
      <SiteHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 items-start">
          {/* Navigation Sidebar / Tabs */}
          <div className="md:col-span-1 md:sticky md:top-24">
            <PanelNav
              counts={{
                orders: ordersCount,
                wishlist: wishlistCount,
                addresses: addressesCount,
              }}
              isArtist={isArtist}
              isAdmin={isAdmin}
            />
          </div>

          {/* Page Content */}
          <div className="md:col-span-3 space-y-6">
            {children}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

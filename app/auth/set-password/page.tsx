import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import SetPasswordForm from './SetPasswordForm';

export const metadata = {
  title: 'تعیین رمز عبور | هنرهاب',
  description: 'تعیین رمز عبور برای ورود سریع و امن به فروشگاه آنلاین صنایع دستی هنرهاب'
};

export default async function SetPasswordPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/auth/set-password');
  }

  // Check if user already has a password
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, password: true }
  });

  if (!user) {
    redirect('/login');
  }

  if (user.password) {
    // Already has a password -> redirect to panel
    redirect('/panel');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <SetPasswordForm email={user.email} name={user.name} />
      </main>
      <SiteFooter />
    </div>
  );
}

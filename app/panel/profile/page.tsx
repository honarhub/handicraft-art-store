import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProfileManager from './ProfileManager';

export const metadata = {
  title: 'پروفایل و اطلاعات حساب | هنرهاب',
  description: 'مدیریت اطلاعات کاربری، نام، شماره موبایل و رمز عبور در فروشگاه آنلاین صنایع دستی هنرهاب'
};

export default async function CustomerProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/panel/profile');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      image: true,
      role: true,
      password: true,
      createdAt: true,
      artistProfile: {
        select: {
          id: true,
          brandName: true,
          verificationLevel: true
        }
      }
    }
  });

  if (!user) {
    redirect('/login?callbackUrl=/panel/profile');
  }

  const serializedUser = {
    id: user.id,
    name: user.name || '',
    email: user.email || null,
    phoneNumber: user.phoneNumber,
    image: user.image || null,
    role: user.role,
    hasPassword: Boolean(user.password),
    isArtist: user.role === 'ARTIST' || Boolean(user.artistProfile),
    isAdmin: user.role === 'ADMIN',
    createdAt: user.createdAt.toISOString()
  };

  return <ProfileManager initialUser={serializedUser} />;
}

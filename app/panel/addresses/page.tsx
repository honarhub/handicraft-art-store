import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import AddressesManager from './AddressesManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerAddressesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login?callbackUrl=/panel/addresses');

  const [addresses, user] = await Promise.all([
    prisma.userAddress.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, phoneNumber: true }
    })
  ]);

  return <AddressesManager initialAddresses={addresses} defaultRecipient={user} />;
}

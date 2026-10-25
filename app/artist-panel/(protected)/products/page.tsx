import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ArtistProductsTable from './ArtistProductsTable';

export default async function ArtistProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/artist-panel/login');
  
  const artist = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id }
  });
  const artistId = artist?.id;
  
  if (!artistId) redirect('/artist-panel/login');

  const products = await prisma.product.findMany({
    where: { artistId },
    include: { specialties: true, pricingTiers: true },
    orderBy: { createdAt: 'desc' }
  });

  // Serialize products data for client component consumption
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">محصولات من</h2>
          <p className="text-slate-500 mt-1 text-sm">لیست تمامی آثار ثبت شده شما در پلتفرم</p>
        </div>
        <Link 
          href="/artist-panel/products/new" 
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-colors"
        >
          ثبت اثر جدید
        </Link>
      </div>

      <ArtistProductsTable initialProducts={serializedProducts} />
    </div>
  );
}

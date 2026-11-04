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
    <div className="w-full max-w-7xl mx-auto min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">محصولات من</h2>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">لیست تمامی آثار ثبت شده شما در پلتفرم</p>
        </div>
        <Link 
          href="/artist-panel/products/new" 
          className="w-full sm:w-auto text-center bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-base font-black">+</span>
          <span>ثبت اثر جدید</span>
        </Link>
      </div>

      <ArtistProductsTable initialProducts={serializedProducts} />
    </div>
  );
}

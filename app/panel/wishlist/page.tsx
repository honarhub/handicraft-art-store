import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import WishlistManager from './WishlistManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'لیست علاقه‌مندی‌ها | هنرهاب',
  description: 'آثار هنری و دست‌سازه‌های نشان‌شده شما در فروشگاه آنلاین صنایع دستی هنرهاب'
};

export default async function CustomerWishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/panel/wishlist');
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          artist: {
            select: {
              brandName: true,
              user: { select: { name: true } }
            }
          },
          pricingTiers: {
            orderBy: { price: 'asc' },
            take: 1
          },
          specialties: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const serializedItems = items
    .filter(item => item.product && !item.product.deletedAt)
    .map(item => ({
      id: item.product.id,
      title: item.product.title,
      imageUrl: item.product.imageUrl || '/placeholder.png',
      stockQuantity: item.product.stockQuantity ?? 0,
      artistName: item.product.artist?.brandName || item.product.artist?.user?.name || 'هنرمند هنرهاب',
      price: item.product.pricingTiers?.[0]?.price ?? null,
      specialty: item.product.specialties?.[0]?.name ?? null,
      savedAt: item.createdAt.toISOString()
    }));

  return <WishlistManager initialItems={serializedItems} />;
}

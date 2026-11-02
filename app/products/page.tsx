import React from 'react';
import prisma from '@/lib/prisma';
import CartIcon from '../components/CartIcon';
import ProductsFilterClient from './ProductsFilterClient';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import ProductImageWithSkeleton from '@/app/components/ProductImageWithSkeleton';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';

  // Parse Multi-select for specialties (comma-separated or array)
  const specialtyParam = params.specialty;
  const specialtyIds: string[] = typeof specialtyParam === 'string'
    ? specialtyParam.split(',').map(s => s.trim()).filter(Boolean)
    : Array.isArray(specialtyParam)
    ? (specialtyParam as string[]).filter(Boolean)
    : [];

  // Parse Multi-select for artists (comma-separated or array)
  const artistParam = params.artist;
  const artistIds: string[] = typeof artistParam === 'string'
    ? artistParam.split(',').map(a => a.trim()).filter(Boolean)
    : Array.isArray(artistParam)
    ? (artistParam as string[]).filter(Boolean)
    : [];

  const sort = typeof params.sort === 'string' ? params.sort : 'newest';
  const preOrderOnly = params.preOrder === 'true';
  const inStockOnly = params.inStock === 'true';
  
  // Calculate dynamic max price from DB
  const maxPriceRecord = await prisma.pricingTier.findFirst({
    orderBy: { price: 'desc' }
  });
  let maxPossiblePrice = maxPriceRecord ? maxPriceRecord.price : 10000000;
  const roundupUnit = 5000000; // Round up to nearest 5M
  maxPossiblePrice = Math.ceil(maxPossiblePrice / roundupUnit) * roundupUnit;

  const maxPrice = typeof params.maxPrice === 'string' ? parseInt(params.maxPrice) : maxPossiblePrice;

  // Build Prisma Where Clause
  const whereClause: any = {
    status: 'APPROVED',
    deletedAt: null,
    artist: {
      isActive: true,
      isDeleted: false,
      isApproved: true,
      verificationLevel: { gte: 2 }
    },
    pricingTiers: {
      some: {
        price: {
          gte: 0,
          lte: maxPrice
        }
      }
    }
  };

  if (preOrderOnly) {
    whereClause.isPreOrderEnabled = true;
  }

  if (inStockOnly) {
    whereClause.stockQuantity = { gt: 0 };
  }

  // Multi-artist filter
  if (artistIds.length > 0) {
    whereClause.artistId = { in: artistIds };
  }

  if (q) {
    whereClause.title = { contains: q };
  }

  // Multi-specialty filter
  if (specialtyIds.length > 0) {
    const matchedSpecialties = await prisma.specialty.findMany({
      where: {
        OR: [
          { id: { in: specialtyIds } },
          { name: { in: specialtyIds } }
        ]
      },
      select: {
        id: true,
        children: {
          select: { id: true }
        }
      }
    });

    const targetSpecialtyIds = new Set<string>(specialtyIds);
    matchedSpecialties.forEach(sp => {
      targetSpecialtyIds.add(sp.id);
      sp.children?.forEach(c => targetSpecialtyIds.add(c.id));
    });

    whereClause.specialties = {
      some: {
        id: { in: Array.from(targetSpecialtyIds) }
      }
    };
  }

  // Optimized query selecting only necessary lightweight fields
  let products = await prisma.product.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      imageUrl: true,
      stockQuantity: true,
      isPreOrderEnabled: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          orderItems: true,
          reviews: true
        }
      },
      artist: {
        select: {
          id: true,
          brandName: true,
          user: {
            select: {
              name: true,
              image: true
            }
          }
        }
      },
      specialties: {
        select: {
          id: true,
          name: true
        }
      },
      pricingTiers: {
        select: {
          price: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 60
  });

  if (sort === 'price_asc') {
    products.sort((a, b) => (a.pricingTiers[0]?.price || 0) - (b.pricingTiers[0]?.price || 0));
  } else if (sort === 'price_desc') {
    products.sort((a, b) => (b.pricingTiers[0]?.price || 0) - (a.pricingTiers[0]?.price || 0));
  } else if (sort === 'best_selling') {
    products.sort((a, b) => (b._count?.orderItems || 0) - (a._count?.orderItems || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sort === 'recommended') {
    products.sort((a, b) => (b._count?.reviews || 0) - (a._count?.reviews || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    // newest
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const masterSpecialties = await prisma.specialty.findMany({
    where: { parentId: null, isApproved: true },
    select: {
      id: true,
      name: true,
      children: {
        where: { isApproved: true },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              products: {
                where: {
                  status: 'APPROVED',
                  deletedAt: null,
                  artist: { isActive: true, isDeleted: false }
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  const allArtists = await prisma.artistProfile.findMany({
    where: { isActive: true, isDeleted: false, isApproved: true, verificationLevel: { gte: 2 } },
    select: {
      id: true,
      brandName: true,
      province: true,
      city: true,
      user: {
        select: {
          name: true,
          image: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto py-12 px-6 md:px-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">گالری آثار هنری</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">کشف و خرید بی‌واسطه دست‌سازه‌های اصیل از بهترین هنرمندان ایرانی</p>
        </div>

        <ProductsFilterClient 
          initialQ={q}
          initialSpecialties={specialtyIds}
          initialArtists={artistIds}
          initialSort={sort}
          initialMax={maxPrice}
          initialPreOrder={preOrderOnly}
          initialInStock={inStockOnly}
          maxPossiblePrice={maxPossiblePrice}
          specialties={masterSpecialties} 
          artists={allArtists}
          totalCount={products.length}
        >
          {products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">محصولی یافت نشد</h3>
              <p className="text-slate-500">با فیلترهای فعلی هیچ اثری پیدا نکردیم. لطفاً فیلترها را تغییر دهید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(product => (
                <a key={product.id} href={`/product/${product.id}`} className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-emerald-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                  <div className="aspect-square w-full relative overflow-hidden bg-slate-100">
                    {/* Progressive Image with Skeleton Shimmer */}
                    <ProductImageWithSkeleton
                      src={product.imageUrl}
                      alt={product.title}
                      containerClassName="w-full h-full"
                      className="group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Out of stock without pre-order: dimmed blurred overlay */}
                    {product.stockQuantity <= 0 && !product.isPreOrderEnabled && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center p-3 text-center z-10">
                        <span className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-md">
                          ناموجود
                        </span>
                      </div>
                    )}

                    {/* Out of stock with pre-order enabled: unblurred image with badge */}
                    {product.stockQuantity <= 0 && product.isPreOrderEnabled && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-1.5">
                          <span>✨</span>
                          <span>امکان ثبت پیش‌سفارش</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">{product.title}</h3>
                    <div className="text-xs text-slate-500 mb-4 line-clamp-1">اثر: {product.artist?.user?.name || product.artist?.brandName || 'هنرمند'}</div>
                    
                    <div className="mt-auto flex justify-between items-end">
                      <div className="flex flex-wrap gap-1">
                        {product.specialties.slice(0,1).map(s => (
                          <span key={s.id} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{s.name}</span>
                        ))}
                        {product.specialties.length > 1 && <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">+{product.specialties.length - 1}</span>}
                      </div>
                      <div className="text-left">
                        <div className="font-black text-emerald-600 text-lg">{(product.pricingTiers[0]?.price || 0).toLocaleString('fa-IR')}</div>
                        <div className="text-[10px] font-bold text-emerald-800/60 leading-none">تومان</div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </ProductsFilterClient>
      </main>
      <SiteFooter />
    </div>
  );
}

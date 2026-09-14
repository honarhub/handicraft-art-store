import React from 'react';
import prisma from '@/lib/prisma';
import CartIcon from '../components/CartIcon';
import ProductsFilterClient from './ProductsFilterClient';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const specialtyId = typeof params.specialty === 'string' ? params.specialty : '';
  const sort = typeof params.sort === 'string' ? params.sort : 'newest';
  const minPrice = typeof params.minPrice === 'string' ? parseInt(params.minPrice) : 0;
  const maxPrice = typeof params.maxPrice === 'string' ? parseInt(params.maxPrice) : 100000000;

  // Build Prisma Where Clause
  const whereClause: any = {
    status: 'APPROVED',
    deletedAt: null,
    pricingTiers: {
      some: {
        price: {
          gte: minPrice,
          lte: maxPrice
        }
      }
    }
  };

  if (q) {
    whereClause.title = { contains: q };
  }

  if (specialtyId) {
    whereClause.specialties = {
      some: { id: specialtyId }
    };
  }

  let products = await prisma.product.findMany({
    where: whereClause,
    include: { artist: { include: { user: true } }, specialties: true, pricingTiers: true },
    orderBy: { createdAt: 'desc' }
  });

  if (sort === 'price_asc') {
    products.sort((a, b) => (a.pricingTiers[0]?.price || 0) - (b.pricingTiers[0]?.price || 0));
  } else if (sort === 'price_desc') {
    products.sort((a, b) => (b.pricingTiers[0]?.price || 0) - (a.pricingTiers[0]?.price || 0));
  }

  const allSpecialties = await prisma.specialty.findMany({
    where: { isApproved: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 md:px-12">
          <a href="/" className="text-2xl font-black tracking-tighter text-slate-800">
            هنرآفرین <span className="text-emerald-600">.</span>
          </a>
          <div className="flex gap-6 items-center">
            <a href="/artist-panel/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">پنل هنرمندان</a>
            <div className="hidden sm:block w-px h-5 bg-slate-300"></div>
            <CartIcon />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-6 md:px-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">گالری آثار هنری</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">کشف و خرید بی‌واسطه دست‌سازه‌های اصیل از بهترین هنرمندان ایرانی</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-1/4 lg:sticky lg:top-28 z-10">
            <ProductsFilterClient 
              initialQ={q}
              initialSpecialty={specialtyId}
              initialSort={sort}
              initialMin={minPrice}
              initialMax={maxPrice}
              specialties={allSpecialties} 
            />
          </aside>

          {/* Product Grid */}
          <div className="w-full lg:w-3/4">
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
                      <img src={product.imageUrl} alt={product.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      {product.stockQuantity === 0 && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-sm">ناموجود</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">{product.title}</h3>
                      <div className="text-xs text-slate-500 mb-4 line-clamp-1">اثر: {product.artist.user.name}</div>
                      
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
          </div>
        </div>
      </main>
    </div>
  );
}

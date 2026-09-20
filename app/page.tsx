import React from 'react';
import GlobalSearch from './components/GlobalSearch';
import CartIcon from './components/CartIcon';
import prisma from '@/lib/prisma';

import TopArtistsCarousel from './components/TopArtistsCarousel';
import DynamicProductRow from './components/DynamicProductRow';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // 1. واکشی آثار برگزیده اخیر
  const featuredProducts = await prisma.product.findMany({
    where: { 
      status: 'APPROVED', 
      deletedAt: null,
      artist: { isActive: true, isDeleted: false, isApproved: true }
    },
    include: { artist: { include: { user: true } } },
    take: 6,
    orderBy: { createdAt: 'desc' }
  });

  // 2. واکشی هنرمندان ایران زمین (فعال)
  const topArtists = await prisma.artistProfile.findMany({
    where: { isActive: true, isDeleted: false },
    include: { user: true },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  // 3. واکشی تنظیمات و ردیف‌های داینامیک
  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: 'default' }
  });

  const rawRows = siteSettings?.dynamicRows ? (typeof siteSettings.dynamicRows === 'string' ? JSON.parse(siteSettings.dynamicRows) : siteSettings.dynamicRows) : [];
  const activeRows = (rawRows as any[]).filter(r => r.isActive).sort((a, b) => a.order - b.order);

  // واکشی محصولات برای هر ردیف پویا
  const populatedRows = await Promise.all(activeRows.map(async (row) => {
    let products: any[] = [];
    const baseQuery = { 
      status: 'APPROVED' as any, 
      deletedAt: null,
      artist: { isActive: true, isDeleted: false, isApproved: true }
    };
    const includeQuery = { artist: { include: { user: true } }, pricingTiers: true };

    try {
      if (row.type === 'NEWEST') {
        products = await prisma.product.findMany({ where: baseQuery, include: includeQuery, take: 13, orderBy: { createdAt: 'desc' } });
      } else if (row.type === 'SPECIALTY' && row.value) {
        products = await prisma.product.findMany({ where: { ...baseQuery, specialties: { some: { id: row.value } } }, include: includeQuery, take: 13, orderBy: { createdAt: 'desc' } });
      } else if (row.type === 'ARTIST' && row.value) {
        products = await prisma.product.findMany({ where: { ...baseQuery, artistId: row.value }, include: includeQuery, take: 13, orderBy: { createdAt: 'desc' } });
      } else if (row.type === 'PRICE_UNDER' && row.value) {
        products = await prisma.product.findMany({ where: { ...baseQuery, pricingTiers: { some: { price: { lte: parseFloat(row.value) } } } }, include: includeQuery, take: 13, orderBy: { createdAt: 'desc' } });
      } else if (row.type === 'PRICE_OVER' && row.value) {
        products = await prisma.product.findMany({ where: { ...baseQuery, pricingTiers: { some: { price: { gte: parseFloat(row.value) } } } }, include: includeQuery, take: 13, orderBy: { createdAt: 'desc' } });
      } else if (row.type === 'CHEAPEST') {
        const all = await prisma.product.findMany({ where: baseQuery, include: includeQuery, take: 50, orderBy: { createdAt: 'desc' } });
        products = all.sort((a,b) => (a.pricingTiers[0]?.price || 0) - (b.pricingTiers[0]?.price || 0)).slice(0, 13);
      } else if (row.type === 'EXPENSIVE') {
        const all = await prisma.product.findMany({ where: baseQuery, include: includeQuery, take: 50, orderBy: { createdAt: 'desc' } });
        products = all.sort((a,b) => (b.pricingTiers[0]?.price || 0) - (a.pricingTiers[0]?.price || 0)).slice(0, 13);
      }
    } catch(e) {
      console.error('Error fetching dynamic row', row.title, e);
    }
    
    return { ...row, products };
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" dir="rtl">
      {/* Header */}
      <SiteHeader />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-24 pb-32 px-6 md:px-12 overflow-hidden flex flex-col items-center text-center">
          {/* Subtle Ambient Background */}
          <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-emerald-100/40 rounded-full blur-[100px]"></div>
          </div>
          
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md text-emerald-800 font-bold text-xs mb-10 border border-emerald-100 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            پلتفرم اختصاصی هنرمندان اصیل ایرانی
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight mb-8 max-w-4xl drop-shadow-sm">
            دست‌سازه‌هایی که <span className="text-emerald-600 italic font-serif">روح</span> دارند.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 mb-14 max-w-2xl leading-relaxed font-medium">
            مستقیماً از کارگاه هنرمندان برگزیده به خانه شما. هنر اصیل را بدون واسطه و با تضمین اصالت خریداری کنید.
          </p>

          {/* Global Search Component */}
          <div className="w-full max-w-2xl mx-auto mb-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
            <GlobalSearch />
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            <a href="/products" className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-1">
              گشت و گذار در گالری
            </a>
            <a href="/artist-panel/login" className="px-8 py-4 bg-white text-slate-800 rounded-xl font-bold text-sm tracking-wide shadow-sm border border-slate-200 transition-all hover:bg-slate-50 hover:-translate-y-1">
              ورود هنرمندان
            </a>
          </div>
        </section>

        <div className="max-w-7xl mx-auto space-y-32 pb-32">
          
          {/* Top Artists Row */}
          {topArtists.length > 0 && (
            <TopArtistsCarousel artists={topArtists} />
          )}

          {/* Dynamic Builder Rows */}
          {populatedRows.map((row, index) => (
            <DynamicProductRow 
              key={row.id} 
              title={row.title} 
              subtitle={row.subtitle}
              type={row.type} 
              value={row.value} 
              products={row.products} 
              index={index} 
            />
          ))}

          {/* Featured Products (Recent) */}
          <section id="marketplace" className="px-6 md:px-12">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-3">آثار برگزیده اخیر</h2>
                <p className="text-slate-500 font-medium">جدیدترین دست‌سازه‌های پلتفرم هنرآفرین</p>
              </div>
              <a href="/products" className="hidden md:flex text-emerald-600 font-bold hover:text-emerald-700 items-center gap-2 transition-colors">
                گالری کامل
                <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </a>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {featuredProducts.map((product) => (
                  <a key={product.id} href={`/product/${product.id}`} className="group block bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2">
                    <div className="aspect-[4/5] w-full relative overflow-hidden bg-slate-100">
                      <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-8">
                      <h3 className="text-xl font-black text-slate-800 mb-3 group-hover:text-emerald-600 transition-colors">{product.title}</h3>
                      <div className="flex items-center gap-3">
                        {product.artist.user.image ? (
                          <img src={product.artist.user.image} alt={product.artist.user.name || ''} className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs">🎭</div>
                        )}
                        <span className="text-sm font-bold text-slate-600">{product.artist.user.name}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <div className="text-5xl mb-6 opacity-50">🎨</div>
                <h3 className="text-2xl font-black text-slate-700 mb-3">گالری در حال تجهیز است</h3>
                <p className="text-slate-500 max-w-md mx-auto font-medium">به زودی آثار هنرمندان به این بخش اضافه خواهد شد.</p>
              </div>
            )}
          </section>
          
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

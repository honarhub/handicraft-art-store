import React from 'react';
import GlobalSearch from './components/GlobalSearch';
import CartIcon from './components/CartIcon';
import prisma from '@/lib/prisma';

import TopArtistsCarousel from './components/TopArtistsCarousel';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // 1. واکشی آثار برگزیده اخیر
  const featuredProducts = await prisma.product.findMany({
    where: { status: 'APPROVED', deletedAt: null },
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

  // 3. واکشی تنظیمات و دسته‌بندی ویژه
  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
    include: { 
      featuredSpecialty: { 
        include: { 
          products: { 
            where: { status: 'APPROVED', deletedAt: null }, 
            include: { artist: { include: { user: true } } },
            take: 8
          } 
        } 
      } 
    }
  });

  const featuredSpecialty = siteSettings?.featuredSpecialty;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" dir="rtl">
      {/* Header */}
      <header className="absolute top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-5 px-6 md:px-12">
          <a href="/" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1 group">
            هنرآفرین <span className="text-emerald-500 group-hover:rotate-12 transition-transform">.</span>
          </a>
          <nav className="hidden md:flex gap-10 text-sm font-bold text-slate-600 items-center">
            <a href="/products" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">گالری آثار</a>
            <a href="/about" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">درباره ما</a>
            <a href="/artist-panel/login" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">پنل هنرمندان</a>
            <a href="/admin" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">پنل ادمین</a>
            <div className="w-px h-5 bg-slate-200"></div>
            <CartIcon />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-48 pb-32 px-6 md:px-12 overflow-hidden flex flex-col items-center text-center">
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

          {/* Featured Specialty Row */}
          {featuredSpecialty && featuredSpecialty.products.length > 0 && (
            <section className="px-6 md:px-12 bg-slate-900 text-white rounded-[2.5rem] py-20 mx-4 md:mx-12 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-900/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-800/60 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                  <div className="text-emerald-400 font-bold text-sm tracking-widest mb-3 uppercase">مجموعه ویژه</div>
                  <h2 className="text-4xl md:text-5xl font-black mb-3">آثار {featuredSpecialty.name}</h2>
                  <p className="text-slate-400 font-medium">زیباترین دست‌سازه‌ها در این دسته‌بندی</p>
                </div>
                <a href={`/products?specialty=${featuredSpecialty.id}`} className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white hover:text-slate-900 transition-all">
                  مشاهده همه
                </a>
              </div>
              <div className="relative z-10 flex overflow-x-auto pb-8 gap-8 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {featuredSpecialty.products.map((product) => (
                  <a key={product.id} href={`/product/${product.id}`} className="group block min-w-[280px] md:min-w-[320px] snap-start bg-white/5 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 hover:-translate-y-2">
                    <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-800">
                      <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-white mb-2">{product.title}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-400">{product.artist.user.name}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

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
      <footer className="bg-slate-900 text-slate-400 py-16 px-6 md:px-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="text-3xl font-black tracking-tighter text-white mb-6">
              هنرآفرین <span className="text-emerald-500">.</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              بستری تخصصی برای هنرمندان اصیل ایرانی تا آثار دست‌ساز و بی‌بدیل خود را بدون واسطه به دست علاقه‌مندان برسانند.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide">دسترسی سریع</h4>
            <ul className="space-y-4 font-medium text-sm">
              <li><a href="/products" className="hover:text-emerald-400 transition-colors">گالری آثار</a></li>
              <li><a href="/artist-panel/login" className="hover:text-emerald-400 transition-colors">ورود هنرمندان</a></li>
              <li><a href="/about" className="hover:text-emerald-400 transition-colors">درباره ما</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide">خدمات مشتریان</h4>
            <ul className="space-y-4 font-medium text-sm">
              <li><a href="/support" className="hover:text-emerald-400 transition-colors">ارتباط با پشتیبانی</a></li>
              <li><a href="/terms" className="hover:text-emerald-400 transition-colors">قوانین و مقررات</a></li>
              <li><a href="/admin/login" className="hover:text-emerald-400 transition-colors">ورود مدیران</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
          <p>© {new Date().getFullYear()} پلتفرم اختصاصی هنرآفرین. تمامی حقوق محفوظ است.</p>
          <div className="flex gap-4">
            <span className="opacity-50">توسعه یافته با ❤️ برای هنر ایران</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
}

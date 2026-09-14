import React from 'react';
import GlobalSearch from './components/GlobalSearch';
import CartIcon from './components/CartIcon';
import prisma from '@/lib/prisma';

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <header className="absolute top-0 w-full z-50 bg-white/40 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 md:px-12">
          <div className="text-2xl font-black tracking-tighter text-slate-800">
            هنرآفرین <span className="text-emerald-600">.</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-slate-600 items-center">
            <a href="#marketplace" className="hover:text-emerald-600 transition-colors">مارکت‌پلیس</a>
            <a href="/artist-panel/login" className="hover:text-emerald-600 transition-colors">پنل هنرمندان</a>
            <a href="/admin" className="hover:text-emerald-600 transition-colors">پنل ادمین</a>
            <div className="w-px h-5 bg-slate-300"></div>
            <CartIcon />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-40 pb-32 px-6 md:px-12 overflow-hidden flex flex-col items-center text-center">
          {/* Abstract Background Element */}
          <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-emerald-100/50 via-teal-50/30 to-slate-50 -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs mb-8 border border-emerald-100/50 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            پلتفرم اختصاصی هنرمندان اصیل ایرانی
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight mb-6 max-w-4xl">
            دست‌سازه‌هایی که <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">روح</span> دارند.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl leading-relaxed">
            مستقیماً از کارگاه هنرمندان برگزیده به خانه شما. هنر اصیل را بدون واسطه و با تضمین اصالت خریداری کنید.
          </p>

          {/* Global Search Component */}
          <div className="w-full max-w-2xl mx-auto mb-16">
            <GlobalSearch />
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <a href="/products" className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95">
              گشت و گذار در گالری
            </a>
            <a href="/artist-panel/login" className="px-8 py-4 bg-white text-slate-800 rounded-2xl font-bold text-lg shadow-lg border border-slate-100 transition-all hover:bg-slate-50 hover:scale-105 active:scale-95">
              ورود هنرمندان
            </a>
          </div>
        </section>

        <div className="max-w-7xl mx-auto space-y-24 pb-24">
          
          {/* Top Artists Row */}
          {topArtists.length > 0 && (
            <section className="px-6 md:px-12">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">هنرمندان ایران زمین</h2>
                  <p className="text-slate-500">آفرینندگان آثار اصیل و ماندگار</p>
                </div>
              </div>
              <div className="flex overflow-x-auto pb-6 gap-6 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {topArtists.map(artist => (
                  <a key={artist.id} href={`/artist/${artist.displayId}`} className="flex flex-col items-center gap-3 min-w-[120px] snap-center group">
                    <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md overflow-hidden group-hover:border-emerald-500 group-hover:shadow-emerald-200 transition-all duration-300 group-hover:-translate-y-2">
                      {artist.user.image ? (
                        <img src={artist.user.image} alt={artist.user.name || ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-3xl text-slate-300">🎭</div>
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors text-sm">{artist.user.name || 'هنرمند'}</h3>
                      <p className="text-xs text-slate-500 mt-1">مشاهده آثار</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Featured Specialty Row */}
          {featuredSpecialty && featuredSpecialty.products.length > 0 && (
            <section className="px-6 md:px-12 bg-emerald-900 text-white rounded-3xl py-16 mx-4 md:mx-12 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-800 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div>
                  <div className="text-emerald-400 font-bold mb-2">مجموعه ویژه</div>
                  <h2 className="text-3xl md:text-4xl font-black mb-2">آثار {featuredSpecialty.name}</h2>
                  <p className="text-emerald-100/80">زیباترین دست‌سازه‌ها در این دسته‌بندی</p>
                </div>
                <a href={`/products?specialty=${featuredSpecialty.id}`} className="bg-white text-emerald-900 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors flex items-center gap-2">
                  مشاهده همه
                  <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </a>
              </div>
              <div className="relative z-10 flex overflow-x-auto pb-6 gap-6 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {featuredSpecialty.products.map((product) => (
                  <a key={product.id} href={`/product/${product.id}`} className="group block min-w-[260px] md:min-w-[300px] snap-start bg-emerald-800/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-emerald-700 hover:border-emerald-400 hover:bg-emerald-800 transition-all duration-300">
                    <div className="aspect-[4/3] w-full relative overflow-hidden bg-emerald-950">
                      <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-white mb-2">{product.title}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-emerald-300">{product.artist.user.name}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Featured Products (Recent) */}
          <section id="marketplace" className="px-6 md:px-12">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">آثار برگزیده اخیر</h2>
                <p className="text-slate-500">جدیدترین دست‌سازه‌های پلتفرم هنرآفرین</p>
              </div>
              <a href="/products" className="hidden md:flex text-emerald-600 font-bold hover:text-emerald-700 items-center gap-1 transition-colors">
                مشاهده همه
                <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </a>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProducts.map((product) => (
                  <a key={product.id} href={`/product/${product.id}`} className="group block bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-300">
                    <div className="aspect-square w-full relative overflow-hidden bg-slate-200">
                      <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">{product.title}</h3>
                      <div className="flex items-center gap-3">
                        {product.artist.user.image ? (
                          <img src={product.artist.user.image} alt={product.artist.user.name || ''} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"></div>
                        )}
                        <span className="text-sm font-bold text-slate-600">{product.artist.user.name}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">گالری در حال تجهیز است</h3>
                <p className="text-slate-500 max-w-md mx-auto">به زودی آثار هنرمندان به این بخش اضافه خواهد شد.</p>
              </div>
            )}
          </section>
          
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 md:px-12 text-center text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-black tracking-tighter text-white">
            هنرآفرین <span className="text-emerald-500">.</span>
          </div>
          <div className="flex gap-6">
            <a href="/support" className="hover:text-emerald-400 transition-colors">ارتباط با پشتیبانی</a>
            <a href="/products" className="hover:text-emerald-400 transition-colors">گالری آثار</a>
          </div>
          <p>© {new Date().getFullYear()} پلتفرم اختصاصی هنرمندان. توسعه یافته با ❤️</p>
        </div>
      </footer>
    </div>
  );
}

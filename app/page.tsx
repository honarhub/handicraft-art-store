import React from 'react';
import GlobalSearch from './components/GlobalSearch';
import CartIcon from './components/CartIcon';
import prisma from '@/lib/prisma';

import TopArtistsCarousel from './components/TopArtistsCarousel';
import DynamicProductRow from './components/DynamicProductRow';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import HonarHubHero from './components/HonarHubHero';
import FeaturedRecentCarousel from './components/FeaturedRecentCarousel';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let heroProducts: any[] = [];
  let featuredProducts: any[] = [];
  let topArtists: any[] = [];
  let populatedRows: any[] = [];

  // 0. Fetch 10 recent approved products for hero cosmos carousel
  try {
    heroProducts = await prisma.product.findMany({
      where: { 
        status: 'APPROVED', 
        deletedAt: null,
        artist: { isActive: true, isDeleted: false, isApproved: true, verificationLevel: { gte: 2 } }
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.error('Error fetching hero products in Home:', err);
  }

  // 1. Fetch featured recent artworks
  try {
    featuredProducts = await prisma.product.findMany({
      where: { 
        status: 'APPROVED', 
        deletedAt: null,
        artist: { isActive: true, isDeleted: false, isApproved: true, verificationLevel: { gte: 2 } }
      },
      include: { 
        artist: { include: { user: true } },
        pricingTiers: true
      },
      take: 12,
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.error('Error fetching featured products in Home:', err);
  }

  // 2. Fetch active Iranian artists
  try {
    topArtists = await prisma.artistProfile.findMany({
      where: { isActive: true, isDeleted: false, isApproved: true, verificationLevel: { gte: 2 } },
      include: { user: true },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.error('Error fetching top artists in Home:', err);
  }

  // 3. Fetch settings and dynamic rows
  try {
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'default' }
    });

    let rawRows: any[] = [];
    if (siteSettings?.dynamicRows) {
      if (typeof siteSettings.dynamicRows === 'string') {
        try {
          rawRows = JSON.parse(siteSettings.dynamicRows);
        } catch {
          rawRows = [];
        }
      } else if (Array.isArray(siteSettings.dynamicRows)) {
        rawRows = siteSettings.dynamicRows;
      }
    }

    const activeRows = Array.isArray(rawRows)
      ? (rawRows as any[]).filter(r => r && r.isActive).sort((a, b) => (a.order || 0) - (b.order || 0))
      : [];

    // Fetch products for each dynamic row
    populatedRows = await Promise.all(activeRows.map(async (row) => {
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
          products = all.sort((a,b) => (a.pricingTiers?.[0]?.price || 0) - (b.pricingTiers?.[0]?.price || 0)).slice(0, 13);
        } else if (row.type === 'EXPENSIVE') {
          const all = await prisma.product.findMany({ where: baseQuery, include: includeQuery, take: 50, orderBy: { createdAt: 'desc' } });
          products = all.sort((a,b) => (b.pricingTiers?.[0]?.price || 0) - (a.pricingTiers?.[0]?.price || 0)).slice(0, 13);
        }
      } catch(e) {
        console.error('Error fetching dynamic row', row.title, e);
      }
      
      return { ...row, products };
    }));
  } catch (err) {
    console.error('Error loading siteSettings or dynamic rows in Home:', err);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" dir="rtl">
      {/* Header */}
      <SiteHeader />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-24 pb-32 px-6 md:px-12 overflow-hidden flex flex-col items-center text-center">
          {/* Subtle Ambient Background */}
          <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 animate-gradient-x -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-emerald-200/30 rounded-full blur-[120px] animate-float"></div>
          </div>
          
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-panel text-emerald-800 font-bold text-xs mb-10 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            پلتفرم اختصاصی هنرمندان اصیل ایرانی
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight mb-8 max-w-4xl drop-shadow-sm animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            دست‌سازه‌هایی که <span className="text-emerald-600 font-black relative">روح<span className="absolute -bottom-2 left-0 w-full h-2 bg-emerald-200/50 -rotate-2 rounded-full"></span></span> دارند.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 mb-14 max-w-2xl leading-relaxed font-medium animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
            مستقیماً از کارگاه هنرمندان برگزیده به خانه شما. هنر اصیل را بدون واسطه و با تضمین اصالت خریداری کنید.
          </p>

          <div className="w-full max-w-5xl mx-auto mb-16 animate-fade-in-up relative" style={{ animationDelay: '0.35s', opacity: 0 }}>
             <HonarHubHero products={heroProducts} />
          </div>

          {/* Global Search Component */}
          <div className="w-full max-w-2xl mx-auto mb-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl animate-fade-in-up hover:scale-[1.02] transition-transform duration-300" style={{ animationDelay: '0.4s', opacity: 0 }}>
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
          <FeaturedRecentCarousel products={featuredProducts} />
          
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

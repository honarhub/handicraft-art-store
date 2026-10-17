import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductGallery from './ProductGallery';
import ExpandableDescription from './ExpandableDescription';
import ProductPurchaseSection from './ProductPurchaseSection';
import ProductReviewsAndQA from './ProductReviewsAndQA';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { 
      artist: { include: { user: true } }, 
      specialties: true, 
      pricingTiers: true,
      reviews: { select: { rating: true } }
    }
  });

  if (!product || product.deletedAt || !product.artist.isActive || product.artist.isDeleted) {
    notFound();
  }

  // Calculate average rating
  const reviewCount = product.reviews.length;
  const avgRating = reviewCount > 0 
    ? (product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1) 
    : null;

  const allMedia = product.mediaUrls && product.mediaUrls.length > 0 ? product.mediaUrls : (product.imageUrl ? [product.imageUrl] : []);
  const basePrice = product.pricingTiers[0]?.price || 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 md:px-12">
        
        {/* Main Product Card */}
        <div className="flex flex-col lg:flex-row gap-10 bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-sm border border-slate-200">
          
          {/* Right/Top: Image Gallery */}
          <div className="lg:w-1/2">
            <div className="sticky top-28">
              <ProductGallery mediaUrls={allMedia} title={product.title} />
            </div>
          </div>

          {/* Left/Bottom: Product Info & Purchase */}
          <div className="lg:w-1/2 flex flex-col">
            
            {/* Top Trust Badges: Authenticity & Shipping Mode */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* ۱۰۰٪ تضمین اصالت اثر */}
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200 shadow-2xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                <span>۱۰۰٪ تضمین اصالت اثر توسط هنرهاب</span>
              </div>

              {/* روش ارسال */}
              {product.shippingMode === 'HONARHUB_WAREHOUSE' ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-2xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  <span>ارسال توسط هنرهاب (انبار مرکزی)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  <span>ارسال مستقیم از کارگاه هنرمند</span>
                </div>
              )}

              {/* Rating Quick Badge */}
              {avgRating && (
                <a href="#reviews-section" className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full border border-slate-200 transition-colors">
                  <span className="text-amber-500">★</span>
                  <span>{avgRating}</span>
                  <span className="text-slate-400 text-[10px]">({reviewCount} نظر)</span>
                </a>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
              {product.title}
            </h1>

            {/* Artist Mini Card */}
            <a href={`/artist/${product.artist.displayId}`} className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-100 group w-fit transition-all">
              <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-200 group-hover:border-emerald-500 transition-colors shadow-xs">
                {product.artist.user.image ? (
                  <img src={product.artist.user.image} alt={product.artist.user.name || 'Artist'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-lg">
                    {product.artist.user.name?.[0] || 'هـ'}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold mb-0.5">خالق و صاحب اثر</div>
                <div className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                  <span>{product.artist.user.name}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-emerald-600 transition-colors"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </div>
            </a>

            {/* Expandable Description */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 mb-2 text-base">درباره این اثر</h3>
              <ExpandableDescription description={product.description} />
            </div>

            {/* Category / Specialty Tags with New-Tab Filtering */}
            {product.specialties.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-400 mb-2">دسته‌بندی و سبک اثر:</div>
                <div className="flex flex-wrap gap-2">
                  {product.specialties.map(s => (
                    <a
                      key={s.id}
                      href={`/products?specialty=${encodeURIComponent(s.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 transition-all cursor-pointer shadow-2xs"
                      title={`مشاهده سایر دست‌سازه‌های دسته‌بندی ${s.name} در تب جدید`}
                    >
                      <span>#{s.name}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-emerald-600 transition-colors"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Low Stock Warning */}
            {product.stockQuantity > 0 && product.stockQuantity <= 3 && (
              <div className="mb-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl w-fit animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>تنها {product.stockQuantity.toLocaleString('fa-IR')} عدد در کارگاه هنرمند باقی مانده است</span>
              </div>
            )}

            {/* Interactive Purchase & Pre-Order Section */}
            <div className="mt-auto pt-4">
              <ProductPurchaseSection 
                product={{
                  id: product.id,
                  title: product.title,
                  basePrice: basePrice,
                  imageUrl: product.imageUrl,
                  artistName: product.artist.user.name || 'نامشخص',
                  stockQuantity: product.stockQuantity,
                  isPreOrderEnabled: product.isPreOrderEnabled,
                  preOrderTiers: product.preOrderTiers,
                  status: product.status
                }}
              />
            </div>
            
          </div>
        </div>

        {/* Reviews and Q&A Section */}
        <ProductReviewsAndQA 
          productId={product.id} 
          artistUserId={product.artist.userId} 
        />

      </main>

      <SiteFooter />
    </div>
  );
}

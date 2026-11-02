import React from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import ProductCardSkeleton from '@/app/components/ProductCardSkeleton';

export default function HomeLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />

      <main className="flex-1 w-full overflow-hidden">
        {/* Hero Section Skeleton */}
        <section className="relative px-6 max-w-7xl mx-auto pt-28 pb-20 text-center flex flex-col items-center">
          <div className="h-6 w-48 bg-emerald-100 rounded-full mb-6 animate-pulse" />
          <div className="h-12 w-96 max-w-full bg-slate-200 rounded-2xl mb-4 animate-pulse" />
          <div className="h-5 w-80 max-w-full bg-slate-100 rounded-xl mb-8 animate-pulse" />
          <div className="flex gap-4">
            <div className="h-12 w-36 bg-emerald-200 rounded-xl animate-pulse" />
            <div className="h-12 w-36 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </section>

        {/* Carousel / Product Row Skeleton */}
        <div className="max-w-7xl mx-auto space-y-20 pb-32 px-4 sm:px-6 md:px-12">
          <div>
            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="h-7 w-48 bg-slate-200 rounded-xl mb-2 animate-pulse" />
                <div className="h-4 w-32 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

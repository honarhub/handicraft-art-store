'use client';

import React from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import ProductCardSkeleton from '@/app/components/ProductCardSkeleton';

export default function HomeLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans select-none animate-in fade-in duration-300" dir="rtl">
      <SiteHeader />

      <main className="flex-1 w-full overflow-hidden">
        {/* Hero Section Skeleton */}
        <section className="relative px-6 max-w-7xl mx-auto pt-24 pb-16 text-center flex flex-col items-center">
          <div className="h-6 w-48 bg-emerald-100/70 rounded-full mb-6 skeleton-shimmer-box" />
          <div className="h-12 w-96 max-w-full bg-slate-200 rounded-2xl mb-4 skeleton-shimmer-box" />
          <div className="h-5 w-80 max-w-full bg-slate-100 rounded-xl mb-8 skeleton-shimmer-box" />
          <div className="flex gap-4">
            <div className="h-12 w-36 bg-emerald-200/60 rounded-xl skeleton-shimmer-box" />
            <div className="h-12 w-36 bg-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>
        </section>

        {/* Carousel / Product Row Skeleton */}
        <div className="max-w-7xl mx-auto space-y-16 pb-24 px-4 sm:px-6 md:px-12">
          <div>
            <div className="flex justify-between items-end mb-6">
              <div className="space-y-2">
                <div className="h-7 w-48 bg-slate-200 rounded-xl skeleton-shimmer-box" />
                <div className="h-4 w-32 bg-slate-100 rounded-lg skeleton-shimmer-box" />
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

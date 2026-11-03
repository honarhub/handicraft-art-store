'use client';

import React from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import HonarHubImageSkeleton from './HonarHubImageSkeleton';

export default function ProductDetailPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans select-none animate-in fade-in duration-300" dir="rtl">
      <SiteHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 md:px-12">
        {/* Main Product Card Skeleton */}
        <div className="flex flex-col lg:flex-row gap-10 bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-xs border border-slate-200">
          
          {/* Gallery Column (Right in RTL) */}
          <div className="lg:w-1/2 space-y-4">
            <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-sm">
              <HonarHubImageSkeleton aspect="aspect-square" rounded="rounded-3xl" className="w-full h-full" />
            </div>
            {/* Small Thumbnails Row */}
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
                  <HonarHubImageSkeleton aspect="aspect-square" rounded="rounded-2xl" className="w-full h-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Details Column (Left in RTL) */}
          <div className="lg:w-1/2 flex flex-col space-y-6">
            
            {/* Badges Row */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-6 w-24 bg-slate-100 rounded-full skeleton-shimmer-box" />
                <div className="h-6 w-20 bg-emerald-50 rounded-full skeleton-shimmer-box" />
              </div>
              <div className="flex gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 skeleton-shimmer-box" />
                <div className="w-9 h-9 rounded-xl bg-slate-100 skeleton-shimmer-box" />
              </div>
            </div>

            {/* Product Title */}
            <div className="space-y-2">
              <div className="h-8 w-4/5 bg-slate-200 rounded-xl skeleton-shimmer-box" />
              <div className="h-5 w-2/5 bg-slate-100 rounded-lg skeleton-shimmer-box" />
            </div>

            {/* Artist Card Frame */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                <HonarHubImageSkeleton aspect="aspect-square" rounded="rounded-full" className="w-full h-full" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-slate-200 rounded skeleton-shimmer-box" />
                <div className="h-3 w-20 bg-slate-100 rounded skeleton-shimmer-box" />
              </div>
            </div>

            {/* Price Box */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-slate-200 rounded skeleton-shimmer-box" />
                <div className="h-8 w-36 bg-slate-300 rounded-xl skeleton-shimmer-box" />
              </div>
              <div className="h-14 w-full bg-emerald-600/30 rounded-2xl skeleton-shimmer-box" />
            </div>

            {/* Description Lines */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full bg-slate-100 rounded skeleton-shimmer-box" />
              <div className="h-4 w-5/6 bg-slate-100 rounded skeleton-shimmer-box" />
              <div className="h-4 w-4/6 bg-slate-100 rounded skeleton-shimmer-box" />
            </div>

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

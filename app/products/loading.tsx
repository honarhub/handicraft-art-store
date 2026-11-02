import React from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import ProductCardSkeleton from '@/app/components/ProductCardSkeleton';

export default function ProductsLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto py-12 px-6 md:px-12">
        {/* Page Title Skeleton */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="h-10 bg-slate-200 rounded-2xl w-64 mb-3 animate-pulse" />
          <div className="h-5 bg-slate-200 rounded-xl w-96 max-w-full animate-pulse" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Filter Skeleton (Desktop) */}
          <aside className="w-full lg:w-1/4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-pulse hidden lg:block">
              <div className="h-6 bg-slate-200 rounded-xl w-1/2" />
              <div className="h-10 bg-slate-100 rounded-xl w-full" />
              <div className="h-28 bg-slate-100 rounded-2xl w-full" />
              <div className="h-28 bg-slate-100 rounded-2xl w-full" />
              <div className="h-24 bg-slate-100 rounded-2xl w-full" />
              <div className="h-16 bg-slate-100 rounded-xl w-full" />
            </div>
          </aside>

          {/* Main Content Area Skeleton */}
          <div className="w-full lg:w-3/4 space-y-6">
            {/* Desktop Horizontal Sort Bar Skeleton (Digikala-Style) */}
            <div className="hidden lg:flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="flex items-center gap-2">
                  <div className="h-8 w-20 bg-emerald-100 rounded-xl" />
                  <div className="h-8 w-24 bg-slate-100 rounded-xl" />
                  <div className="h-8 w-20 bg-slate-100 rounded-xl" />
                  <div className="h-8 w-20 bg-slate-100 rounded-xl" />
                  <div className="h-8 w-28 bg-slate-100 rounded-xl" />
                </div>
              </div>
              <div className="h-4 w-12 bg-slate-100 rounded" />
            </div>

            {/* Product Cards Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
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

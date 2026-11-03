'use client';

import React from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import HonarHubImageSkeleton from './HonarHubImageSkeleton';
import ProductCardSkeleton from '../ProductCardSkeleton';

export default function ArtistPublicProfileSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans select-none animate-in fade-in duration-300" dir="rtl">
      <SiteHeader />

      <main className="flex-1 w-full pb-20">
        {/* Cover Banner Skeleton */}
        <div className="h-48 sm:h-64 w-full bg-slate-800 skeleton-shimmer-dark relative" />

        {/* Profile Info Header Overlapping Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 -mt-20 relative z-10">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 flex flex-col md:flex-row items-center md:items-end gap-6 justify-between">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-right">
              {/* Round Avatar with HonarHub 4-stage Shimmer */}
              <div className="w-32 h-32 rounded-full ring-4 ring-white shadow-xl overflow-hidden shrink-0 -mt-16 md:-mt-20">
                <HonarHubImageSkeleton aspect="aspect-square" rounded="rounded-full" className="w-full h-full" />
              </div>
              <div className="space-y-2">
                <div className="h-7 w-48 bg-slate-200 rounded-xl skeleton-shimmer-box mx-auto md:mx-0" />
                <div className="h-4 w-32 bg-slate-100 rounded-lg skeleton-shimmer-box mx-auto md:mx-0" />
                <div className="flex gap-2 justify-center md:justify-start">
                  <div className="h-6 w-20 bg-emerald-50 rounded-full skeleton-shimmer-box" />
                  <div className="h-6 w-24 bg-slate-100 rounded-full skeleton-shimmer-box" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full md:w-auto">
              <div className="h-11 w-32 bg-slate-100 rounded-xl skeleton-shimmer-box flex-1 md:flex-none" />
              <div className="h-11 w-36 bg-teal-600/30 rounded-xl skeleton-shimmer-box flex-1 md:flex-none" />
            </div>
          </div>

          {/* Artist Products Gallery Grid Skeleton */}
          <div className="mt-12 space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-6 w-36 bg-slate-200 rounded-xl skeleton-shimmer-box" />
              <div className="h-4 w-20 bg-slate-100 rounded skeleton-shimmer-box" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(idx => (
                <ProductCardSkeleton key={idx} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

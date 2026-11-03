'use client';

import React from 'react';
import HonarHubImageSkeleton from './HonarHubImageSkeleton';

export default function ArtistProductsSkeleton() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 select-none animate-in fade-in duration-300 font-sans" dir="rtl">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-xl skeleton-shimmer-box" />
          <div className="h-4 w-72 max-w-full bg-slate-100 rounded-lg skeleton-shimmer-box" />
        </div>
        <div className="h-11 w-36 bg-teal-600/30 rounded-xl skeleton-shimmer-box w-full sm:w-auto" />
      </div>

      {/* Stats Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-3.5 w-16 bg-slate-200 rounded skeleton-shimmer-box" />
              <div className="h-6 w-10 bg-slate-200 rounded skeleton-shimmer-box" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 skeleton-shimmer-box" />
          </div>
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-12 w-full max-w-md bg-white border border-slate-200 rounded-2xl skeleton-shimmer-box" />

      {/* Mobile Cards Skeleton ( < md ) */}
      <div className="md:hidden space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <HonarHubImageSkeleton aspect="aspect-square" rounded="rounded-xl" className="w-full h-full" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 rounded skeleton-shimmer-box" />
                <div className="h-3.5 w-1/2 bg-slate-100 rounded skeleton-shimmer-box" />
                <div className="h-5 w-20 bg-slate-100 rounded-full skeleton-shimmer-box" />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between">
              <div className="h-8 w-24 bg-slate-100 rounded-xl skeleton-shimmer-box" />
              <div className="h-8 w-20 bg-teal-50 rounded-xl skeleton-shimmer-box" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Skeleton ( >= md ) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="h-4 w-28 bg-slate-200 rounded skeleton-shimmer-box" />
          <div className="h-4 w-20 bg-slate-200 rounded skeleton-shimmer-box" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map(row => (
            <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-5 w-12 bg-slate-100 rounded skeleton-shimmer-box" />
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <HonarHubImageSkeleton aspect="aspect-square" rounded="rounded-lg" className="w-full h-full" />
                </div>
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <div className="h-4 w-4/5 bg-slate-200 rounded skeleton-shimmer-box" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded skeleton-shimmer-box" />
                </div>
              </div>
              <div className="h-4 w-24 bg-slate-200 rounded skeleton-shimmer-box" />
              <div className="h-5 w-16 bg-slate-100 rounded-full skeleton-shimmer-box" />
              <div className="h-6 w-20 bg-emerald-50 rounded-full skeleton-shimmer-box" />
              <div className="h-8 w-24 bg-slate-100 rounded-xl skeleton-shimmer-box" />
              <div className="h-8 w-8 bg-slate-100 rounded-lg skeleton-shimmer-box" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

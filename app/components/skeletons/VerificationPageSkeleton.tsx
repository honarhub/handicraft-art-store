'use client';

import React from 'react';
import HonarHubImageSkeleton from './HonarHubImageSkeleton';

export default function VerificationPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-16 select-none animate-in fade-in duration-300" dir="rtl">
      {/* Header with 3 Medal Badges */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-3">
          <div className="h-6 w-44 bg-teal-800/60 rounded-full skeleton-shimmer-dark" />
          <div className="h-8 w-72 max-w-full bg-slate-800 rounded-xl skeleton-shimmer-dark" />
          <div className="h-4 w-96 max-w-full bg-slate-800/60 rounded-lg skeleton-shimmer-dark" />
        </div>

        {/* 3 Medals placeholder */}
        <div className="flex items-center gap-3 self-center sm:self-auto">
          <div className="w-14 h-16 rounded-2xl bg-slate-800 skeleton-shimmer-dark" />
          <div className="w-14 h-16 rounded-2xl bg-slate-800 skeleton-shimmer-dark" />
          <div className="w-14 h-16 rounded-2xl bg-slate-800 skeleton-shimmer-dark" />
        </div>
      </div>

      {/* 3 Level Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((lvl) => (
          <div key={lvl} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 skeleton-shimmer-box" />
              <div className="h-6 w-20 bg-slate-100 rounded-full skeleton-shimmer-box" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-32 bg-slate-200 rounded-lg skeleton-shimmer-box" />
              <div className="h-3.5 w-full bg-slate-100 rounded skeleton-shimmer-box" />
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="h-8 w-full bg-slate-50 rounded-xl skeleton-shimmer-box" />
            </div>
          </div>
        ))}
      </div>

      {/* Active Form Card (Level 3 KYC) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 md:p-10 space-y-8">
        <div className="space-y-2 pb-6 border-b border-slate-100">
          <div className="h-6 w-60 bg-slate-200 rounded-xl skeleton-shimmer-box" />
          <div className="h-4 w-96 max-w-full bg-slate-100 rounded skeleton-shimmer-box" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* National ID */}
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>

          {/* Birth Date (3 cols) */}
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-12 bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
              <div className="h-12 bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
              <div className="h-12 bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
            </div>
          </div>

          {/* National Card Image Frame with HonarHub 4-stage Shimmer */}
          <div className="md:col-span-2 space-y-2">
            <div className="h-4 w-44 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="w-full max-w-md mx-auto aspect-[1.58] rounded-2xl overflow-hidden ring-2 ring-slate-100 shadow-md">
              <HonarHubImageSkeleton aspect="aspect-[1.58]" rounded="rounded-2xl" className="w-full h-full" />
            </div>
          </div>

          {/* Sheba Number */}
          <div className="md:col-span-2 space-y-2">
            <div className="h-4 w-36 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>

          {/* Address & Postal Code */}
          <div className="md:col-span-2 space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-20 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="h-4 w-24 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full max-w-xs bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100">
          <div className="h-12 w-56 bg-teal-600/30 rounded-xl skeleton-shimmer-box" />
        </div>
      </div>
    </div>
  );
}

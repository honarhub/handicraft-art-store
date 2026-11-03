'use client';

import React from 'react';
import HonarHubImageSkeleton from './HonarHubImageSkeleton';

export default function ProductFormSkeleton() {
  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-4xl mx-auto w-full select-none animate-in fade-in duration-300 font-sans" dir="rtl">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-xl skeleton-shimmer-box" />
          <div className="h-4 w-80 max-w-full bg-slate-100 rounded-lg skeleton-shimmer-box" />
        </div>
        <div className="h-9 w-24 bg-slate-100 rounded-xl skeleton-shimmer-box" />
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 md:p-10 space-y-8 shadow-xs">
        {/* Image Uploader Frame */}
        <div className="space-y-3">
          <div className="h-4 w-32 bg-slate-200 rounded skeleton-shimmer-box" />
          <div className="w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden ring-2 ring-slate-100 shadow-md">
            <HonarHubImageSkeleton aspect="aspect-square" rounded="rounded-2xl" className="w-full h-full" />
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-28 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <div className="h-12 w-44 bg-teal-600/30 rounded-xl skeleton-shimmer-box" />
        </div>
      </div>
    </div>
  );
}

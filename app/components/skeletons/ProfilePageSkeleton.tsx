'use client';

import React from 'react';
import HonarHubImageSkeleton from './HonarHubImageSkeleton';

export default function ProfilePageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-16 select-none animate-in fade-in duration-300" dir="rtl">
      {/* Header Banner Skeleton */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-7 w-64 bg-slate-200 rounded-xl skeleton-shimmer-box" />
          <div className="h-4 w-96 max-w-full bg-slate-100 rounded-lg skeleton-shimmer-box" />
        </div>
        <div className="h-9 w-32 bg-slate-100 rounded-xl skeleton-shimmer-box" />
      </div>

      {/* Main Profile Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 md:p-10 space-y-8">
        
        {/* Avatar Uploader Frame with HonarHub 4-stage Shimmer */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-100">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-slate-100 shadow-md shrink-0 overflow-hidden">
            <HonarHubImageSkeleton aspect="aspect-square" rounded="rounded-full" className="w-full h-full" />
          </div>
          <div className="space-y-2.5 text-center sm:text-right">
            <div className="h-5 w-40 bg-slate-200 rounded-lg skeleton-shimmer-box mx-auto sm:mx-0" />
            <div className="h-3.5 w-60 bg-slate-100 rounded-md skeleton-shimmer-box mx-auto sm:mx-0" />
            <div className="h-9 w-36 bg-emerald-100/60 rounded-xl skeleton-shimmer-box mx-auto sm:mx-0 mt-2" />
          </div>
        </div>

        {/* Form Inputs Grid (2 columns on md) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Name */}
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>

          {/* 2. Brand Name */}
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>

          {/* 3. Phone */}
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>

          {/* 4. Email */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-200 rounded skeleton-shimmer-box" />
              <div className="h-4 w-20 bg-emerald-50 rounded-full skeleton-shimmer-box" />
            </div>
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>

          {/* 5. Province */}
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>

          {/* 6. City */}
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>

          {/* 7. Portfolio URL */}
          <div className="md:col-span-2 space-y-2">
            <div className="h-4 w-36 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>

          {/* 8. Specialties */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-4 w-44 bg-slate-200 rounded skeleton-shimmer-box" />
              <div className="h-3.5 w-48 bg-slate-100 rounded skeleton-shimmer-box" />
            </div>
            <div className="min-h-[52px] p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <div className="h-8 w-24 bg-emerald-100 rounded-lg skeleton-shimmer-box" />
              <div className="h-8 w-28 bg-emerald-100 rounded-lg skeleton-shimmer-box" />
              <div className="h-8 w-20 bg-slate-200 rounded-lg skeleton-shimmer-box" />
            </div>
          </div>

          {/* 9. Bio */}
          <div className="md:col-span-2 space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded skeleton-shimmer-box" />
            <div className="h-32 w-full bg-slate-50 border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <div className="h-12 w-48 bg-teal-600/30 rounded-xl skeleton-shimmer-box" />
        </div>
      </div>
    </div>
  );
}

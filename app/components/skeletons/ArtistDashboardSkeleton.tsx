'use client';

import React from 'react';

export default function ArtistDashboardSkeleton() {
  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 font-sans select-none animate-in fade-in duration-300" dir="rtl">
      {/* Title */}
      <div className="space-y-2">
        <div className="h-8 w-56 bg-slate-200 rounded-xl skeleton-shimmer-box" />
        <div className="h-4 w-80 max-w-full bg-slate-100 rounded-lg skeleton-shimmer-box" />
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 skeleton-shimmer-box shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-24 bg-slate-100 rounded skeleton-shimmer-box" />
              <div className="h-7 w-16 bg-slate-200 rounded-lg skeleton-shimmer-box" />
            </div>
          </div>
        ))}
      </div>

      {/* Notice Banner Frame */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="h-5 w-40 bg-slate-200 rounded-lg skeleton-shimmer-box" />
        <div className="h-4 w-full bg-slate-100 rounded skeleton-shimmer-box" />
        <div className="h-4 w-5/6 bg-slate-100 rounded skeleton-shimmer-box" />
      </div>
    </div>
  );
}

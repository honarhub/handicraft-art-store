'use client';

import React from 'react';

export default function AdminDashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans select-none animate-in fade-in duration-300" dir="rtl">
      {/* Top Header */}
      <div className="space-y-2">
        <div className="h-8 w-60 bg-slate-200 rounded-xl skeleton-shimmer-box" />
        <div className="h-4 w-96 max-w-full bg-slate-100 rounded-lg skeleton-shimmer-box" />
      </div>

      {/* Admin Stats Grid (6 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="h-3.5 w-16 bg-slate-100 rounded skeleton-shimmer-box" />
            <div className="h-7 w-12 bg-slate-200 rounded-lg skeleton-shimmer-box" />
          </div>
        ))}
      </div>

      {/* Main Admin Data Table Frame */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="h-10 w-72 bg-white border border-slate-200 rounded-xl skeleton-shimmer-box" />
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-white border border-slate-200 rounded-xl skeleton-shimmer-box" />
            <div className="h-10 w-24 bg-white border border-slate-200 rounded-xl skeleton-shimmer-box" />
          </div>
        </div>

        <div className="divide-y divide-slate-100 p-2 sm:p-4">
          {[1, 2, 3, 4, 5].map(row => (
            <div key={row} className="py-4 px-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-slate-100 skeleton-shimmer-box shrink-0" />
                <div className="space-y-1.5 flex-1 max-w-md">
                  <div className="h-4 w-3/4 bg-slate-200 rounded skeleton-shimmer-box" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded skeleton-shimmer-box" />
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-full skeleton-shimmer-box" />
              <div className="h-8 w-24 bg-slate-100 rounded-xl skeleton-shimmer-box" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

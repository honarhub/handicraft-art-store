import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs flex flex-col animate-pulse select-none">
      {/* Square Image Skeleton with Shimmer */}
      <div className="aspect-square w-full bg-slate-200 relative overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 opacity-25">
          <span className="text-3xl">🎨</span>
        </div>
      </div>

      {/* Body Details Skeleton */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Title Line */}
        <div className="h-5 bg-slate-200 rounded-lg w-4/5" />
        
        {/* Artist Row */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0" />
          <div className="h-3.5 bg-slate-200 rounded-md w-28" />
        </div>

        {/* Footer Row: Tag & Price */}
        <div className="mt-auto pt-3 flex justify-between items-end border-t border-slate-100">
          <div className="h-6 w-16 bg-slate-100 rounded-md" />
          <div className="flex flex-col items-end gap-1">
            <div className="h-6 w-24 bg-slate-200 rounded-lg" />
            <div className="h-2 w-8 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

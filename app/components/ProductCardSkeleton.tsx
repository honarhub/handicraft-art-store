import React from 'react';
import HonarHubSkeletonAnimation from './HonarHubSkeletonAnimation';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs flex flex-col select-none">
      {/* Square Image Container with HonarHub 4-Stage Animation */}
      <div className="aspect-square w-full relative overflow-hidden bg-slate-950">
        <HonarHubSkeletonAnimation />
      </div>

      {/* Body Details Skeleton */}
      <div className="p-5 flex flex-col flex-1 gap-3 bg-white">
        {/* Title Line */}
        <div className="h-5 bg-slate-100 rounded-lg w-4/5 animate-pulse" />
        
        {/* Artist Row */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 shrink-0 animate-pulse" />
          <div className="h-3.5 bg-slate-100 rounded-md w-28 animate-pulse" />
        </div>

        {/* Footer Row: Tag & Price */}
        <div className="mt-auto pt-3 flex justify-between items-end border-t border-slate-100">
          <div className="h-6 w-16 bg-slate-50 rounded-md animate-pulse" />
          <div className="flex flex-col items-end gap-1">
            <div className="h-6 w-24 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-2 w-8 bg-slate-50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

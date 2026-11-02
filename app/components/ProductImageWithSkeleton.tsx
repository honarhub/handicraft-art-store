'use client';

import React, { useState } from 'react';

interface ProductImageWithSkeletonProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
}

export default function ProductImageWithSkeleton({
  src,
  alt,
  className = '',
  containerClassName = '',
  priority = false
}: ProductImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${containerClassName}`}>
      {/* Animated Skeleton Shimmer (Visible while loading) */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse z-0">
          <div className="flex flex-col items-center gap-1.5 opacity-30 select-none pointer-events-none">
            <span className="text-2xl sm:text-3xl">🎨</span>
            <span className="text-[10px] font-bold text-slate-400">هنرهاب</span>
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 z-0">
          <span className="text-2xl mb-1 opacity-40">🖼️</span>
          <span className="text-[10px] font-medium text-slate-400 select-none text-center line-clamp-1">{alt || 'تصویر اثر'}</span>
        </div>
      ) : (
        /* Actual Image with smooth progressive fade-in */
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-98 blur-xs'
          } ${className}`}
        />
      )}
    </div>
  );
}

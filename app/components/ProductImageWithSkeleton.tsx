'use client';

import React, { useState } from 'react';
import HonarHubSkeletonAnimation from './HonarHubSkeletonAnimation';

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
  containerClassName = 'w-full h-full',
  priority = false
}: ProductImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-950 ${containerClassName}`}>
      {/* Animated 4-Stage HonarHub Loading Skeleton */}
      {!isLoaded && !hasError && (
        <HonarHubSkeletonAnimation />
      )}

      {/* Error Fallback */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-2 z-10">
          <span className="text-2xl mb-1 opacity-40">🖼️</span>
          <span className="text-[10px] font-medium text-slate-400 select-none text-center line-clamp-1">{alt || 'تصویر اثر'}</span>
        </div>
      ) : (
        /* Actual Image with smooth progressive fade-in, strictly contained */
        <img
          ref={(node) => {
            if (node && node.complete && node.naturalWidth > 0 && !isLoaded) {
              setIsLoaded(true);
            }
          }}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out z-10 ${
            isLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } ${className}`}
        />
      )}
    </div>
  );
}

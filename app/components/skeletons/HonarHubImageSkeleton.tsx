'use client';

import React from 'react';
import HonarHubSkeletonAnimation from '../HonarHubSkeletonAnimation';

interface HonarHubImageSkeletonProps {
  className?: string;
  aspect?: string; // e.g. 'aspect-square', 'aspect-[1.58]', 'aspect-[4/3]'
  rounded?: string; // e.g. 'rounded-3xl', 'rounded-full', 'rounded-2xl'
}

export default function HonarHubImageSkeleton({
  className = '',
  aspect = 'aspect-square',
  rounded = 'rounded-2xl'
}: HonarHubImageSkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-950 ${aspect} ${rounded} ${className} select-none`}
    >
      <HonarHubSkeletonAnimation />
    </div>
  );
}

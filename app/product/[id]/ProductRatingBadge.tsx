'use client';

import React from 'react';

interface ProductRatingBadgeProps {
  avgRating: string;
  reviewCount: number;
}

export default function ProductRatingBadge({ avgRating, reviewCount }: ProductRatingBadgeProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('reviews-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full border border-slate-200 transition-colors cursor-pointer"
      title="مشاهده نظرات و امتیازات خریداران"
    >
      <span className="text-amber-500">★</span>
      <span>{avgRating}</span>
      <span className="text-slate-400 text-[10px]">({reviewCount} نظر)</span>
    </button>
  );
}

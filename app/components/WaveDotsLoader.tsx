'use client';

import React from 'react';

export default function WaveDotsLoader({
  className = '',
  dotClassName = 'bg-current'
}: {
  className?: string;
  dotClassName?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 py-1 px-2 select-none ${className}`}
      aria-label="در حال پردازش"
    >
      <span className={`w-2 h-2 rounded-full ${dotClassName} wave-dot-1`} />
      <span className={`w-2.5 h-2.5 rounded-full ${dotClassName} wave-dot-2`} />
      <span className={`w-3 h-3 rounded-full ${dotClassName} wave-dot-3`} />
      <span className={`w-2.5 h-2.5 rounded-full ${dotClassName} wave-dot-4`} />
      <span className={`w-2 h-2 rounded-full ${dotClassName} wave-dot-5`} />
    </span>
  );
}

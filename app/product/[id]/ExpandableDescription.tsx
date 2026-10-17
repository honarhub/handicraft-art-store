'use client';

import React, { useState } from 'react';

interface ExpandableDescriptionProps {
  description: string;
}

export default function ExpandableDescription({ description }: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) {
    return <p className="text-slate-400 text-sm italic">توضیحاتی برای این اثر ثبت نشده است.</p>;
  }

  // If description is relatively short (less than 220 chars and no multiple line breaks), show as is
  const isLong = description.length > 220 || (description.match(/\n/g) || []).length > 3;

  return (
    <div className="relative">
      <div 
        className={`text-slate-600 leading-relaxed text-sm md:text-base whitespace-pre-line transition-all duration-300 ${
          !isExpanded && isLong ? 'line-clamp-4 max-h-28 overflow-hidden' : ''
        }`}
      >
        {description}
      </div>

      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>بستن توضیحات</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </>
          ) : (
            <>
              <span>توضیحات بیشتر</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}

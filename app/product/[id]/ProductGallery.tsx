'use client';

import React, { useState } from 'react';

export default function ProductGallery({ mediaUrls, title }: { mediaUrls: string[], title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!mediaUrls || mediaUrls.length === 0) {
    return (
      <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center text-slate-400">
        بدون تصویر
      </div>
    );
  }

  const activeMedia = mediaUrls[activeIndex] || mediaUrls[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev === mediaUrls.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? mediaUrls.length - 1 : prev - 1));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image/Video Container */}
      <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner relative group select-none">
        {activeMedia.endsWith('.mp4') || activeMedia.includes('video') ? (
          <video 
            src={activeMedia} 
            className="w-full h-full object-cover" 
            controls 
            autoPlay 
            muted 
            loop
          />
        ) : (
          <img 
            key={activeMedia}
            src={activeMedia} 
            alt={title} 
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" 
          />
        )}
        
        {/* Navigation Arrows */}
        {mediaUrls.length > 1 && (
          <>
            {/* Prev (Right in RTL) */}
            <button 
              onClick={handlePrev}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md backdrop-blur-md flex items-center justify-center border border-white/60 transition-all opacity-80 group-hover:opacity-100 z-10 active:scale-95"
              aria-label="تصویر قبلی"
              title="تصویر قبلی"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            {/* Next (Left in RTL) */}
            <button 
              onClick={handleNext}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md backdrop-blur-md flex items-center justify-center border border-white/60 transition-all opacity-80 group-hover:opacity-100 z-10 active:scale-95"
              aria-label="تصویر بعدی"
              title="تصویر بعدی"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            {/* Transparent Indicator Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full z-10 shadow-sm border border-white/10">
              {mediaUrls.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    activeIndex === idx 
                      ? 'w-5 h-2 bg-white shadow-sm' 
                      : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`رفتن به تصویر ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Strip */}
      {mediaUrls.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {mediaUrls.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                activeIndex === idx ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {url.endsWith('.mp4') || url.includes('video') ? (
                <>
                  <video src={url} className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </>
              ) : (
                <img src={url} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

  const activeMedia = mediaUrls[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev === mediaUrls.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? mediaUrls.length - 1 : prev - 1));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image/Video */}
      <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner relative group">
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
            src={activeMedia} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        )}
        
        {/* Navigation Arrows */}
        {mediaUrls.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/40 hover:bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-800 shadow-sm border border-white/50 transition-all opacity-0 group-hover:opacity-100 z-10"
              title="قبلی"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button 
              onClick={handleNext}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/40 hover:bg-white/80 backdrop-blur-md flex items-center justify-center text-slate-800 shadow-sm border border-white/50 transition-all opacity-0 group-hover:opacity-100 z-10"
              title="بعدی"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {mediaUrls.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {mediaUrls.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                activeIndex === idx ? 'border-emerald-500 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
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
                <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

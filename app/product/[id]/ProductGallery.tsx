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

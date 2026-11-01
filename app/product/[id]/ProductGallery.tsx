'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function ProductGallery({ mediaUrls, title }: { mediaUrls: string[], title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isProgrammaticScroll = useRef(false);

  // Touch gesture tracking for fast and reliable swipe detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  if (!mediaUrls || mediaUrls.length === 0) {
    return (
      <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center text-slate-400">
        بدون تصویر
      </div>
    );
  }

  // Smoothly scroll the main image slider to a given slide index
  const scrollToIndex = useCallback((index: number, smooth: boolean = true) => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    const width = container.clientWidth;
    isProgrammaticScroll.current = true;
    container.scrollTo({
      left: index * width,
      behavior: smooth ? 'smooth' : 'auto'
    });
    setActiveIndex(index);
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 400);
  }, []);

  const handleNext = useCallback(() => {
    const next = activeIndex >= mediaUrls.length - 1 ? 0 : activeIndex + 1;
    scrollToIndex(next);
  }, [activeIndex, mediaUrls.length, scrollToIndex]);

  const handlePrev = useCallback(() => {
    const prev = activeIndex <= 0 ? mediaUrls.length - 1 : activeIndex - 1;
    scrollToIndex(prev);
  }, [activeIndex, mediaUrls.length, scrollToIndex]);

  // Keep thumbnail strip scrolled to the active thumbnail
  useEffect(() => {
    thumbnailRefs.current[activeIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }, [activeIndex]);

  // Handle window resize to keep current image properly aligned
  useEffect(() => {
    const handleResize = () => {
      if (sliderRef.current) {
        const width = sliderRef.current.clientWidth;
        sliderRef.current.scrollLeft = activeIndex * width;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex]);

  // Handle native scroll/swipe inside the slider
  const handleScroll = () => {
    if (isProgrammaticScroll.current || !sliderRef.current) return;
    const container = sliderRef.current;
    const width = container.clientWidth;
    if (width === 0) return;
    const newIndex = Math.round(container.scrollLeft / width);
    if (newIndex >= 0 && newIndex < mediaUrls.length && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  // Touch swipe gesture handlers (intuitive for mobile users)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;

    // Only trigger if horizontal swipe is significantly stronger than vertical scroll
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX > 0) {
        // Swiped left -> Next image in LTR track
        handleNext();
      } else {
        // Swiped right -> Previous image
        handlePrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image/Video Slider Container */}
      <div 
        className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner relative group select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Horizontal Scroll Snap Track */}
        <div
          ref={sliderRef}
          onScroll={handleScroll}
          dir="ltr"
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapStop: 'always' }}
        >
          {mediaUrls.map((url, idx) => {
            const isVideo = url.endsWith('.mp4') || url.includes('video');
            return (
              <div 
                key={idx} 
                className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center bg-slate-100"
              >
                {isVideo ? (
                  <video 
                    src={url} 
                    className="w-full h-full object-cover" 
                    controls 
                    autoPlay={idx === activeIndex} 
                    muted 
                    loop
                  />
                ) : (
                  <img 
                    src={url} 
                    alt={`${title} - تصویر ${idx + 1}`} 
                    draggable={false}
                    className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-105" 
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Navigation Arrows */}
        {mediaUrls.length > 1 && (
          <>
            {/* Prev (Right in RTL layout) */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-lg backdrop-blur-md flex items-center justify-center border border-white/70 transition-all opacity-85 hover:opacity-100 z-10 active:scale-95 cursor-pointer hover:shadow-xl"
              aria-label="تصویر قبلی"
              title="تصویر قبلی"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            {/* Next (Left in RTL layout) */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-lg backdrop-blur-md flex items-center justify-center border border-white/70 transition-all opacity-85 hover:opacity-100 z-10 active:scale-95 cursor-pointer hover:shadow-xl"
              aria-label="تصویر بعدی"
              title="تصویر بعدی"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            {/* Transparent Indicator Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full z-10 shadow-sm border border-white/15">
              {mediaUrls.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToIndex(idx);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    activeIndex === idx 
                      ? 'w-5 h-2 bg-white shadow-sm' 
                      : 'w-2 h-2 bg-white/40 hover:bg-white/80'
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
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-1">
          {mediaUrls.map((url, idx) => (
            <button
              key={idx}
              ref={el => { thumbnailRefs.current[idx] = el; }}
              type="button"
              onClick={() => scrollToIndex(idx)}
              className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                activeIndex === idx 
                  ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/25 scale-[1.02]' 
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {url.endsWith('.mp4') || url.includes('video') ? (
                <>
                  <video src={url} className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
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

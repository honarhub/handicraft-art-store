'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Artist {
  id: string;
  displayId: number;
  user: {
    name: string | null;
    image: string | null;
  };
}

export default function TopArtistsCarousel({ artists }: { artists: Artist[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll logic
  useEffect(() => {
    if (artists.length <= 3) return; // Don't auto-scroll if too few artists

    const interval = setInterval(() => {
      if (!isHovered && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        // Check if we reached the end (considering RTL)
        // In RTL, scrollLeft is negative or positive depending on browser, 
        // standard way is using scrollWidth - clientWidth
        
        // Simple heuristic: just scroll left (which means scrolling to next items in RTL)
        const scrollAmount = 200; // Scroll by roughly one item width
        
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        
        // If we hit the absolute end, we might want to reset to start, 
        // but simple scrollBy usually just stops at the boundary.
        // We can check if we hit the limit:
        if (Math.abs(container.scrollLeft) >= container.scrollWidth - container.clientWidth - 10) {
          // Reset to start
          setTimeout(() => {
            container.scrollTo({ left: 0, behavior: 'smooth' });
          }, 2000);
        }
      }
    }, 4000); // Every 4 seconds

    return () => clearInterval(interval);
  }, [isHovered, artists.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = direction === 'right' ? 300 : -300; // In RTL, right means positive scrollLeft, left means negative
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!artists || artists.length === 0) return null;

  return (
    <section className="px-6 md:px-12 relative group" 
             onMouseEnter={() => setIsHovered(true)} 
             onMouseLeave={() => setIsHovered(false)}>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">هنرمندان ایران زمین</h2>
          <p className="text-slate-500">آفرینندگان آثار اصیل و ماندگار</p>
        </div>
      </div>

      <div className="relative">
        {/* Navigation Arrows (Glassmorphism) - show on hover or always on mobile? We'll use group-hover on desktop */}
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/60 focus:outline-none hidden md:flex translate-x-1/2"
          aria-label="Scroll Right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto pb-6 pt-2 gap-8 snap-x snap-mandatory scrollbar-hide" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {artists.map(artist => (
            <a key={artist.id} href={`/artist/${artist.displayId}`} className="flex flex-col items-center gap-4 min-w-[140px] md:min-w-[160px] snap-center group/item">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-slate-200 border-4 border-white shadow-md overflow-hidden group-hover/item:border-emerald-500 group-hover/item:shadow-emerald-200 transition-all duration-300 group-hover/item:-translate-y-2">
                {artist.user.image ? (
                  <img src={artist.user.image} alt={artist.user.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-4xl text-slate-300">🎭</div>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-800 group-hover/item:text-emerald-600 transition-colors text-base md:text-lg">{artist.user.name || 'هنرمند'}</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium bg-slate-100 px-3 py-1 rounded-full group-hover/item:bg-emerald-50 group-hover/item:text-emerald-700 transition-colors">مشاهده آثار</p>
              </div>
            </a>
          ))}
        </div>

        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-800 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/60 focus:outline-none hidden md:flex -translate-x-1/2"
          aria-label="Scroll Left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>
    </section>
  );
}

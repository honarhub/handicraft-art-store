'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface Product {
  id: string;
  title: string;
  imageUrl: string;
  stockQuantity: number;
  isPreOrderEnabled: boolean;
  price?: number | null;
  pricingTiers?: { price: number }[];
  artist?: {
    user?: {
      name: string | null;
      image: string | null;
    } | null;
  } | null;
}

export default function FeaturedRecentCarousel({ products }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const isScrollingProgrammatically = useRef(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smoothly scroll mobile container to specific item
  const scrollToIndex = useCallback((index: number) => {
    if (!mobileContainerRef.current) return;
    const targetItem = itemRefs.current[index];
    if (targetItem) {
      isScrollingProgrammatically.current = true;
      targetItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
      setActiveIndex(index);
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 500);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (products.length <= 1) return;
    const next = (activeIndex + 1) % products.length;
    scrollToIndex(next);
  }, [activeIndex, products.length, scrollToIndex]);

  const handlePrev = useCallback(() => {
    if (products.length <= 1) return;
    const prev = activeIndex === 0 ? products.length - 1 : activeIndex - 1;
    scrollToIndex(prev);
  }, [activeIndex, products.length, scrollToIndex]);

  // 3-second auto-scroll on mobile
  useEffect(() => {
    if (products.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % products.length;
        if (mobileContainerRef.current) {
          const target = itemRefs.current[next];
          if (target) {
            isScrollingProgrammatically.current = true;
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
            });
            setTimeout(() => {
              isScrollingProgrammatically.current = false;
            }, 500);
          }
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [products.length, isPaused]);

  // Real-time synchronization of active index while dragging/swiping
  const handleMobileScroll = () => {
    if (isScrollingProgrammatically.current || !mobileContainerRef.current) return;
    const container = mobileContainerRef.current;
    const containerCenter = container.getBoundingClientRect().left + container.clientWidth / 2;

    let closestIdx = activeIndex;
    let minDistance = Infinity;

    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const elCenter = rect.left + rect.width / 2;
      const dist = Math.abs(elCenter - containerCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    if (closestIdx !== activeIndex) {
      setActiveIndex(closestIdx);
    }
  };

  // Pause on touch interaction so user can smoothly read or quickly swipe
  const handleTouchStart = () => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
  };

  const handleTouchEnd = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    // Resume auto-scroll after 3.5 seconds of inactivity
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3500);
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-24 sm:py-32 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
        <div className="text-5xl mb-6 opacity-50">🎨</div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-700 mb-3">گالری در حال تجهیز است</h3>
        <p className="text-slate-500 max-w-md mx-auto font-medium text-xs sm:text-sm">
          به زودی جدیدترین آثار هنرمندان به این بخش اضافه خواهد شد.
        </p>
      </div>
    );
  }

  // Render Single Product Card Content
  const renderCardContent = (product: Product) => {
    const rawPrice = product.pricingTiers?.[0]?.price || product.price;

    return (
      <>
        <div className="aspect-[4/5] w-full relative overflow-hidden bg-slate-100">
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            draggable={false}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 select-none"
          />

          {/* Out of stock without pre-order */}
          {product.stockQuantity <= 0 && !product.isPreOrderEnabled && (
            <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex items-center justify-center p-3 text-center z-10">
              <span className="bg-slate-900 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs sm:text-sm shadow-md">
                ناموجود
              </span>
            </div>
          )}

          {/* Out of stock with pre-order enabled */}
          {product.stockQuantity <= 0 && product.isPreOrderEnabled && (
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-1.5">
                <span>✨</span>
                <span>امکان ثبت پیش‌سفارش</span>
              </span>
            </div>
          )}

          {/* Price badge if available */}
          {rawPrice && rawPrice > 0 ? (
            <div className="absolute bottom-3 left-3 z-10">
              <span className="bg-slate-900/85 backdrop-blur-md text-white font-black px-2.5 py-1 rounded-xl text-xs shadow-md">
                {rawPrice.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-slate-300">تومان</span>
              </span>
            </div>
          ) : null}
        </div>

        <div className="p-5 sm:p-7 flex flex-col justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-800 mb-3 group-hover:text-emerald-600 transition-colors line-clamp-1">
            {product.title}
          </h3>
          <div className="flex items-center gap-2.5">
            {product.artist?.user?.image ? (
              <img 
                src={product.artist.user.image} 
                alt={product.artist.user.name || ''} 
                className="w-8 h-8 rounded-full object-cover border-2 border-slate-100 shadow-sm shrink-0" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400 shrink-0">
                👤
              </div>
            )}
            <span className="text-xs sm:text-sm font-bold text-slate-600 truncate">
              {product.artist?.user?.name || 'هنرمند'}
            </span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div>
      {/* -------------------- MOBILE VIEW (Horizontal Auto-Scroll Carousel with Touch) -------------------- */}
      <div 
        className="block md:hidden relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Horizontal Scroll Track */}
        <div 
          ref={mobileContainerRef}
          onScroll={handleMobileScroll}
          className="flex overflow-x-auto gap-4 px-2 pb-5 pt-1 snap-x snap-mandatory scrollbar-hide touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, idx) => (
            <a 
              key={product.id} 
              ref={el => { itemRefs.current[idx] = el; }}
              href={`/product/${product.id}`} 
              className={`group flex flex-col w-[80vw] max-w-[310px] shrink-0 snap-center bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md transition-all duration-300 ${
                activeIndex === idx ? 'ring-2 ring-emerald-500/30 shadow-lg scale-[1.01]' : 'opacity-95'
              }`}
            >
              {renderCardContent(product)}
            </a>
          ))}
        </div>

        {/* Floating Arrow Controls on Mobile for quick navigation */}
        {products.length > 1 && (
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            {/* Dots Pagination */}
            <div className="flex items-center gap-1.5">
              {products.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToIndex(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    activeIndex === idx 
                      ? 'w-6 h-2 bg-emerald-600 shadow-sm' 
                      : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                  aria-label={`رفتن به اثر ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev & Next mini buttons */}
            <div className="flex items-center gap-1.5" dir="ltr">
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs active:scale-95 transition-all"
                aria-label="اثر قبلی"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs active:scale-95 transition-all"
                aria-label="اثر بعدی"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* View All Button on Mobile */}
        <div className="mt-2 text-center">
          <a 
            href="/products" 
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200/60 shadow-2xs hover:bg-emerald-100 transition-colors"
          >
            <span>مشاهده همه آثار گالری</span>
            <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </a>
        </div>
      </div>

      {/* -------------------- DESKTOP VIEW (Spacious Grid) -------------------- */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
        {products.map((product) => (
          <a 
            key={product.id} 
            href={`/product/${product.id}`} 
            className="group block bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2"
          >
            {renderCardContent(product)}
          </a>
        ))}
      </div>
    </div>
  );
}

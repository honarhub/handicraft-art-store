'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import ProductImageWithSkeleton from './ProductImageWithSkeleton';
import QuickAddToCartButton from './QuickAddToCartButton';

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

export default function FeaturedRecentCarousel({ products = [] }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const [isInView, setIsInView] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const isScrollingProgrammatically = useRef(false);

  // Permanently disable auto-scroll upon any user touch or interaction
  const handleUserInteraction = useCallback(() => {
    setIsAutoScrollActive(false);
  }, []);

  // Detect whether carousel is inside the visible screen viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Smoothly scroll container horizontally WITHOUT affecting window vertical scroll
  const scrollToIndex = useCallback((targetIndex: number) => {
    const container = containerRef.current;
    const targetItem = itemRefs.current[targetIndex];
    if (!container || !targetItem) return;

    isScrollingProgrammatically.current = true;
    setActiveIndex(targetIndex);

    // Calculate exact pixel offset relative to container viewport to prevent page jumping
    const itemRect = targetItem.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const diff = (itemRect.left + itemRect.width / 2) - (containerRect.left + containerRect.width / 2);

    container.scrollBy({
      left: diff,
      behavior: 'smooth'
    });

    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 450);
  }, []);

  const handleNext = useCallback(() => {
    handleUserInteraction();
    if (!products || products.length <= 1) return;
    const next = (activeIndex + 1) % products.length;
    scrollToIndex(next);
  }, [activeIndex, products, scrollToIndex, handleUserInteraction]);

  const handlePrev = useCallback(() => {
    handleUserInteraction();
    if (!products || products.length <= 1) return;
    const prev = activeIndex === 0 ? products.length - 1 : activeIndex - 1;
    scrollToIndex(prev);
  }, [activeIndex, products, scrollToIndex, handleUserInteraction]);

  // 3-second auto-scroll: ONLY when active, in viewport, and not manually interacted with
  useEffect(() => {
    if (!isAutoScrollActive || !isInView || !products || products.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % products.length;
        scrollToIndex(next);
        return next;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isAutoScrollActive, isInView, products, scrollToIndex]);

  // Real-time synchronization of active index while dragging/swiping
  const handleScroll = () => {
    if (!isScrollingProgrammatically.current) {
      // User scrolled manually with their finger/touch! Permanently disable auto-scroll
      setIsAutoScrollActive(false);
    }

    const container = containerRef.current;
    if (!container) return;
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

  return (
    <section 
      id="marketplace" 
      className="px-4 sm:px-6 md:px-12 rounded-[2.5rem] py-6 sm:py-8 mx-2 sm:mx-4 md:mx-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative group/section bg-white border border-slate-100/60"
    >
      {/* Soft elegant ambient background effects */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none bg-emerald-50"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none bg-purple-50/40"></div>

      {/* Header Row */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end mb-5 md:mb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 text-slate-800 tracking-tight">
            آثار برگزیده اخیر
          </h2>
          <p className="text-slate-500 font-medium text-xs sm:text-sm">
            جدیدترین دست‌سازه‌های پلتفرم هنرهاب از کارگاه هنرمندان
          </p>
        </div>
        <a 
          href="/products" 
          className="bg-white border border-slate-200 text-slate-700 shadow-sm hover:shadow-md hover:border-emerald-200 hover:text-emerald-700 font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all hover:-translate-y-0.5 text-xs sm:text-sm flex items-center gap-2"
        >
          <span>گالری کامل</span>
          <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </a>
      </div>

      {(!products || products.length === 0) ? (
        <div className="relative z-10 text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
          <div className="text-5xl mb-4 opacity-40">🎨</div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">گالری در حال تجهیز است</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            به زودی جدیدترین آثار برگزیده هنرمندان به این بخش اضافه خواهد شد.
          </p>
        </div>
      ) : (
        <div className="relative z-10">
          {/* Desktop Hover Navigation Arrow Buttons */}
          {products.length > 1 && (
            <>
              <button 
                type="button"
                onClick={handlePrev}
                aria-label="اثر قبلی"
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/90 hover:bg-white backdrop-blur shadow-lg rounded-full text-slate-800 border border-slate-200 opacity-0 group-hover/section:opacity-100 transition-all translate-x-4 group-hover/section:translate-x-2 cursor-pointer active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
              
              <button 
                type="button"
                onClick={handleNext}
                aria-label="اثر بعدی"
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/90 hover:bg-white backdrop-blur shadow-lg rounded-full text-slate-800 border border-slate-200 opacity-0 group-hover/section:opacity-100 transition-all -translate-x-4 group-hover/section:-translate-x-2 cursor-pointer active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
            </>
          )}

          {/* Horizontal Slider Track with Snap, Touch & Drag (Both Desktop and Mobile) */}
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            onTouchStart={handleUserInteraction}
            onMouseDown={handleUserInteraction}
            className="flex overflow-x-auto pb-6 pt-2 gap-4 sm:gap-6 snap-x snap-mandatory scrollbar-hide" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, idx) => {
              const rawPrice = product.pricingTiers?.[0]?.price || product.price;

              return (
                <a 
                  key={product.id} 
                  ref={el => { itemRefs.current[idx] = el; }}
                  href={`/product/${product.id}`} 
                  className={`flex flex-col group min-w-[260px] w-[260px] sm:min-w-[280px] sm:w-[280px] md:min-w-[300px] md:w-[300px] snap-center bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 shrink-0 ${
                    activeIndex === idx ? 'ring-2 ring-emerald-500/30' : ''
                  }`}
                >
                  <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-950 shrink-0">
                    <ProductImageWithSkeleton 
                      src={product.imageUrl} 
                      alt={product.title} 
                      containerClassName="absolute inset-0 w-full h-full"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 select-none"
                    />

                    {/* Out of stock without pre-order */}
                    {product.stockQuantity <= 0 && !product.isPreOrderEnabled && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center p-3 text-center z-10">
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

                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <h3 className="text-sm sm:text-base font-black text-slate-800 mb-1.5 group-hover:text-emerald-600 transition-colors line-clamp-1">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      {product.artist?.user?.image ? (
                        <img 
                          src={product.artist.user.image} 
                          alt={product.artist.user.name || ''} 
                          className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0" 
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                          👤
                        </div>
                      )}
                      <span className="text-xs font-bold text-slate-500 truncate">
                        {product.artist?.user?.name || 'هنرمند'}
                      </span>
                    </div>
                    
                    <div className="mt-auto flex justify-between items-center border-t border-slate-100 pt-3">
                      {rawPrice && rawPrice > 0 ? (
                        <QuickAddToCartButton
                          product={{
                            id: product.id,
                            title: product.title,
                            imageUrl: product.imageUrl,
                            artistName: product.artist?.user?.name || 'هنرمند',
                            stockQuantity: product.stockQuantity,
                            price: rawPrice,
                            isPreOrderEnabled: product.isPreOrderEnabled,
                          }}
                        />
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">قیمت اثر:</span>
                      )}
                      <div className="flex items-baseline gap-1 text-left">
                        <span className="font-black text-emerald-600 text-sm sm:text-base">
                          {rawPrice ? rawPrice.toLocaleString('fa-IR') : 'توافقی'}
                        </span>
                        {rawPrice && <span className="text-[10px] font-bold text-slate-400">تومان</span>}
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Bottom Pagination Dots & Controls */}
          {products.length > 1 && (
            <div className="flex items-center justify-between px-2 pt-3">
              {/* Dots Pagination */}
              <div className="flex items-center gap-1.5">
                {products.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleUserInteraction();
                      scrollToIndex(idx);
                    }}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      activeIndex === idx 
                        ? 'w-6 h-2 bg-emerald-600 shadow-sm' 
                        : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                    aria-label={`رفتن به اسلاید ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev & Next mini buttons */}
              <div className="flex items-center gap-1.5" dir="ltr">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
                  aria-label="اسلاید قبلی"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
                  aria-label="اسلاید بعدی"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

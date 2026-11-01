'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  title: string;
  imageUrl: string;
  stockQuantity: number;
  isPreOrderEnabled: boolean;
  status: string;
  price?: number | null;
  pricingTiers?: { price: number }[];
}

export default function ArtistProductsCarousel({ products }: { products: Product[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const [isInView, setIsInView] = useState(false);

  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const isScrollingProgrammatically = useRef(false);

  // Permanently disable auto-scroll upon any user touch or interaction
  const handleUserInteraction = useCallback(() => {
    setIsAutoScrollActive(false);
  }, []);

  // Detect whether carousel is inside the visible screen viewport
  useEffect(() => {
    const el = mobileContainerRef.current;
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
  const scrollToIndex = useCallback((index: number) => {
    const container = mobileContainerRef.current;
    const targetItem = itemRefs.current[index];
    if (!container || !targetItem) return;

    isScrollingProgrammatically.current = true;
    setActiveIndex(index);

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
    if (products.length <= 1) return;
    const next = (activeIndex + 1) % products.length;
    scrollToIndex(next);
  }, [activeIndex, products.length, scrollToIndex, handleUserInteraction]);

  const handlePrev = useCallback(() => {
    handleUserInteraction();
    if (products.length <= 1) return;
    const prev = activeIndex === 0 ? products.length - 1 : activeIndex - 1;
    scrollToIndex(prev);
  }, [activeIndex, products.length, scrollToIndex, handleUserInteraction]);

  // 3-second auto-scroll: ONLY when active, in viewport, and not manually interacted with
  useEffect(() => {
    if (!isAutoScrollActive || !isInView || products.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % products.length;
        scrollToIndex(next);
        return next;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isAutoScrollActive, isInView, products.length, scrollToIndex]);

  // Real-time synchronization of active index while dragging/swiping
  const handleMobileScroll = () => {
    if (!isScrollingProgrammatically.current) {
      // User scrolled manually with their finger/touch! Permanently disable auto-scroll
      setIsAutoScrollActive(false);
    }

    const container = mobileContainerRef.current;
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

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
        <div className="text-4xl mb-3 opacity-60">🎨</div>
        <p className="text-gray-500 font-medium text-sm">هنوز اثری توسط این هنرمند ثبت نشده است.</p>
      </div>
    );
  }

  // Render Single Product Card Content
  const renderCardContent = (product: Product) => {
    const isAvailable = product.stockQuantity > 0;
    const isPreOrder = !isAvailable && Boolean(product.isPreOrderEnabled);
    const isOutOfStock = !isAvailable && !product.isPreOrderEnabled;
    const priceValue = product.pricingTiers?.[0]?.price || product.price;

    return (
      <>
        <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            draggable={false}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none" 
          />
          
          {/* Out of stock without pre-order: dimmed blurred overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center p-3 text-center z-10">
              <span className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md">
                ناموجود
              </span>
            </div>
          )}

          {/* Out of stock with pre-order enabled: crisp image with prominent badge */}
          {isPreOrder && (
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md flex items-center gap-1.5">
                <span>✨</span>
                <span>امکان ثبت پیش‌سفارش</span>
              </span>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col justify-between flex-1">
          <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {product.title}
          </h3>
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
            {product.status !== 'APPROVED' ? (
              <span className="text-emerald-700 font-bold text-sm">بزودی...</span>
            ) : isOutOfStock ? (
              <span className="text-slate-500 font-bold text-sm">ناموجود</span>
            ) : (
              <div className="flex flex-col">
                <span className={isPreOrder ? "text-amber-700 font-bold text-sm sm:text-base" : "text-emerald-700 font-bold text-sm sm:text-base"}>
                  {priceValue ? Number(priceValue).toLocaleString('fa-IR') + ' تومان' : 'نامشخص'}
                </span>
                {isPreOrder && (
                  <span className="text-[10px] text-amber-600 font-bold">پیش‌سفارش ساخت</span>
                )}
              </div>
            )}
            <span className="bg-gray-100 group-hover:bg-emerald-50 group-hover:text-emerald-700 text-gray-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors">
              مشاهده
            </span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div>
      {/* -------------------- MOBILE VIEW (Horizontal Auto-Scroll Carousel with Touch) -------------------- */}
      <div className="block md:hidden relative">
        {/* Horizontal Scroll Track */}
        <div 
          ref={mobileContainerRef}
          onScroll={handleMobileScroll}
          onTouchStart={handleUserInteraction}
          onMouseDown={handleUserInteraction}
          className="flex overflow-x-auto gap-4 px-2 pb-5 pt-1 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, idx) => (
            <Link 
              key={product.id} 
              ref={el => { itemRefs.current[idx] = el; }}
              href={`/product/${product.id}`} 
              className={`group flex flex-col w-[80vw] max-w-[310px] shrink-0 snap-center bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md transition-all duration-300 ${
                activeIndex === idx ? 'ring-2 ring-emerald-500/30 shadow-lg scale-[1.01]' : 'opacity-95'
              }`}
            >
              {renderCardContent(product)}
            </Link>
          ))}
        </div>

        {/* Floating Controls on Mobile for quick navigation */}
        {products.length > 1 && (
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
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
                  aria-label={`رفتن به اثر ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev & Next mini buttons */}
            <div className="flex items-center gap-1.5" dir="ltr">
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
                aria-label="اثر قبلی"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
                aria-label="اثر بعدی"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- DESKTOP VIEW (Spacious Grid) -------------------- */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={`/product/${product.id}`} 
            className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
          >
            {renderCardContent(product)}
          </Link>
        ))}
      </div>
    </div>
  );
}

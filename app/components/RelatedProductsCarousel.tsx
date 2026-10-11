'use client';

import React, { useRef } from 'react';
import Link from 'next/link';

export interface RelatedProductItem {
  id: string;
  title: string;
  imageUrl: string;
  stockQuantity: number;
  isUnique: boolean;
  price: number;
  artistName: string;
  specialtyName?: string;
}

interface RelatedProductsCarouselProps {
  products: RelatedProductItem[];
  title?: string;
  subtitle?: string;
}

export default function RelatedProductsCarousel({
  products,
  title = 'آثار دست‌ساز مرتبط در هنرهاب',
  subtitle = 'تهیه مستقیم از هنرمند با ضمانت اصالت فیزیکی و امضای اثر'
}: RelatedProductsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) {
    return null;
  }

  // Sorting products:
  // 1. Available in stock (stockQuantity > 0)
  // 2. Pre-orderable (!isUnique && stockQuantity === 0)
  // 3. Out of stock (isUnique && stockQuantity === 0)
  const sortedProducts = [...products].sort((a, b) => {
    const getPriority = (p: RelatedProductItem) => {
      if (p.stockQuantity > 0) return 1; // In stock
      if (!p.isUnique) return 2; // Pre-orderable
      return 3; // Out of stock
    };
    return getPriority(a) - getPriority(b);
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="mt-16 pt-12 border-t border-slate-200/80 font-sans" dir="rtl">
      {/* Header with Navigation Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold mb-2 border border-amber-200/60">
            <span>✨</span> ویترین آثار برگزیده
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            {subtitle}
          </p>
        </div>

        {/* Carousel Arrow Controls (if products > 3) */}
        {sortedProducts.length > 3 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => scroll('right')}
              aria-label="مشاهده قبلی"
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('left')}
              aria-label="مشاهده بعدی"
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Scrolling Track */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {sortedProducts.map((product) => {
          const isAvailable = product.stockQuantity > 0;
          const isPreOrder = !isAvailable && !product.isUnique;
          const isOutOfStock = !isAvailable && product.isUnique;

          return (
            <div
              key={product.id}
              className="flex-shrink-0 w-72 snap-start group"
            >
              <a
                href={`/product/${product.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full relative"
              >
                {/* Image Container with Badges */}
                <div className="aspect-square w-full relative overflow-hidden bg-slate-100">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Stock Status Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                    {isAvailable && (
                      <span className="px-2.5 py-1 bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-bold rounded-lg shadow-sm">
                        موجود ({product.stockQuantity})
                      </span>
                    )}

                    {isPreOrder && (
                      <span className="px-2.5 py-1 bg-amber-500/95 backdrop-blur-md text-black text-[11px] font-bold rounded-lg shadow-sm">
                        امکان پیش‌فروش
                      </span>
                    )}

                    {isOutOfStock && (
                      <span className="px-2.5 py-1 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold rounded-lg shadow-sm">
                        ناموجود
                      </span>
                    )}
                  </div>

                  {/* New Tab Indicator Badge */}
                  <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-xs">
                    ↗
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex flex-col flex-1">
                  {product.specialtyName && (
                    <span className="text-[11px] font-bold text-slate-400 mb-1 block">
                      {product.specialtyName}
                    </span>
                  )}

                  <h4 className="font-bold text-slate-800 text-base mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                    {product.title}
                  </h4>

                  <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                    اثری از: <span className="font-medium text-slate-700">{product.artistName}</span>
                  </p>

                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {product.price > 0 ? (
                        <>
                          <div className="font-black text-emerald-600 text-base">
                            {product.price.toLocaleString('fa-IR')}
                          </div>
                          <span className="text-[10px] text-slate-400 leading-none">تومان</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">تماس جهت استعلام</span>
                      )}
                    </div>

                    <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-[-4px] transition-transform flex items-center gap-1">
                      مشاهده اثر <span>←</span>
                    </span>
                  </div>
                </div>
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

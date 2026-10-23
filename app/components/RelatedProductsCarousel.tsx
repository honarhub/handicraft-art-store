'use client';

import React, { useRef } from 'react';

export interface RelatedProductItem {
  id: string;
  title: string;
  imageUrl: string;
  stockQuantity: number;
  isUnique: boolean;
  isPreOrderEnabled?: boolean;
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
}: RelatedProductsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) {
    return null;
  }

  // اولویت‌بندی مرتب‌سازی آثار:
  // ۱. آثار موجود (stockQuantity > 0)
  // ۲. آثار ناموجود دارای امکان پیش‌سفارش
  // ۳. آثار ناموجود بدون پیش‌سفارش
  const sortedProducts = [...products].sort((a, b) => {
    const getPriority = (p: RelatedProductItem) => {
      if (p.stockQuantity > 0) return 1;
      if (p.isPreOrderEnabled) return 2;
      return 3;
    };
    return getPriority(a) - getPriority(b);
  });

  const scroll = (direction: 'next' | 'prev') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      // در چیدمان راست‌به‌چپ (RTL)، اسکرول به جلو (next) به سمت چپ صورت می‌گیرد
      const delta = direction === 'next' ? -scrollAmount : scrollAmount;
      scrollRef.current.scrollBy({
        left: delta,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="mt-14 pt-8 border-t border-slate-200/80 font-sans" dir="rtl">
      {/* فقط گزینه ویترین آثار برگزیده */}
      <div className="mb-6 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-900 rounded-full text-xs font-bold border border-amber-200/70 shadow-2xs">
          <span>✨</span> ویترین آثار برگزیده
        </div>
      </div>

      {/* باکسی که عکس‌ها داخل آن قرار دارند همراه با فلش‌های ناوبری در چپ و راست */}
      <div className="relative">
        {/* دکمه فلش سمت راست (قبلی در RTL) */}
        <button
          type="button"
          onClick={() => scroll('prev')}
          aria-label="مشاهده آثار قبلی"
          title="قبلی"
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-slate-800 border border-slate-200/90 shadow-lg flex items-center justify-center transition-all hover:bg-slate-50 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-xs"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* دکمه فلش سمت چپ (بعدی در RTL) */}
        <button
          type="button"
          onClick={() => scroll('next')}
          aria-label="مشاهده آثار بعدی"
          title="بعدی"
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-slate-800 border border-slate-200/90 shadow-lg flex items-center justify-center transition-all hover:bg-slate-50 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-xs"
        >
          <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* نوار اسکرول افقی آثار */}
        <div
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sortedProducts.map((product) => {
            const isAvailable = product.stockQuantity > 0;
            const isPreOrder = !isAvailable && Boolean(product.isPreOrderEnabled);
            const isOutOfStock = !isAvailable && !product.isPreOrderEnabled;

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
                  {/* ظرف تصویر محصول و برچسب‌های موجودی */}
                  <div className="aspect-square w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* برچسب‌های وضعیت موجودی و پیش‌سفارش */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                      {isAvailable && (
                        <span className="px-2.5 py-1 bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-bold rounded-lg shadow-sm">
                          موجود ({product.stockQuantity})
                        </span>
                      )}

                      {isPreOrder && (
                        <span className="px-2.5 py-1 bg-amber-600/95 backdrop-blur-md text-white text-[11px] font-bold rounded-lg shadow-sm">
                          ناموجود (امکان ثبت پیش‌سفارش)
                        </span>
                      )}

                      {isOutOfStock && (
                        <span className="px-2.5 py-1 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold rounded-lg shadow-sm">
                          ناموجود
                        </span>
                      )}
                    </div>

                    {/* نشان باز شدن در تب جدید */}
                    <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-xs">
                      ↗
                    </div>
                  </div>

                  {/* جزئیات و قیمت اثر */}
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
                      اثر {product.artistName}
                    </p>

                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-black text-emerald-700">
                          {product.price.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-xs text-slate-500 mr-1">تومان</span>
                      </div>

                      <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-[-2px] transition-transform flex items-center gap-0.5">
                        مشاهده اثر
                        <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

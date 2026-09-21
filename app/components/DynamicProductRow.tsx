'use client';

import React, { useRef } from 'react';
import { RowType } from '../admin/(protected)/settings/page';

interface DynamicProductRowProps {
  title: string;
  subtitle?: string;
  type: RowType;
  value: string;
  products: any[];
  index: number;
}

export default function DynamicProductRow({ title, subtitle, type, value, products, index }: DynamicProductRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Alternate backgrounds slightly for visual separation
  const isAlternate = index % 2 !== 0;

  let linkHref = '/products';
  if (type === 'SPECIALTY') linkHref = `/products?specialty=${value}`;
  if (type === 'ARTIST') linkHref = `/artist/${value}`;
  if (type === 'PRICE_UNDER') linkHref = `/products?maxPrice=${value}`;

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className={`px-6 md:px-12 rounded-[2.5rem] py-16 mx-4 md:mx-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative group ${isAlternate ? 'bg-slate-50/80 border border-slate-100' : 'bg-white border border-slate-100/50'}`}>
      
      {/* Soft elegant ambient background effects */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none ${isAlternate ? 'bg-emerald-50' : 'bg-purple-50/50'}`}></div>
      <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none ${isAlternate ? 'bg-purple-50/50' : 'bg-emerald-50'}`}></div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black mb-2 text-slate-800 tracking-tight">{title}</h2>
          <p className="text-slate-500 font-medium">{subtitle || 'منتخبی از بهترین آثار برای شما'}</p>
        </div>
        <a href={linkHref} className="bg-white border border-slate-200 text-slate-700 shadow-sm hover:shadow-md hover:border-emerald-200 hover:text-emerald-700 font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5">
          مشاهده همه
        </a>
      </div>

      {(!products || products.length === 0) ? (
        <div className="relative z-10 text-center py-16 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
          <div className="text-4xl mb-4 opacity-30">🎨</div>
          <h3 className="text-xl font-bold text-slate-600 mb-2">هنوز اثری در این بخش نیست</h3>
          <p className="text-sm text-slate-400">به زودی دست‌سازه‌های مرتبط اضافه خواهند شد.</p>
        </div>
      ) : (
        <div className="relative z-10">
          {/* Scroll Buttons */}
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/80 hover:bg-white backdrop-blur shadow-md rounded-full text-slate-800 border border-slate-100 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
          
          <button 
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/80 hover:bg-white backdrop-blur shadow-md rounded-full text-slate-800 border border-slate-100 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:-translate-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <div ref={scrollContainerRef} className="flex overflow-x-auto pb-6 pt-2 gap-6 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {products.map((product) => (
              <a key={product.id} href={`/product/${product.id}`} className="flex flex-col group min-w-[280px] w-[280px] md:min-w-[300px] md:w-[300px] snap-start bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 h-[420px]">
                <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-50 shrink-0">
                  <img 
                    src={product.imageUrl} 
                    alt={product.title} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-black text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">{product.title}</h3>
                  <div className="text-sm font-bold text-slate-500 mb-4 line-clamp-1">{product.artist?.user?.name || 'هنرمند'}</div>
                  
                  <div className="mt-auto flex justify-between items-end">
                    <div className="flex flex-col text-left">
                      <div className="font-black text-emerald-600 text-lg">{(product.pricingTiers[0]?.price || 0).toLocaleString('fa-IR')}</div>
                      <div className="text-[10px] font-bold text-emerald-800/60 leading-none">تومان</div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

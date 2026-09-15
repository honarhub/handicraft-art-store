import React from 'react';
import { RowType } from '../admin/settings/page';

interface DynamicProductRowProps {
  title: string;
  type: RowType;
  value: string;
  products: any[];
  index: number;
}

export default function DynamicProductRow({ title, type, value, products, index }: DynamicProductRowProps) {
  if (!products || products.length === 0) return null;

  // Alternate backgrounds for visual variety
  const isDark = index % 2 === 0;

  let linkHref = '/products';
  if (type === 'SPECIALTY') linkHref = `/products?specialty=${value}`;
  if (type === 'ARTIST') linkHref = `/artist/${value}`;
  if (type === 'PRICE_UNDER') linkHref = `/products?maxPrice=${value}`;

  return (
    <section className={`px-6 md:px-12 rounded-[2.5rem] py-20 mx-4 md:mx-12 shadow-2xl overflow-hidden relative ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 border border-slate-100'}`}>
      {isDark ? (
        <>
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-900/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-800/60 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        </>
      ) : (
        <>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        </>
      )}
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black mb-3">{title}</h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>منتخبی از بهترین آثار برای شما</p>
        </div>
        <a href={linkHref} className={`${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white'} backdrop-blur-md border font-bold px-6 py-3 rounded-xl transition-all`}>
          مشاهده همه
        </a>
      </div>
      <div className="relative z-10 flex overflow-x-auto pb-8 gap-8 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {products.map((product) => (
          <a key={product.id} href={`/product/${product.id}`} className={`group block min-w-[280px] md:min-w-[320px] snap-start backdrop-blur-lg rounded-3xl overflow-hidden border transition-all duration-500 hover:-translate-y-2 ${isDark ? 'bg-white/5 border-white/10 hover:border-white/30' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-xl'}`}>
            <div className={`aspect-[4/3] w-full relative overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
              />
            </div>
            <div className="p-6">
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{product.title}</h3>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{product.artist.user.name}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

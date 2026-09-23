import React from 'react';
import CartIcon from './CartIcon';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm transition-all" dir="rtl">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-5 px-6 md:px-12">
        <a href="/" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1 group">
          هنرهاب <span className="text-emerald-500 group-hover:rotate-12 transition-transform">.</span>
        </a>
        <nav className="hidden md:flex gap-10 text-sm font-bold text-slate-600 items-center">
          <a href="/products" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">گالری آثار</a>
          <a href="/about" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">درباره ما</a>
          <a href="/artist-panel/login" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">پنل هنرمندان</a>
          <a href="/admin" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">پنل ادمین</a>
          <div className="w-px h-5 bg-slate-200"></div>
          <CartIcon />
        </nav>
      </div>
    </header>
  );
}

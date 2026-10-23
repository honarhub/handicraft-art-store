'use client';

import React from 'react';
import CartIcon from './CartIcon';
import WishlistIcon from './WishlistIcon';
import CategoriesMegaMenu from './CategoriesMegaMenu';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 w-full z-50 glass-panel transition-all duration-300" dir="rtl">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-4 sm:px-6 md:px-12">
        {/* منوی دسته‌بندی‌ها در کنار لوگوی هنرهاب */}
        <div className="flex items-center gap-2 sm:gap-4">
          <CategoriesMegaMenu />

          <a
            href="/"
            className="text-2xl md:text-3xl font-black tracking-tight flex items-center select-none"
            dir="rtl"
          >
            <span className="text-slate-900">هنر</span>
            <span className="bg-[#FF9900] text-black px-2 py-0.5 rounded-md mr-1 text-xl md:text-2xl font-black shadow-sm">
              هاب
            </span>
          </a>
        </div>

        {/* ناوبری اصلی و دکمه‌های کنترلی سمت چپ */}
        <div className="flex items-center gap-3 md:gap-5">
          <nav className="hidden lg:flex gap-6 xl:gap-8 text-sm font-bold text-slate-600 items-center">
            <a href="/products" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">
              گالری آثار
            </a>
            <a href="/blog" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">
              وبلاگ
            </a>
            <a href="/about" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">
              درباره ما
            </a>
            <a href="/artist-panel/login" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">
              پنل هنرمندان
            </a>
            <a href="/admin" className="hover:text-emerald-600 transition-all hover:-translate-y-0.5">
              پنل ادمین
            </a>
          </nav>

          <div className="hidden lg:block w-px h-5 bg-slate-200"></div>

          {/* اکشن‌ها: علاقه‌مندی‌ها، سبد خرید، ورود/ثبت‌نام */}
          <div className="flex items-center gap-2 sm:gap-3">
            <WishlistIcon />
            <CartIcon />

            <a
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-all hover:text-emerald-700"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>ورود / ثبت‌نام</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

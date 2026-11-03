'use client';

import React from 'react';
import CartIcon from './CartIcon';
import WishlistIcon from './WishlistIcon';
import CategoriesMegaMenu from './CategoriesMegaMenu';
import UserNavDropdown from './UserNavDropdown';

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
            <span className="text-black">هنر</span>
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

          {/* اکشن‌ها: علاقه‌مندی‌ها، سبد خرید، پروفایل کاربری / ورود */}
          <div className="flex items-center gap-2 sm:gap-3">
            <WishlistIcon />
            <CartIcon />
            <UserNavDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}

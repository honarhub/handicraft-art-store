import React from 'react';
import Link from 'next/link';
import { getPersianVersion } from '@/lib/version';

export default function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-12 pb-10 sm:py-16 px-5 sm:px-8 md:px-12 border-t border-emerald-900/40 relative overflow-hidden" dir="rtl">
      {/* Subtle emerald ambient glow in footer */}
      <div className="absolute bottom-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none -z-0" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* Main Grid: Responsive 2-column on mobile, 4-column on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3 sm:space-y-4">
            <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tight inline-flex items-center" dir="rtl">
              <span className="text-white">هنر</span>
              <span className="bg-[#FF9900] text-black px-2 py-0.5 rounded-md mr-1.5 text-xl sm:text-2xl font-black shadow-sm">هاب</span>
            </Link>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
              بستری تخصصی و امن برای هنرمندان اصیل ایرانی تا آثار دست‌ساز و بی‌بدیل خود را بدون واسطه به دست علاقه‌مندان به هنر برسانند.
            </p>
            {/* Quick Support Badge */}
            <div className="pt-1">
              <Link 
                href="/support"
                className="inline-flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>پشتیبانی هنرهاب: همراه هنرمندان و خریداران</span>
              </Link>
            </div>
          </div>

          {/* Links Section: 2 Columns on Mobile for clean space economy */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:contents">
            {/* Column 1: Quick Access */}
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm mb-4 tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>دسترسی سریع</span>
              </h4>
              <ul className="space-y-2.5 sm:space-y-3.5 font-medium text-xs sm:text-sm">
                <li><Link href="/products" className="hover:text-emerald-400 transition-colors">گالری آثار</Link></li>
                <li><Link href="/blog" className="hover:text-emerald-400 transition-colors">مجله هنرهاب</Link></li>
                <li><Link href="/artist-panel/login" className="hover:text-emerald-400 transition-colors">ورود هنرمندان</Link></li>
                <li><Link href="/about" className="hover:text-emerald-400 transition-colors">درباره ما</Link></li>
              </ul>
            </div>

            {/* Column 2: Customer Service */}
            <div>
              <h4 className="text-white font-bold text-xs sm:text-sm mb-4 tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>خدمات مشتریان</span>
              </h4>
              <ul className="space-y-2.5 sm:space-y-3.5 font-medium text-xs sm:text-sm">
                <li><Link href="/support" className="hover:text-emerald-400 transition-colors">ارتباط با پشتیبانی</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">قوانین و مقررات</Link></li>
                <li><Link href="/admin/login" className="hover:text-emerald-400 transition-colors">ورود مدیران</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Clean on mobile, side-by-side on desktop */}
        <div className="pt-6 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] sm:text-xs font-medium text-slate-500 text-center md:text-right">
          <p>© {new Date().getFullYear()} پلتفرم اختصاصی هنرهاب. تمامی حقوق محفوظ است.</p>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">نسخه {getPersianVersion()} • توسعه یافته با ❤️ برای هنر ایران زمین</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

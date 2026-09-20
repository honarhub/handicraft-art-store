import React from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />
      <main className="flex-1 w-full flex flex-col items-center justify-center text-center px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-6">درباره هنرآفرین</h1>
      <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
        هنرآفرین بستری است برای پیوند بی‌واسطه هنرمندان اصیل ایرانی با دوست‌داران هنر. 
        هدف ما حفظ ارزش‌های هنری و حمایت از خالقان آثار دستی است.
      </p>
      <a href="/" className="mt-8 text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
        بازگشت به صفحه اصلی
      </a>
      </main>
      <SiteFooter />
    </div>
  );
}

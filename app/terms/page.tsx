import React from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />
      <main className="flex-1 w-full flex flex-col items-center justify-center text-center px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-6">قوانین و مقررات</h1>
      <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
        تمامی آثار ارائه شده در هنرهاب دارای تضمین اصالت کالا می‌باشند. خرید و فروش در این پلتفرم تابع قوانین تجارت الکترونیک جمهوری اسلامی ایران است.
      </p>
      <a href="/" className="mt-8 text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
        بازگشت به صفحه اصلی
      </a>
      </main>
      <SiteFooter />
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col font-sans" dir="rtl">
      <SiteHeader />
      
      <main className="flex-1 w-full flex items-center justify-center bg-slate-50 py-24 px-4">
        <div className="text-center max-w-lg w-full bg-white p-12 rounded-3xl shadow-sm border border-slate-200">
          <div className="text-9xl mb-6">🏜️</div>
          <h1 className="text-4xl font-black text-slate-800 mb-4">صفحه پیدا نشد</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا به آدرس دیگری منتقل شده است.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-200"
            >
              بازگشت به خانه
            </Link>
            <Link 
              href="/products"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-bold transition-colors"
            >
              گالری آثار
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

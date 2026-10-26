'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-800" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">اختلال در بارگذاری صفحه</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          متأسفانه در دریافت اطلاعات سرور مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
          >
            تلاش مجدد
          </button>
          <a
            href="/"
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
          >
            صفحه اصلی
          </a>
        </div>
      </div>
    </div>
  );
}

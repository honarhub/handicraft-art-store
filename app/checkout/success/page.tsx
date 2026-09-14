'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('orderId');
    if (id) setOrderId(id);
  }, [searchParams]);

  return (
    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-emerald-900/5 text-center max-w-lg w-full relative overflow-hidden">
      {/* Confetti effect background simple simulation */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0iIzEwYjk4MSIvPjwvc3ZnPg==')]"></div>

      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 animate-in zoom-in duration-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      
      <h1 className="text-3xl font-black text-slate-800 mb-2">پرداخت موفقیت آمیز بود!</h1>
      <p className="text-slate-500 mb-8">سفارش شما با موفقیت ثبت شد و به زودی توسط هنرمند پردازش می‌شود.</p>
      
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8 text-right">
        <div className="text-sm text-slate-500 mb-1">کد پیگیری سفارش شما:</div>
        <div className="text-2xl font-mono font-black text-slate-800 tracking-wider text-center py-2 bg-white rounded-xl border border-slate-200 shadow-sm">{orderId || 'ORD-987654'}</div>
        <div className="text-xs text-center text-slate-400 mt-3">لطفاً این کد را برای پیگیری‌های بعدی یادداشت کنید.</div>
      </div>

      <div className="flex flex-col gap-3">
        <a href="/products" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-slate-900/20">
          بازگشت به گالری و ادامه خرید
        </a>
        <a href="/" className="w-full bg-white hover:bg-slate-50 text-slate-600 font-bold py-4 rounded-xl transition-colors border border-slate-200">
          بازگشت به صفحه اصلی
        </a>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans" dir="rtl">
      <Suspense fallback={<div className="text-slate-500 font-bold">در حال پردازش...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}

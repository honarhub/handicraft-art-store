'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.order) setOrder(data.order);
      })
      .catch((err) => console.error('Fetch order detail error:', err))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl shadow-emerald-900/5 text-center max-w-xl w-full relative overflow-hidden border border-slate-200">
      {/* Confetti effect background simple simulation */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0iIzEwYjk4MSIvPjwvc3ZnPg==')]"></div>

      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10 animate-in zoom-in duration-500 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">پرداخت با موفقیت انجام شد!</h1>
      <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
        سفارش شما در سیستم ثبت گردید و جهت آغاز فرآیند ساخت و بسته‌بندی به هنرمندان مربوطه ابلاغ شد.
      </p>

      {/* Transaction Details Card */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-6 text-right space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
          <span className="text-slate-500">شماره سفارش:</span>
          <span className="font-mono font-black text-slate-800 text-sm">
            {order?.orderNumber || orderId || 'ORD-987654'}
          </span>
        </div>

        {order?.paymentRefId && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
            <span className="text-slate-500">کد رهگیری بانکی (RRN):</span>
            <span className="font-mono font-bold text-teal-700">
              {order.paymentRefId}
            </span>
          </div>
        )}

        {order?.paidAt && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
            <span className="text-slate-500">زمان پرداخت:</span>
            <span className="font-medium text-slate-700">
              {formatPersianDateTime(order.paidAt)}
            </span>
          </div>
        )}

        {order?.total && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">مبلغ پرداخت شده:</span>
            <span className="font-black text-slate-900 text-sm">
              {toPersianDigits(order.total.toLocaleString())} تومان
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5">
        {orderId && (
          <Link
            href={`/checkout/invoice/${orderId}`}
            target="_blank"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-700/20 text-xs flex items-center justify-center gap-2"
          >
            <span>📄</span>
            <span>مشاهده و چاپ فاکتور رسمی خرید</span>
          </Link>
        )}

        <Link
          href="/panel/orders"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors text-xs flex items-center justify-center gap-2"
        >
          <span>📦</span>
          <span>پیگیری وضعیت مرسوله در پنل کاربری</span>
        </Link>

        <Link
          href="/products"
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-colors border border-slate-300 text-xs"
        >
          بازگشت به گالری آثار
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />
      <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={<div className="text-slate-500 font-bold">در حال بارگذاری اطلاعات پرداخت...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

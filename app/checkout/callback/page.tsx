'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { removeItemsFromCart } = useCart();

  const orderId = searchParams.get('orderId');
  const authority = searchParams.get('authority');
  const trackingCode = searchParams.get('tracking_code') || searchParams.get('trackingCode');
  const statusParam = searchParams.get('status');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      // If user cancelled
      if (statusParam === 'CANCELLED' || statusParam === 'FAILED') {
        setError('پرداخت توسط شما لغو گردید یا با خطا مواجه شد.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId || undefined,
            authority: authority || undefined,
            trackingCode: trackingCode || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'تایید تراکنش در درگاه پرداخت با خطا مواجه شد.');
        }

        // Successfully paid! Remove ONLY the paid items from cart
        if (Array.isArray(data.paidProductIds) && data.paidProductIds.length > 0) {
          removeItemsFromCart(data.paidProductIds);
        }

        // Redirect to success screen
        router.push(`/checkout/success?orderId=${data.orderId}`);
      } catch (err: any) {
        console.error('Callback verify error:', err);
        setError(err.message || 'خطا در اعتبارسنجی پرداخت.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [orderId, authority, trackingCode, statusParam, removeItemsFromCart, router]);

  return (
    <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center border border-slate-200">
      {loading ? (
        <div className="space-y-4">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-black text-slate-800">
            در حال تایید نهایی پرداخت از درگاه هنرهاب پی...
          </h2>
          <p className="text-xs text-slate-500">
            لطفاً چند لحظه شکیبا باشید و صفحه را نبندید.
          </p>
        </div>
      ) : error ? (
        <div className="space-y-5">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            ✕
          </div>
          <h2 className="text-xl font-black text-slate-900">
            پرداخت ناموفق بود
          </h2>
          <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3.5 rounded-2xl border border-rose-200 leading-relaxed">
            {error}
          </p>
          {trackingCode && (
            <div className="text-xs text-slate-500 font-mono">
              کد پیگیری تراکنش: <span className="font-bold text-slate-800">{trackingCode}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <Link
              href="/checkout"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition"
            >
              تلاش مجدد برای پرداخت
            </Link>
            <Link
              href="/cart"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition"
            >
              بازگشت به سبد خرید
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={<div className="text-xs text-slate-500">در حال آماده‌سازی...</div>}>
          <CallbackContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';

interface OrderItem {
  id: string;
  quantity: number;
  priceAtTime: number;
  itemStatus?: string;
  postalTrackingCode?: string;
  product: {
    id: string;
    title: string;
    imageUrl?: string;
    artist?: {
      id: string;
      brandName?: string;
      user?: { name?: string };
    };
  };
}

interface OrderDetail {
  id: string;
  orderNumber: string | null;
  invoiceNumber: string | null;
  createdAt: string;
  paidAt: string | null;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  isTest: boolean;
  total: number;
  subtotal: number | null;
  paymentMethod: string | null;
  paymentRefId: string | null;
  recipientName: string | null;
  phoneNumber: string | null;
  province: string | null;
  city: string | null;
  shippingAddress: string | null;
  postalCode: string | null;
  postalTrackingCode: string | null;
  items: OrderItem[];
}

const ORDER_STEPS = [
  { key: 'PENDING', title: 'ثبت اولیه', desc: 'در انتظار تایید پرداخت' },
  { key: 'PAID', title: 'پرداخت موفق', desc: 'تایید مالی و ابلاغ به هنرمند' },
  { key: 'PROCESSING', title: 'آماده‌سازی اثر', desc: 'در حال ساخت و بسته‌بندی' },
  { key: 'SHIPPED', title: 'ارسال با پست', desc: 'تحویل به باجه پست پیشتاز' },
  { key: 'DELIVERED', title: 'تحویل شده', desc: 'دریافت موفق توسط مشتری' },
];

export default function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${resolvedParams.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('سفارش یافت نشد.');
        return res.json();
      })
      .then((data) => {
        if (data?.order) setOrder(data.order);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center font-bold text-slate-500">
        در حال بارگذاری جزئیات سفارش...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-black text-slate-800">سفارش مورد نظر یافت نشد</h2>
        <p className="text-xs text-slate-500">{error || 'اطلاعات در دسترس نیست.'}</p>
        <Link href="/panel/orders" className="inline-block bg-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl">
          بازگشت به فهرست سفارش‌ها
        </Link>
      </div>
    );
  }

  // Calculate current active step index
  const statusStepMap: Record<string, number> = {
    PENDING: 0,
    PAID: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    CANCELLED: -1,
  };
  const activeStepIdx = statusStepMap[order.status] ?? 1;
  const isCancelled = order.status === 'CANCELLED';
  const isPending = order.status === 'PENDING';
  const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
  const isExpired = isPending && elapsedMs >= 15 * 60 * 1000;
  const remainingMinutes = Math.max(0, Math.ceil((15 * 60 * 1000 - elapsedMs) / 60000));

  return (
    <div className="space-y-6 font-sans text-slate-800" dir="rtl">
      {/* Top Breadcrumb & Actions */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/panel/orders" className="hover:text-teal-700 transition-colors font-medium">
              سفارش‌های من
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-800">جزئیات سفارش #{order.orderNumber || order.id.slice(-6).toUpperCase()}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900">
            پیگیری سفارش شماره <span className="font-mono">{order.orderNumber || order.id.slice(-6).toUpperCase()}</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isCancelled && (
            <Link
              href={`/checkout/invoice/${order.id}`}
              target="_blank"
              className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span>📄</span>
              <span>مشاهده فاکتور رسمی</span>
            </Link>
          )}
          <Link
            href="/panel/orders"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            بازگشت
          </Link>
        </div>
      </div>

      {/* Visual Stepper Timeline & Status Message */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <span>📍</span>
          <span>وضعیت لحظه‌ای و مراحل پردازش سفارش</span>
        </h2>

        {isCancelled ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-xs font-bold flex items-center gap-2">
            <span>❌</span>
            <span>این سفارش لغو گردیده است.</span>
          </div>
        ) : isExpired ? (
          <div className="bg-slate-100 border border-rose-200 rounded-2xl p-4 text-rose-800 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>مهلت پرداخت این سفارش به پایان رسیده و منقضی شده است.</span>
          </div>
        ) : isPending ? (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span>⏳</span>
              <span>این سفارش در انتظار پرداخت شماست ({toPersianDigits(remainingMinutes)} دقیقه زمان باقی‌مانده).</span>
            </div>
            <a
              href={`/api/orders/${order.id}/pay`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs transition shadow-sm"
            >
              💳 ورود به درگاه و تکمیل پرداخت
            </a>
          </div>
        ) : (
          <div className="relative pt-2">
            {/* Desktop / Tablet Stepper */}
            <div className="grid grid-cols-5 gap-2 relative z-10 text-center">
              {ORDER_STEPS.map((step, idx) => {
                const isPassed = idx < activeStepIdx;
                const isCurrent = idx === activeStepIdx;

                let circleClass = 'bg-slate-100 text-slate-400 border-slate-200';
                if (isPassed) {
                  circleClass = 'bg-emerald-600 text-white border-emerald-600';
                } else if (isCurrent) {
                  circleClass = 'bg-teal-700 text-white border-teal-700 ring-4 ring-teal-100 animate-pulse';
                }

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs mb-2 transition-all ${circleClass}`}>
                      {isPassed ? '✓' : toPersianDigits(idx + 1)}
                    </div>
                    <div className={`text-xs font-black ${isCurrent ? 'text-teal-800' : isPassed ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {step.title}
                    </div>
                    <div className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Connecting Line */}
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (activeStepIdx / (ORDER_STEPS.length - 1)) * 100))}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Postal Tracking Box (If Shipped) */}
      {order.postalTrackingCode && (
        <div className="bg-linear-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-6 shadow-md border border-purple-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-purple-200 text-xs font-bold">
                <span>📮</span>
                <span>مرسوله شما تحویل شرکت ملی پست گردیده است</span>
              </div>
              <div className="text-xs text-purple-100">
                کد رهگیری پستی ۲۴ رقمی مرسوله:
              </div>
              <div className="font-mono text-xl sm:text-2xl font-black tracking-widest text-amber-300 py-1">
                {order.postalTrackingCode}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => handleCopyTracking(order.postalTrackingCode!)}
                className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{copied ? 'کپی شد ✓' : 'کپی کد رهگیری'}</span>
              </button>

              <a
                href={`https://tracking.post.ir/?id=${order.postalTrackingCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>پیگیری در سامانه پست</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Order Items Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <span>🛍️</span>
          <span>اقلام خریداری‌شده در این سفارش ({toPersianDigits(order.items.length)} اثر)</span>
        </h2>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => {
            const artist = item.product?.artist;
            const artistName = artist?.brandName || artist?.user?.name || 'هنرمند عضو هنرهاب';

            return (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Link
                    href={`/product/${item.product?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200 group block cursor-pointer"
                    title="مشاهده اثر در تب جداگانه"
                  >
                    {item.product?.imageUrl && (
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </Link>
                  <div>
                    <Link
                      href={`/product/${item.product?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-sm text-slate-800 hover:text-teal-700 transition-colors line-clamp-1 inline-flex items-center gap-1"
                      title="مشاهده اثر در تب جداگانه"
                    >
                      <span>{item.product?.title || 'اثر هنری'}</span>
                      <span className="text-[10px] text-slate-400">↗</span>
                    </Link>
                    <div className="text-xs text-slate-500 mt-1">
                      آفریننده: <span className="font-bold text-teal-800">{artistName}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      تعداد: <span className="font-bold">{toPersianDigits(item.quantity)} عدد</span>
                      {' • '}
                      قیمت واحد: <span className="font-mono">{toPersianDigits(item.priceAtTime.toLocaleString())} تومان</span>
                    </div>
                  </div>
                </div>

                <div className="text-left font-black text-sm text-slate-900 shrink-0 self-end sm:self-auto">
                  {toPersianDigits((item.priceAtTime * item.quantity).toLocaleString())} تومان
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recipient & Shipping Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recipient Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span>👤</span>
            <span>اطلاعات گیرنده و آدرس تحویل</span>
          </h3>
          <div className="text-xs space-y-2">
            <div>
              <span className="text-slate-400">تحویل‌گیرنده: </span>
              <span className="font-bold text-slate-800">{order.recipientName || 'ثبت نشده'}</span>
            </div>
            <div>
              <span className="text-slate-400">شماره تماس: </span>
              <span className="font-mono font-bold text-slate-800">{order.phoneNumber || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400">استان و شهر: </span>
              <span className="font-medium text-slate-800">{order.province || ''} - {order.city || ''}</span>
            </div>
            <div>
              <span className="text-slate-400">نشانی پستی دقیق: </span>
              <span className="text-slate-700 leading-relaxed">{order.shippingAddress || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400">کد پستی ۱۰ رقمی: </span>
              <span className="font-mono font-bold text-slate-800">{order.postalCode || '—'}</span>
            </div>
          </div>
        </div>

        {/* Financial & Payment Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span>💳</span>
            <span>اطلاعات پرداخت بانکی</span>
          </h3>
          <div className="text-xs space-y-2">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">روش پرداخت:</span>
              <span className="font-bold text-slate-800">درگاه پرداخت الکترونیک شتاب</span>
            </div>
            {order.paymentRefId && (
              <div className="flex justify-between py-1">
                <span className="text-slate-400">کد مرجع تراکنش (RRN):</span>
                <span className="font-mono font-bold text-teal-800">{order.paymentRefId}</span>
              </div>
            )}
            {order.paidAt && (
              <div className="flex justify-between py-1">
                <span className="text-slate-400">تاریخ و زمان پرداخت:</span>
                <span className="font-medium text-slate-700">{formatPersianDateTime(order.paidAt)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t border-slate-100 text-sm font-black">
              <span>مبلغ پرداختی:</span>
              <span className="font-mono text-teal-800">{toPersianDigits(order.total.toLocaleString())} تومان</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

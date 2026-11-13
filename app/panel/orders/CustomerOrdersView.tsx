'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';
import DeleteTestOrderButton from './DeleteTestOrderButton';

export interface OrderItemData {
  id: string;
  productId: string;
  quantity: number;
  priceAtTime: number;
  product?: {
    id: string;
    title: string;
    imageUrl?: string | null;
    artist?: {
      id: string;
      brandName?: string | null;
      user?: { name?: string | null } | null;
    } | null;
  } | null;
}

export interface PaymentLogData {
  id: string;
  status: string;
  authority?: string | null;
  trackingCode?: string | null;
  createdAt: string;
}

export interface OrderData {
  id: string;
  orderNumber: string | null;
  status: string;
  total: number;
  isTest: boolean;
  paidAt?: string | null;
  createdAt: string;
  items: OrderItemData[];
  paymentLogs?: PaymentLogData[];
}

interface Props {
  initialOrders: OrderData[];
  gatewayBaseUrl?: string;
}

const EXPIRY_MINUTES = 15;

export default function CustomerOrdersView({ initialOrders, gatewayBaseUrl }: Props) {
  const [activeTab, setActiveTab] = useState<'confirmed' | 'incomplete'>('confirmed');

  // Compute resolved status for each order
  const ordersWithMeta = initialOrders.map((order) => {
    const latestLog = order.paymentLogs?.[0];
    let effectiveStatus = order.status;

    // 1. If DB or log says PAID, consider PAID
    if (order.status === 'PAID' || order.paidAt || latestLog?.status === 'PAID') {
      effectiveStatus = 'PAID';
    } else if (order.status === 'CANCELLED' || latestLog?.status === 'CANCELLED') {
      // 2. If DB or log says CANCELLED, consider CANCELLED
      effectiveStatus = 'CANCELLED';
    }

    // 3. Expiry calculation for PENDING orders
    const refTime = new Date(latestLog?.createdAt || order.createdAt).getTime();
    const elapsedMs = Date.now() - refTime;
    const isExpired = elapsedMs >= EXPIRY_MINUTES * 60 * 1000 || latestLog?.status === 'EXPIRED';
    const remainingMinutes = Math.max(0, Math.ceil((EXPIRY_MINUTES * 60 * 1000 - elapsedMs) / 60000));

    // Determine payment URL
    let payUrl = `/checkout/payment-gateway?orderId=${order.id}`;
    if (latestLog?.authority && gatewayBaseUrl) {
      payUrl = `${gatewayBaseUrl}/pay/${latestLog.authority}`;
    }

    return {
      ...order,
      effectiveStatus,
      isExpired,
      remainingMinutes,
      payUrl,
    };
  });

  // Separate into Confirmed and Incomplete
  const confirmedOrders = ordersWithMeta.filter((o) =>
    ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.effectiveStatus)
  );

  const incompleteOrders = ordersWithMeta.filter(
    (o) => !['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.effectiveStatus)
  );

  const displayedOrders = activeTab === 'confirmed' ? confirmedOrders : incompleteOrders;

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📦</span>
            <span>سفارش‌های من</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            پیگیری مراحل آماده‌سازی، ارسال و سابقه خریدهای شما در هنرهاب
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
            کل سفارش‌ها: {toPersianDigits(initialOrders.length)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('confirmed')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'confirmed'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>✓</span>
          <span>سفارش‌های تایید شده</span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'confirmed'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {toPersianDigits(confirmedOrders.length)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('incomplete')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'incomplete'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>⏳</span>
          <span>سفارش‌های ناتمام</span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'incomplete'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {toPersianDigits(incompleteOrders.length)}
          </span>
        </button>
      </div>

      {/* Orders List */}
      {displayedOrders.length > 0 ? (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const isPending = order.effectiveStatus === 'PENDING';
            const isCancelled = order.effectiveStatus === 'CANCELLED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Order Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-black text-sm text-slate-900">
                      سفارش #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                    </span>
                    {order.isTest && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                        🧪 آزمایشی
                      </span>
                    )}
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {formatPersianDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {/* Status Badge */}
                    {isCancelled ? (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1.5">
                        <span>✕</span>
                        <span>لغو شده</span>
                      </span>
                    ) : isPending ? (
                      order.isExpired ? (
                        <span className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-slate-100 text-rose-700 border-rose-200 flex items-center gap-1.5">
                          <span>⚠️</span>
                          <span>منقضی شده (پایان مهلت پرداخت)</span>
                        </span>
                      ) : (
                        <a
                          href={order.payUrl}
                          className="text-xs font-bold px-3.5 py-1.5 rounded-xl border bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs flex items-center gap-1.5 transition-all animate-pulse"
                          title="برای اتصال به درگاه پرداخت و نهایی‌سازی سفارش کلیک کنید"
                        >
                          <span>💳</span>
                          <span>در انتظار پرداخت</span>
                          <span className="text-[11px] font-mono bg-amber-200/80 px-1.5 py-0.5 rounded-md">
                            {toPersianDigits(order.remainingMinutes)} دقیقه مانده
                          </span>
                          <span className="text-amber-700 font-black">← پرداخت</span>
                        </a>
                      )
                    ) : order.effectiveStatus === 'PAID' ? (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1.5">
                        <span>✓</span>
                        <span>پرداخت شده / تایید سفارش</span>
                      </span>
                    ) : order.effectiveStatus === 'PROCESSING' ? (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-teal-50 text-teal-700 border-teal-200 flex items-center gap-1.5">
                        <span>🔨</span>
                        <span>در حال ساخت و آماده‌سازی توسط هنرمند</span>
                      </span>
                    ) : order.effectiveStatus === 'SHIPPED' ? (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1.5">
                        <span>📮</span>
                        <span>ارسال شده با پست پیشتاز</span>
                      </span>
                    ) : order.effectiveStatus === 'DELIVERED' ? (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
                        <span>✓</span>
                        <span>تحویل داده شده</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-slate-100 text-slate-700 border-slate-200">
                        {order.effectiveStatus}
                      </span>
                    )}

                    {order.isTest && (
                      <DeleteTestOrderButton orderId={order.id} />
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-100">
                  {order.items.map((item) => {
                    const artistName =
                      item.product?.artist?.brandName ||
                      item.product?.artist?.user?.name ||
                      'هنرمند';
                    return (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <Link
                            href={`/product/${item.productId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 relative shrink-0 border border-slate-200 group block cursor-pointer"
                            title="مشاهده اثر در تب جداگانه"
                          >
                            {item.product?.imageUrl && (
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.title || 'اثر هنری'}
                                fill
                                sizes="56px"
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                          </Link>
                          <div>
                            <Link
                              href={`/product/${item.productId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-xs sm:text-sm text-slate-800 hover:text-teal-700 transition-colors line-clamp-1 inline-flex items-center gap-1"
                              title="مشاهده اثر در تب جداگانه"
                            >
                              <span>{item.product?.title || 'اثر هنری'}</span>
                              <span className="text-[10px] text-slate-400">↗</span>
                            </Link>
                            <div className="text-[11px] text-slate-500 mt-1">
                              آفریننده: <span className="font-bold text-teal-800">{artistName}</span> • تعداد: {toPersianDigits(item.quantity)}
                            </div>
                          </div>
                        </div>

                        <div className="text-left font-black text-xs sm:text-sm text-slate-900 shrink-0">
                          {toPersianDigits((item.priceAtTime * item.quantity).toLocaleString())} تومان
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Footer Total & Actions */}
                <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">
                      مبلغ کل سفارش:
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {toPersianDigits(order.total.toLocaleString())} تومان
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* If pending and active, provide direct payment button */}
                    {isPending && !order.isExpired && (
                      <a
                        href={order.payUrl}
                        className="flex-1 sm:flex-none text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm"
                      >
                        💳 تکمیل پرداخت بانکی
                      </a>
                    )}

                    <Link
                      href={`/panel/orders/${order.id}`}
                      className="flex-1 sm:flex-none text-center bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                    >
                      پیگیری و جزئیات
                    </Link>

                    {/* Invoice only for paid/confirmed orders */}
                    {order.effectiveStatus !== 'CANCELLED' && (
                      <Link
                        href={`/checkout/invoice/${order.id}`}
                        target="_blank"
                        className="text-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
                        title="مشاهده فاکتور رسمی"
                      >
                        📄 فاکتور
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center text-3xl">
            {activeTab === 'confirmed' ? '🛍️' : '⏳'}
          </div>
          <h3 className="font-black text-slate-800 text-base">
            {activeTab === 'confirmed'
              ? 'هیچ سفارش تاییدشده‌ای یافت نشد.'
              : 'هیچ سفارش ناتمامی وجود ندارد.'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {activeTab === 'confirmed'
              ? 'با خرید آثار اصیل، از دست‌های سازنده هنرمندان ایرانی پشتیبانی کنید.'
              : 'تمام سفارش‌های قبلی شما با موفقیت تسویه یا تکمیل شده‌اند.'}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-sm transition-colors"
          >
            <span>مشاهده گالری آثار هنرهاب</span>
          </Link>
        </div>
      )}
    </div>
  );
}

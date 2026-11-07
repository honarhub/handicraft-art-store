'use client';

import React, { useEffect, useState, use } from 'react';
import { toPersianDigits, formatPersianDate, formatPersianDateTime } from '@/lib/date';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  priceAtTime: number;
  product: {
    id: string;
    title: string;
    imageUrl?: string;
    artist?: {
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
  status: string;
  isTest: boolean;
  total: number;
  subtotal: number | null;
  shippingCost: number | null;
  discountAmount: number | null;
  paymentMethod: string | null;
  paymentRefId: string | null;
  paymentCardMask: string | null;
  recipientName: string | null;
  phoneNumber: string | null;
  province: string | null;
  city: string | null;
  shippingAddress: string | null;
  postalCode: string | null;
  user?: {
    name: string | null;
    phoneNumber: string | null;
    email: string | null;
  };
  items: OrderItem[];
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${resolvedParams.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('فاکتور یا سفارش یافت نشد.');
        return res.json();
      })
      .then((data) => {
        if (data?.order) setOrder(data.order);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="text-center font-bold text-slate-600">در حال دریافت و صدور فاکتور رسمی...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans" dir="rtl">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md w-full shadow-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-black text-slate-800 mb-2">عدم دسترسی به فاکتور</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'فاکتور سفارش مورد نظر یافت نشد.'}</p>
          <Link href="/panel/orders" className="bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs">
            بازگشت به سفارش‌ها
          </Link>
        </div>
      </div>
    );
  }

  const invoiceNo = order.invoiceNumber || `HH-1403-${order.id.slice(-6).toUpperCase()}`;
  const buyerName = order.recipientName || order.user?.name || 'مشتری گرامی هنرهاب';
  const buyerPhone = order.phoneNumber || order.user?.phoneNumber || '—';
  const buyerAddress = order.shippingAddress ? `${order.province || ''}، ${order.city || ''}، ${order.shippingAddress}` : 'ثبت نشده';

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-3 sm:px-6 font-sans text-slate-800" dir="rtl">
      {/* Print Controls (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/panel/orders"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
          >
            <span>←</span>
            <span>بازگشت به سفارش‌ها</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500">
            فاکتور رسمی فروش شماره <span className="font-mono font-bold text-slate-800">{invoiceNo}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>چاپ / ذخیره PDF فاکتور</span>
        </button>
      </div>

      {/* Main A4 Invoice Container */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-lg invoice-paper text-slate-800">
        {/* Invoice Top Header */}
        <div className="border-b-2 border-slate-800 pb-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-black text-xl shadow-inner">
                هنر
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  صورتحساب الکترونیکی فروش کالا و خدمات
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  بازارگاه صنایع دستی و هنرهای اصیل ایرانی هنرهاب (HonarHub)
                </p>
              </div>
            </div>

            <div className="text-right sm:text-left space-y-1 text-xs">
              <div>
                <span className="text-slate-400">شماره سریال فاکتور: </span>
                <span className="font-mono font-black text-slate-900 text-sm">{invoiceNo}</span>
              </div>
              <div>
                <span className="text-slate-400">شماره سفارش: </span>
                <span className="font-mono font-bold text-slate-800">{order.orderNumber || order.id.slice(-6).toUpperCase()}</span>
              </div>
              <div>
                <span className="text-slate-400">تاریخ صدور: </span>
                <span className="font-medium text-slate-700">{formatPersianDate(order.paidAt || order.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Parties Information (Seller & Buyer) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Seller Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="font-black text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>مشخصات فروشنده (عرضه‌کننده)</span>
              <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-bold">شخص حقوقی</span>
            </div>
            <div><span className="text-slate-400">نام و عنوان: </span><span className="font-bold text-slate-800">پلتفرم صنایع دستی هنرهاب</span></div>
            <div><span className="text-slate-400">شناسه ملی: </span><span className="font-mono font-bold text-slate-800">۱۴۰۰۹۸۷۲۱۶۴</span></div>
            <div><span className="text-slate-400">نشانی: </span><span className="text-slate-700">تهران، میدان آزادی، مرکز نوآوری صنایع خلاق، واحد ۴۰۲</span></div>
            <div className="flex gap-4">
              <div><span className="text-slate-400">تلفن: </span><span className="font-mono font-bold text-slate-800">۰۲۱-۶۶۰۹۸۷۶۵</span></div>
              <div><span className="text-slate-400">کد پستی: </span><span className="font-mono font-bold text-slate-800">۱۴۵۸۸۳۴۹۲۱</span></div>
            </div>
          </div>

          {/* Buyer Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="font-black text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>مشخصات خریدار (گیرنده)</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">مصرف‌کننده نهایی</span>
            </div>
            <div><span className="text-slate-400">نام و نام خانوادگی: </span><span className="font-bold text-slate-800">{buyerName}</span></div>
            <div><span className="text-slate-400">شماره تماس: </span><span className="font-mono font-bold text-slate-800">{buyerPhone}</span></div>
            <div><span className="text-slate-400">نشانی پستی: </span><span className="text-slate-700">{buyerAddress}</span></div>
            <div><span className="text-slate-400">کد پستی: </span><span className="font-mono font-bold text-slate-800">{order.postalCode || '—'}</span></div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800 text-white font-bold">
                <th className="py-2.5 px-3 rounded-r-xl w-12 text-center">ردیف</th>
                <th className="py-2.5 px-3">شرح اثر یا خدمات هنری</th>
                <th className="py-2.5 px-3">آفریننده (هنرمند)</th>
                <th className="py-2.5 px-3 text-center w-16">تعداد</th>
                <th className="py-2.5 px-3 text-left">مبلغ واحد (تومان)</th>
                <th className="py-2.5 px-3 text-left rounded-l-xl">مبلغ کل (تومان)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item, idx) => {
                const artistName = item.product?.artist?.brandName || item.product?.artist?.user?.name || 'هنرمند عضو هنرهاب';
                const lineTotal = item.priceAtTime * item.quantity;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-500">{toPersianDigits(idx + 1)}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{item.product?.title || 'اثر هنری'}</td>
                    <td className="py-3 px-3 text-teal-800 font-medium">{artistName}</td>
                    <td className="py-3 px-3 text-center font-black text-slate-700">{toPersianDigits(item.quantity)}</td>
                    <td className="py-3 px-3 text-left font-mono font-bold text-slate-700">
                      {toPersianDigits(item.priceAtTime.toLocaleString())}
                    </td>
                    <td className="py-3 px-3 text-left font-mono font-black text-slate-900">
                      {toPersianDigits(lineTotal.toLocaleString())}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary and Financial Calculations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-200 mb-8">
          {/* Payment Method Details */}
          <div className="space-y-2 text-xs bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="font-bold text-slate-800 pb-1 border-b border-slate-200 flex items-center justify-between">
              <span>اطلاعات پرداخت و تسویه الکترونیکی</span>
              <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                پرداخت موفق
              </span>
            </div>
            <div>
              <span className="text-slate-400">درگاه پرداخت: </span>
              <span className="font-bold text-slate-700">شبکه پرداخت الکترونیک شاپرک (سپهر / سامان)</span>
            </div>
            {order.paymentRefId && (
              <div>
                <span className="text-slate-400">شماره مرجع بانکی (RRN): </span>
                <span className="font-mono font-bold text-teal-800">{order.paymentRefId}</span>
              </div>
            )}
            {order.paymentCardMask && (
              <div>
                <span className="text-slate-400">شماره کارت پرداخت‌کننده: </span>
                <span className="font-mono font-bold text-slate-700" dir="ltr">{order.paymentCardMask}</span>
              </div>
            )}
            {order.paidAt && (
              <div>
                <span className="text-slate-400">زمان دقیق تراکنش: </span>
                <span className="font-medium text-slate-700">{formatPersianDateTime(order.paidAt)}</span>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 text-slate-600">
              <span>جمع کل اقلام:</span>
              <span className="font-mono font-bold">{toPersianDigits((order.subtotal || order.total).toLocaleString())} تومان</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>هزینه بسته‌بندی و ارسال پستی:</span>
              <span className="font-bold text-emerald-700">رایگان (تخفیف هنرهاب)</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>مالیات بر ارزش افزوده (VAT):</span>
              <span className="font-bold text-slate-700">۰ ریال (معاف قانونی*)</span>
            </div>
            <div className="flex justify-between py-2.5 border-t-2 border-slate-800 text-sm font-black text-slate-900 bg-slate-100 px-3 rounded-xl">
              <span>مبلغ نهایی پرداخت شده:</span>
              <span className="font-mono text-base text-teal-800">{toPersianDigits(order.total.toLocaleString())} تومان</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
              * طبق بند ۱۴ ماده ۹ قانون دائمی مالیات بر ارزش افزوده جمهوری اسلامی ایران، صنایع دستی تولید داخل کشور از پرداخت مالیات بر ارزش افزوده معاف می‌باشند.
            </p>
          </div>
        </div>

        {/* Invoice Footer Seal & Signature */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="text-center sm:text-right space-y-1">
            <div className="font-bold text-slate-700">مهر دیجیتال بازارگاه هنرهاب</div>
            <div className="text-[11px] text-slate-400">این سند مطابق با قوانین تجارت الکترونیک دارای اعتبار رسمی است.</div>
          </div>

          <div className="w-36 h-20 border-2 border-dashed border-teal-600/40 rounded-2xl flex flex-col items-center justify-center p-2 text-teal-800 bg-teal-50/50">
            <span className="text-[10px] font-bold">مهر رسمی ثبت رایانه‌ای</span>
            <span className="font-black text-xs tracking-wider mt-0.5">هنرهاب ایران</span>
            <span className="text-[9px] text-teal-600 font-mono">VERIFIED INVOICE</span>
          </div>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background-color: #ffffff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .invoice-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

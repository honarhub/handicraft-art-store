'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';

interface OrderItem {
  id: string;
  quantity: number;
  priceAtTime: number;
  artistEarnings: number | null;
  platformFee: number | null;
  itemStatus: string | null;
  postalTrackingCode: string | null;
  product: {
    id: string;
    title: string;
    imageUrl?: string | null;
  };
}

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  isTest: boolean;
  createdAt: string;
  recipientName: string | null;
  phoneNumber: string | null;
  province: string | null;
  city: string | null;
  shippingAddress: string | null;
  postalCode: string | null;
  postalTrackingCode: string | null;
  user: {
    name: string | null;
    phoneNumber: string | null;
  };
  items: OrderItem[];
}

export default function ArtistOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Status Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/artist/orders?status=${filter}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load artist orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setPostalCode(order.postalTrackingCode || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setIsUpdating(true);
      const res = await fetch(`/api/artist/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          postalTrackingCode: postalCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'وضعیت سفارش با موفقیت بروزرسانی شد.');
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert(data.error || 'خطا در ثبت وضعیت');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('خطا در برقراری ارتباط با سرور');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING: { label: 'در انتظار پرداخت', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      PAID: { label: 'پرداخت شده / جدید', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      PROCESSING: { label: 'در حال ساخت و آماده‌سازی', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
      SHIPPED: { label: 'ارسال شده با پست پیشتاز', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
      DELIVERED: { label: 'تحویل داده شده', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      CANCELLED: { label: 'لغو شده', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    };
    return map[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  // KPIs
  const stats = {
    total: orders.length,
    paidCount: orders.filter((o) => o.status === 'PAID').length,
    processingCount: orders.filter((o) => o.status === 'PROCESSING').length,
    shippedCount: orders.filter((o) => o.status === 'SHIPPED').length,
    deliveredCount: orders.filter((o) => o.status === 'DELIVERED').length,
  };

  return (
    <div className="space-y-6 font-sans text-slate-800" dir="rtl">
      {/* Top Header */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span>📦</span>
            <span>مدیریت و ارسال سفارش‌های فروش رفته</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            پیگیری خریدهای مشتریان، هماهنگی ساخت آثار و ثبت کد رهگیری پستی مرسولات
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-2xl border border-slate-200 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <span>🔄</span>
          <span>بروزرسانی لیست</span>
        </button>
      </div>

      {/* 4 Pipeline Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50/60 border border-blue-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-blue-700 font-bold mb-1">پرداخت شده (آماده‌سازی)</div>
          <div className="text-2xl font-black text-blue-900 font-mono">{toPersianDigits(stats.paidCount)}</div>
        </div>

        <div className="bg-teal-50/60 border border-teal-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-teal-700 font-bold mb-1">در حال ساخت و بسته‌بندی</div>
          <div className="text-2xl font-black text-teal-900 font-mono">{toPersianDigits(stats.processingCount)}</div>
        </div>

        <div className="bg-purple-50/60 border border-purple-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-purple-700 font-bold mb-1">ارسال شده با پست</div>
          <div className="text-2xl font-black text-purple-900 font-mono">{toPersianDigits(stats.shippedCount)}</div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 p-5 rounded-2xl shadow-xs">
          <div className="text-xs text-emerald-700 font-bold mb-1">تحویل شده به مشتری</div>
          <div className="text-2xl font-black text-emerald-900 font-mono">{toPersianDigits(stats.deliveredCount)}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { key: 'ALL', label: 'همه سفارش‌ها' },
          { key: 'PAID', label: 'پرداخت شده / جدید' },
          { key: 'PROCESSING', label: 'در حال آماده‌سازی' },
          { key: 'SHIPPED', label: 'ارسال شده به پست' },
          { key: 'DELIVERED', label: 'تحویل داده شده' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === t.key
                ? 'bg-teal-700 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-200 shadow-xs">
          در حال بارگذاری سفارش‌ها...
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const totalArtistEarnings = order.items.reduce((sum, it) => sum + (it.artistEarnings || 0), 0);

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4 hover:shadow-md transition-shadow shadow-xs"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-black text-sm text-slate-900">
                      سفارش #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                    </span>
                    {order.isTest && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        🧪 آزمایشی
                      </span>
                    )}
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {formatPersianDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <button
                      onClick={() => handleOpenStatusModal(order)}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span>✏️</span>
                      <span>تغییر وضعیت و ثبت کد پستی</span>
                    </button>
                    <Link
                      href={`/checkout/invoice/${order.id}`}
                      target="_blank"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors border border-slate-200"
                    >
                      📄 فاکتور
                    </Link>
                  </div>
                </div>

                {/* Items & Shipping Address Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Items List (2 columns on lg) */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="text-xs font-bold text-slate-500">آثار فروخته‌شده شما در این سفارش:</div>
                    <div className="divide-y divide-slate-100">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/product/${item.product?.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200 group block cursor-pointer"
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
                                className="font-bold text-xs sm:text-sm text-slate-800 hover:text-teal-700 transition-colors line-clamp-1 inline-flex items-center gap-1"
                                title="مشاهده اثر در تب جداگانه"
                              >
                                <span>{item.product?.title || 'اثر هنری'}</span>
                                <span className="text-[10px] text-slate-400">↗</span>
                              </Link>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                تعداد: <span className="font-bold text-slate-800">{toPersianDigits(item.quantity)} عدد</span>
                                {' • '}
                                قیمت فروش: {toPersianDigits(item.priceAtTime.toLocaleString())} تومان
                              </div>
                            </div>
                          </div>

                          <div className="text-left shrink-0 space-y-0.5">
                            <div className="text-[11px] text-slate-500">سهم خالص شما:</div>
                            <div className="font-mono font-black text-sm text-emerald-700">
                              {toPersianDigits((item.artistEarnings || 0).toLocaleString())} تومان
                            </div>
                            {item.platformFee !== null && item.platformFee !== undefined && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                کارمزد: {toPersianDigits(item.platformFee.toLocaleString())} تومان
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">مجموع سهم واریزی به کیف‌پول شما:</span>
                      <span className="font-mono font-black text-base text-emerald-700">
                        {toPersianDigits(totalArtistEarnings.toLocaleString())} تومان
                      </span>
                    </div>
                  </div>

                  {/* Shipping Address Card */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 text-xs">
                    <div className="font-bold text-slate-700 pb-1.5 border-b border-slate-200 flex items-center gap-1.5">
                      <span>📬</span>
                      <span>مشخصات گیرنده مرسوله جهت ارسال</span>
                    </div>
                    <div>
                      <span className="text-slate-500">گیرنده: </span>
                      <span className="font-bold text-slate-800">{order.recipientName || order.user?.name || 'ثبت نشده'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">شماره تماس: </span>
                      <span className="font-mono font-bold text-slate-800">{order.phoneNumber || order.user?.phoneNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">استان و شهر: </span>
                      <span className="font-medium text-slate-800">{order.province || ''} - {order.city || ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">نشانی پستی: </span>
                      <span className="text-slate-700 leading-relaxed">{order.shippingAddress || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">کد پستی ۱۰ رقمی: </span>
                      <span className="font-mono font-bold text-slate-800">{order.postalCode || '—'}</span>
                    </div>

                    {order.postalTrackingCode && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[11px] text-purple-700 font-bold block mb-0.5">کد رهگیری پستی ثبت‌شده:</span>
                        <span className="font-mono font-bold text-xs text-purple-900 bg-purple-100/60 px-2 py-1 rounded-md block text-center tracking-wider">
                          {order.postalTrackingCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <div className="text-4xl">🎨</div>
          <h3 className="text-base font-black text-slate-800">سفارشی در این وضعیت یافت نشد</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            به محض اینکه مشتری اثری از آثار شما را خریداری کند، سفارش در این بخش نمایش داده خواهد شد.
          </p>
        </div>
      )}

      {/* Status & Postal Tracking Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-800 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                بروزرسانی وضعیت سفارش #{selectedOrder.orderNumber || selectedOrder.id.slice(-6).toUpperCase()}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  وضعیت سفارش:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-teal-600 focus:bg-white font-bold"
                >
                  <option value="PAID">پرداخت شده (آماده‌سازی سفارش)</option>
                  <option value="PROCESSING">در حال ساخت و بسته‌بندی در کارگاه</option>
                  <option value="SHIPPED">تحویل داده شده به باجه پست پیشتاز</option>
                  <option value="DELIVERED">تحویل نهایی شده به مشتری</option>
                  <option value="CANCELLED">لغو شده</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  کد رهگیری پستی مرسوله (۲۴ رقم قبض پست پیشتاز):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="مثال: 184590284719284019283741"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-purple-900 outline-none focus:border-teal-600 focus:bg-white font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  با ثبت این کد، مشتری در پنل خود می‌تواند مرسوله را در سامانه رهگیری شرکت پست رصد کند.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isUpdating ? 'در حال ثبت...' : 'ذخیره و اعلام به خریدار'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-3 rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';
import Link from 'next/link';
import Image from 'next/image';

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
    imageUrl?: string;
  };
}

interface Order {
  id: string;
  orderNumber: string | null;
  createdAt: string;
  paidAt: string | null;
  status: string;
  isTest: boolean;
  total: number;
  recipientName: string | null;
  phoneNumber: string | null;
  province: string | null;
  city: string | null;
  shippingAddress: string | null;
  postalCode: string | null;
  postalTrackingCode: string | null;
  user?: {
    id: string;
    name: string | null;
    phoneNumber: string | null;
  };
  items: OrderItem[];
}

export default function ArtistOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [stats, setStats] = useState({
    totalOrdersCount: 0,
    processingCount: 0,
    shippedCount: 0,
    deliveredCount: 0,
  });

  // Modal state
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
        if (data.stats) setStats(data.stats);
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
          postalTrackingCode: postalCode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert(data.error || 'خطا در بروزرسانی وضعیت');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('خطا در برقراری ارتباط');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING: { label: 'در انتظار پرداخت', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
      PAID: { label: 'پرداخت شده / آماده‌سازی', cls: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
      PROCESSING: { label: 'در حال ساخت و بسته‌بندی', cls: 'bg-teal-500/10 text-teal-300 border-teal-500/30' },
      SHIPPED: { label: 'ارسال شده با پست', cls: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
      DELIVERED: { label: 'تحویل داده شده', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
      CANCELLED: { label: 'لغو شده', cls: 'bg-slate-700 text-slate-300 border-slate-600' },
    };
    return map[status] || { label: status, cls: 'bg-slate-700 text-slate-300 border-slate-600' };
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
            <span>📦</span>
            <span>سفارش‌های دریافتی آثار شما</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مدیریت آثار فروخته‌شده، دریافت مشخصات گیرنده و درج کد رهگیری پستی مرسولات
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span>🔄</span>
          <span>بروزرسانی لیست</span>
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">کل سفارش‌های شما</div>
          <div className="text-2xl font-black text-white">{toPersianDigits(stats.totalOrdersCount)}</div>
        </div>

        <div className="bg-slate-900 border border-teal-900/40 p-5 rounded-2xl">
          <div className="text-xs text-teal-400 font-bold mb-1">در حال ساخت و آماده‌سازی</div>
          <div className="text-2xl font-black text-teal-300">{toPersianDigits(stats.processingCount)}</div>
        </div>

        <div className="bg-slate-900 border border-purple-900/40 p-5 rounded-2xl">
          <div className="text-xs text-purple-400 font-bold mb-1">تحویل به باجه پست</div>
          <div className="text-2xl font-black text-purple-300">{toPersianDigits(stats.shippedCount)}</div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 p-5 rounded-2xl">
          <div className="text-xs text-emerald-400 font-bold mb-1">تحویل شده به مشتری</div>
          <div className="text-2xl font-black text-emerald-300">{toPersianDigits(stats.deliveredCount)}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
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
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold">در حال بارگذاری سفارش‌ها...</div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const totalArtistEarnings = order.items.reduce((sum, it) => sum + (it.artistEarnings || 0), 0);

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 hover:border-slate-700 transition-colors"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-black text-sm text-white">
                      سفارش #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                    </span>
                    {order.isTest && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        🧪 آزمایشی
                      </span>
                    )}
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      {formatPersianDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <button
                      onClick={() => handleOpenStatusModal(order)}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>✏️</span>
                      <span>تغییر وضعیت و ثبت کد پستی</span>
                    </button>
                    <Link
                      href={`/checkout/invoice/${order.id}`}
                      target="_blank"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors"
                    >
                      📄 فاکتور
                    </Link>
                  </div>
                </div>

                {/* Items & Shipping Address Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Items List (2 columns on lg) */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="text-xs font-bold text-slate-400">آثار فروخته‌شده شما:</div>
                    <div className="divide-y divide-slate-800">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden relative shrink-0 border border-slate-700">
                              {item.product?.imageUrl && (
                                <Image
                                  src={item.product.imageUrl}
                                  alt={item.product.title}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-slate-200 line-clamp-1">
                                {item.product?.title || 'اثر هنری'}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                تعداد: <span className="font-bold text-white">{toPersianDigits(item.quantity)} عدد</span>
                                {' • '}
                                قیمت فروش: {toPersianDigits(item.priceAtTime.toLocaleString())} تومان
                              </div>
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <div className="text-xs text-slate-400">سهم خالص شما:</div>
                            <div className="font-mono font-black text-sm text-emerald-400">
                              {toPersianDigits((item.artistEarnings || 0).toLocaleString())} تومان
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold">مجموع سهم واریزی به کیف‌پول شما:</span>
                      <span className="font-mono font-black text-base text-emerald-400">
                        {toPersianDigits(totalArtistEarnings.toLocaleString())} تومان
                      </span>
                    </div>
                  </div>

                  {/* Shipping Address Card */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
                    <div className="font-bold text-slate-300 pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
                      <span>📬</span>
                      <span>مشخصات گیرنده مرسوله جهت ارسال</span>
                    </div>
                    <div>
                      <span className="text-slate-400">گیرنده: </span>
                      <span className="font-bold text-slate-200">{order.recipientName || order.user?.name || 'ثبت نشده'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">تلفن هماهنگی: </span>
                      <a href={`tel:${order.phoneNumber}`} className="font-mono font-bold text-teal-400 hover:underline">
                        {order.phoneNumber || order.user?.phoneNumber || '—'}
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-400">مقصد: </span>
                      <span className="text-slate-300">{order.province} - {order.city}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">آدرس دقیق پستی: </span>
                      <span className="text-slate-300 leading-relaxed">{order.shippingAddress || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">کد پستی ۱۰ رقمی: </span>
                      <span className="font-mono font-bold text-slate-200">{order.postalCode || '—'}</span>
                    </div>

                    {order.postalTrackingCode && (
                      <div className="mt-2 pt-2 border-t border-slate-800">
                        <span className="text-purple-400 block font-bold mb-0.5">کد رهگیری پستی درج شده:</span>
                        <span className="font-mono font-bold text-amber-300 tracking-wider text-xs">
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
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="text-4xl">🎨</div>
          <h3 className="text-base font-black text-white">سفارشی در این وضعیت یافت نشد</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            به محض اینکه مشتری اثری از آثار شما را خریداری کند، سفارش در این بخش نمایش داده خواهد شد.
          </p>
        </div>
      )}

      {/* Status & Postal Tracking Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-base text-white">
                بروزرسانی وضعیت سفارش #{selectedOrder.orderNumber || selectedOrder.id.slice(-6).toUpperCase()}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  وضعیت سفارش:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500"
                >
                  <option value="PAID">پرداخت شده (آماده‌سازی سفارش)</option>
                  <option value="PROCESSING">در حال ساخت و بسته‌بندی در کارگاه</option>
                  <option value="SHIPPED">تحویل داده شده به باجه پست پیشتاز</option>
                  <option value="DELIVERED">تحویل نهایی شده به مشتری</option>
                  <option value="CANCELLED">لغو شده</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  کد رهگیری پستی مرسوله (۲۴ رقم قبض پست پیشتاز):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="مثال: 184590284719284019283741"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-amber-300 outline-none focus:border-teal-500 font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  با ثبت این کد، مشتری در پنل خود می‌تواند مرسوله را در سامانه رهگیری شرکت پست رصد کند.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? 'در حال ثبت...' : 'ذخیره و اعلام به خریدار'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-3 rounded-xl transition-colors cursor-pointer"
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

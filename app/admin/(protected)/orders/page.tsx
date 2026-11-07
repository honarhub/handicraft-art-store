'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toPersianDigits, formatPersianDateTime } from '@/lib/date';
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
      id: string;
      brandName: string;
    };
  };
}

interface Order {
  id: string;
  orderNumber?: string | null;
  total: number;
  status: string;
  isTest: boolean;
  recipientName?: string | null;
  phoneNumber?: string | null;
  postalTrackingCode?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    role: string;
  };
  items: OrderItem[];
}

interface Stats {
  totalOrders: number;
  testOrders: number;
  realOrders: number;
  realRevenue: number;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    testOrders: 0,
    realOrders: 0,
    realRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'test' | 'real'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Status Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders?filter=${filter}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleDeleteOrder = async (orderId: string, isTest: boolean) => {
    const msg = isTest
      ? 'آیا از حذف این سفارش آزمایشی (تستی) اطمینان دارید؟'
      : 'توجه: این یک سفارش واقعی است! آیا از حذف آن مطمئن هستید؟';
    if (!window.confirm(msg)) return;

    try {
      setDeletingId(orderId);
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setStats((prev) => ({
          ...prev,
          totalOrders: Math.max(0, prev.totalOrders - 1),
          testOrders: isTest ? Math.max(0, prev.testOrders - 1) : prev.testOrders,
          realOrders: !isTest ? Math.max(0, prev.realOrders - 1) : prev.realOrders,
        }));
      } else {
        alert(data.error || 'خطا در حذف سفارش');
      }
    } catch {
      alert('خطا در برقراری ارتباط');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDeleteTestOrders = async () => {
    if (stats.testOrders === 0) {
      alert('هیچ سفارش آزمایشی برای حذف وجود ندارد.');
      return;
    }

    const confirmed = window.confirm(
      `هشدار: شما در حال حذف همزمان ${stats.testOrders} سفارش آزمایشی هستید. سفارش‌های واقعی بدون تغییر باقی می‌مانند. آیا ادامه می‌دهید؟`
    );
    if (!confirmed) return;

    try {
      setIsBulkDeleting(true);
      const res = await fetch('/api/admin/orders?allTest=true', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'سفارش‌های آزمایشی پاکسازی شدند.');
        fetchOrders();
      } else {
        alert(data.error || 'خطا در پاکسازی سفارش‌های آزمایشی');
      }
    } catch {
      alert('خطا در برقراری ارتباط');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setPostalCode(order.postalTrackingCode || '');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setIsUpdating(true);
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
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
        alert(data.error || 'خطا در بروزرسانی');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('خطا در برقراری ارتباط');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesId = order.id.toLowerCase().includes(q) || (order.orderNumber && order.orderNumber.toLowerCase().includes(q));
    const matchesUser =
      (order.user?.name && order.user.name.toLowerCase().includes(q)) ||
      (order.recipientName && order.recipientName.toLowerCase().includes(q)) ||
      (order.phoneNumber && order.phoneNumber.includes(q)) ||
      (order.user?.phoneNumber && order.user.phoneNumber.includes(q)) ||
      (order.user?.email && order.user.email.toLowerCase().includes(q));
    return matchesId || matchesUser;
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING: { label: 'در انتظار پرداخت', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      PAID: { label: 'پرداخت شده', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
      PROCESSING: { label: 'در حال آماده‌سازی', cls: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
      SHIPPED: { label: 'ارسال شده به پست', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
      DELIVERED: { label: 'تحویل داده شده', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
      CANCELLED: { label: 'لغو شده', cls: 'bg-slate-700 text-slate-300 border-slate-600' },
    };
    return map[status] || { label: status, cls: 'bg-slate-700 text-slate-300 border-slate-600' };
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span>🛍️</span>
            <span>مدیریت جامع سفارش‌ها</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مشاهده، پیگیری، صدور فاکتور و مدیریت کد رهگیری پستی کلیه مرسولات فروشگاه
          </p>
        </div>

        {stats.testOrders > 0 && (
          <button
            type="button"
            onClick={handleBulkDeleteTestOrders}
            disabled={isBulkDeleting}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>{isBulkDeleting ? 'در حال پاکسازی...' : `پاکسازی کلیه سفارش‌های تستی (${toPersianDigits(stats.testOrders)})`}</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">تعداد کل سفارش‌ها</div>
          <div className="text-2xl font-black text-white">{toPersianDigits(stats.totalOrders)}</div>
        </div>

        <div className="bg-slate-900 border border-purple-900/40 p-5 rounded-2xl">
          <div className="text-xs text-purple-400 font-bold mb-1 flex items-center gap-1.5">
            <span>🧪</span>
            <span>سفارش‌های آزمایشی (تستی)</span>
          </div>
          <div className="text-2xl font-black text-purple-300">{toPersianDigits(stats.testOrders)}</div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 p-5 rounded-2xl">
          <div className="text-xs text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
            <span>📦</span>
            <span>سفارش‌های واقعی</span>
          </div>
          <div className="text-2xl font-black text-emerald-300">{toPersianDigits(stats.realOrders)}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-bold mb-1">درآمد ناخالص حاصل از سفارش‌ها</div>
          <div className="text-xl font-black text-amber-400">
            {toPersianDigits(stats.realRevenue.toLocaleString())} <span className="text-xs font-normal">تومان</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            همه سفارش‌ها ({toPersianDigits(stats.totalOrders)})
          </button>

          <button
            type="button"
            onClick={() => setFilter('test')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filter === 'test'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🧪</span>
            <span>آزمایشی / تستی ({toPersianDigits(stats.testOrders)})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('real')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'real'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            سفارش‌های واقعی ({toPersianDigits(stats.realOrders)})
          </button>
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی کد سفارش، نام، تلفن..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            در حال بارگذاری لیست سفارش‌ها...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            هیچ سفارشی مطابق فیلتر انتخابی یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">شناسه سفارش</th>
                  <th className="p-4">مشتری و گیرنده</th>
                  <th className="p-4">کد رهگیری پستی</th>
                  <th className="p-4">مبلغ کل</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">تاریخ ثبت (ایران)</th>
                  <th className="p-4 text-center">عملیات و فاکتور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => {
                  const status = getStatusBadge(order.status);
                  const displayName = order.recipientName || order.user?.name || 'بی‌نام';
                  const displayPhone = order.phoneNumber || order.user?.phoneNumber || order.user?.email || '—';

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-white">
                          #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                        </div>
                        {order.isTest && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            🧪 تستی
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white">
                          {displayName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                          {toPersianDigits(displayPhone)}
                        </div>
                      </td>

                      <td className="p-4">
                        {order.postalTrackingCode ? (
                          <span className="font-mono text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md text-[11px] tracking-wider block max-w-xs truncate">
                            {order.postalTrackingCode}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">درج نشده</span>
                        )}
                      </td>

                      <td className="p-4 font-bold text-white font-mono">
                        {toPersianDigits(order.total.toLocaleString())} تومان
                      </td>

                      <td className="p-4">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>

                      <td className="p-4 text-slate-400 text-[11px]">
                        {formatPersianDateTime(order.createdAt)}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(order)}
                            title="تغییر وضعیت و ثبت کد پستی"
                            className="bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                          >
                            ✏️ وضعیت
                          </button>

                          <Link
                            href={`/checkout/invoice/${order.id}`}
                            target="_blank"
                            title="مشاهده و چاپ فاکتور رسمی"
                            className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border border-slate-700"
                          >
                            📄 فاکتور
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id, order.isTest)}
                            disabled={deletingId === order.id}
                            title="حذف سفارش"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Status & Postal Tracking Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-base text-white">
                مدیریت وضعیت سفارش #{selectedOrder.orderNumber || selectedOrder.id.slice(-6).toUpperCase()}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  تغییر وضعیت سفارش:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500 font-bold"
                >
                  <option value="PENDING">در انتظار پرداخت (PENDING)</option>
                  <option value="PAID">پرداخت شده (PAID)</option>
                  <option value="PROCESSING">در حال آماده‌سازی و ساخت (PROCESSING)</option>
                  <option value="SHIPPED">ارسال شده با پست پیشتاز (SHIPPED)</option>
                  <option value="DELIVERED">تحویل نهایی شده به مشتری (DELIVERED)</option>
                  <option value="CANCELLED">لغو شده (CANCELLED)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  کد رهگیری مرسوله پستی (۲۴ رقمی):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="مثلاً 184590284719284019283741"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-amber-300 outline-none focus:border-teal-500 font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? 'در حال ثبت...' : 'ذخیره تغییرات'}
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

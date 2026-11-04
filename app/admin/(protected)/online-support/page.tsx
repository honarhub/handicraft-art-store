'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { formatPersianDateTime } from '@/lib/date';

interface SupportItem {
  id: string;
  displayId: number;
  phoneNumber: string;
  category: 'REFERRAL_CODE' | 'FEEDBACK' | 'DIRECT_CONTACT' | string;
  message?: string | null;
  createdAt: string;
}

interface Stats {
  totalCount: number;
  referralCount: number;
  feedbackCount: number;
  directContactCount: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export default function AdminOnlineSupportPage() {
  const [items, setItems] = useState<SupportItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCount: 0,
    referralCount: 0,
    feedbackCount: 0,
    directContactCount: 0
  });
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'REFERRAL_CODE' | 'FEEDBACK' | 'DIRECT_CONTACT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<SupportItem | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const fetchMessages = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        category: categoryFilter,
        search: searchQuery
      });
      const res = await fetch(`/api/admin/online-support?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch support messages:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  const handleDelete = async (id: string, displayId: number) => {
    const confirm = window.confirm(`آیا از حذف درخواست شماره #${displayId} اطمینان دارید؟`);
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/online-support?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMessages(pagination.currentPage);
      } else {
        alert('خطا در حذف درخواست');
      }
    } catch {
      alert('خطا در ارتباط با سرور');
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopyFeedback(text);
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  const formatJalaliDate = (dateStr: string) => {
    return formatPersianDateTime(dateStr, { format: 'long' });
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'REFERRAL_CODE':
        return (
          <span className="bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span>🤝</span>
            <span>دریافت کد معرف</span>
          </span>
        );
      case 'FEEDBACK':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span>💡</span>
            <span>انتقاد و پیشنهاد</span>
          </span>
        );
      case 'DIRECT_CONTACT':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span>📞</span>
            <span>تماس مستقیم</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-xl text-xs font-bold">
            {cat}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>💬</span>
            <span>گزارشات و درخواست‌های پشتیبانی آنلاین</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            مشاهده، تفکیک آماری و مدیریت پیام‌های ثبت‌شده از طریق ویجت پشتیبانی شناور سایت
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchMessages(pagination.currentPage)}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          <span>بروزرسانی داده‌ها</span>
        </button>
      </div>

      {/* Report Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center text-2xl shrink-0">
            📊
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalCount.toLocaleString('fa-IR')}</div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">کل درخواست‌ها</div>
          </div>
        </div>

        {/* Referral */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center text-2xl shrink-0">
            🤝
          </div>
          <div>
            <div className="text-2xl font-black text-purple-700">{stats.referralCount.toLocaleString('fa-IR')}</div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">دریافت کد معرف</div>
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-2xl shrink-0">
            💡
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700">{stats.feedbackCount.toLocaleString('fa-IR')}</div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">انتقادات و پیشنهادات</div>
          </div>
        </div>

        {/* Direct Contact */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-2xl shrink-0">
            📞
          </div>
          <div>
            <div className="text-2xl font-black text-blue-700">{stats.directContactCount.toLocaleString('fa-IR')}</div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">تماس مستقیم با ما</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه موارد ({stats.totalCount})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('REFERRAL_CODE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'REFERRAL_CODE'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            کد معرف ({stats.referralCount})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('FEEDBACK')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'FEEDBACK'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            انتقادات و پیشنهادات ({stats.feedbackCount})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('DIRECT_CONTACT')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'DIRECT_CONTACT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            تماس مستقیم ({stats.directContactCount})
          </button>
        </div>

        {/* Search input */}
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="جستجوی شماره موبایل یا متن..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl focus:border-teal-600 outline-none text-xs font-medium bg-slate-50/50"
          />
          <svg className="absolute left-3 top-2.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[360px]">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-xs">
              <tr>
                <th className="px-5 py-4">کد رهگیری</th>
                <th className="px-5 py-4">شماره موبایل کاربر</th>
                <th className="px-5 py-4">نوع درخواست</th>
                <th className="px-5 py-4">متن پیام / شرح</th>
                <th className="px-5 py-4">تاریخ و زمان ثبت</th>
                <th className="px-5 py-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500 font-medium">
                    در حال بارگذاری لیست پیام‌ها...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500 font-medium">
                    هیچ درخواستی در این دسته‌بندی یافت نشد.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Display ID */}
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                        #{item.displayId}
                      </span>
                    </td>

                    {/* Phone Number */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-800 text-sm tracking-wider" dir="ltr">
                          {item.phoneNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.phoneNumber)}
                          title="کپی شماره تماس"
                          className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                        >
                          {copyFeedback === item.phoneNumber ? (
                            <span className="text-[10px] text-emerald-600 font-bold">کپی شد</span>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4">
                      {getCategoryBadge(item.category)}
                    </td>

                    {/* Message */}
                    <td className="px-5 py-4 max-w-md">
                      {item.message ? (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-700 font-medium line-clamp-1 truncate">
                            {item.message}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(item)}
                            className="text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md shrink-0 transition-colors"
                          >
                            مشاهده کامل
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs font-mono">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                      {formatJalaliDate(item.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-left">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.displayId)}
                        title="حذف درخواست"
                        className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (10 per page) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-bold">
          <div>
            نمایش ۱۰ پیام در هر صفحه (صفحه {pagination.currentPage.toLocaleString('fa-IR')} از {pagination.totalPages.toLocaleString('fa-IR')} — مجموعاً {pagination.totalItems.toLocaleString('fa-IR')} پیام)
          </div>

          <div className="flex items-center gap-1.5" dir="ltr">
            <button
              type="button"
              disabled={pagination.currentPage <= 1 || loading}
              onClick={() => fetchMessages(pagination.currentPage - 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              قبلی
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.currentPage) <= 1)
              .map((pageNum, idx, arr) => (
                <React.Fragment key={pageNum}>
                  {idx > 0 && pageNum - arr[idx - 1] > 1 && <span className="px-1 text-slate-400">...</span>}
                  <button
                    type="button"
                    onClick={() => fetchMessages(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      pagination.currentPage === pageNum
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                </React.Fragment>
              ))}

            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              onClick={() => fetchMessages(pagination.currentPage + 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              بعدی
            </button>
          </div>
        </div>
      </div>

      {/* Modal for viewing full feedback message text */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💡</span>
                <div>
                  <h3 className="font-black text-slate-800 text-base">متن انتقاد یا پیشنهاد</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">#{selectedMessage.displayId} — {selectedMessage.phoneNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedMessage.message}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <span>زمان ثبت: {formatJalaliDate(selectedMessage.createdAt)}</span>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

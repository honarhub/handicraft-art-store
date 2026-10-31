'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReferralAdminItem {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt?: string | null;
  createdAt: string;
  creator?: {
    id: string;
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    role: string;
    artistProfile?: { displayId: number; brandName?: string | null } | null;
  } | null;
  usedBy?: {
    id: string;
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    role: string;
    artistProfile?: { displayId: number; brandName?: string | null } | null;
  } | null;
}

interface ArtistOption {
  id: string;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  artistProfile?: {
    displayId: number;
    brandName?: string | null;
  } | null;
  _count?: {
    createdReferrals: number;
  };
}

export default function AdminReferralsPage() {
  const [codes, setCodes] = useState<ReferralAdminItem[]>([]);
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [stats, setStats] = useState({ totalCodes: 0, activeCodes: 0, usedCodes: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'used'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal / Form state for generating codes
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetArtistUserId, setTargetArtistUserId] = useState<string>('');
  const [genMode, setGenMode] = useState<'batch' | 'custom'>('batch');
  const [batchCount, setBatchCount] = useState<number>(5);
  const [customCode, setCustomCode] = useState<string>('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Send Invite Modal state
  const [sendModalCode, setSendModalCode] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/referrals?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setCodes(data.codes || []);
        if (data.stats) setStats(data.stats);
        if (data.artists) setArtists(data.artists);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCodes();
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current));
    }, 2000);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`کد «${code}» در کلیپ‌بورد کپی شد.`);
    } catch {
      showToast('خطا در کپی کردن کد.');
    }
  };

  const handleCopyLink = async (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://honarhub.ir';
    const link = `${origin}/artist-panel/login?tab=register&ref=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast(`لینک مستقیم ثبت‌نام با کد «${code}» کپی شد.`);
    } catch {
      showToast('خطا در کپی کردن لینک.');
    }
  };

  const handleSendInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendModalCode || !sendTarget.trim()) return;

    setSendLoading(true);
    setSendError('');

    try {
      const res = await fetch('/api/referrals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sendModalCode,
          target: sendTarget.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || 'خطا در ارسال دعوت‌نامه');
        return;
      }

      setSendModalCode(null);
      setSendTarget('');
      showToast(data.message || 'دعوت‌نامه با موفقیت ارسال شد.');
    } catch {
      setSendError('خطای غیرمنتظره در برقراری ارتباط با سرور.');
    } finally {
      setSendLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const payload: any = {};
      if (targetArtistUserId) {
        payload.targetArtistUserId = targetArtistUserId;
      }

      if (genMode === 'custom') {
        if (!customCode.trim()) {
          setCreateError('لطفاً کد سفارشی را وارد کنید.');
          setCreateLoading(false);
          return;
        }
        payload.customCode = customCode.trim().toUpperCase();
      } else {
        payload.count = batchCount;
      }

      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'خطا در ایجاد کد معرف');
        setCreateLoading(false);
        return;
      }

      setShowCreateModal(false);
      setCustomCode('');
      setTargetArtistUserId('');
      showToast(data.message || 'کدهای جدید با موفقیت ایجاد شدند.');
      fetchCodes();
    } catch {
      setCreateError('خطای سرور');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-16" dir="rtl">
      {/* 2s Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 text-sm font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="text-emerald-400 text-lg">✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">مدیریت کدهای معرف هنرمندان</h1>
          <p className="text-sm text-slate-500 mt-1">
            مشاهده، صدور و رهگیری کدهای دعوت اختصاصی پلتفرم و اتصالات هنرمندان
          </p>
        </div>

        <button
          onClick={() => { setShowCreateModal(true); setCreateError(''); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <span className="text-lg">➕</span>
          <span>صدور کدهای معرف جدید</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block mb-1">مجموع کل کدهای صادر شده</span>
          <span className="text-3xl font-black text-slate-900">{stats.totalCodes}</span>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-emerald-800 block mb-1">کدهای فعال و آماده استفاده</span>
          <span className="text-3xl font-black text-emerald-800">{stats.activeCodes}</span>
        </div>
        <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 shadow-sm">
          <span className="text-xs font-bold text-slate-600 block mb-1">کدهای استفاده شده (سوخته)</span>
          <span className="text-3xl font-black text-slate-700">{stats.usedCodes}</span>
        </div>
      </div>

      {/* Quick Artist Quota Grant Card */}
      {artists.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">👥</span>
              <h3 className="text-sm font-black text-slate-800">تخصیص سهمیه و صدور کد به تفکیک هنرمند</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">مجموعاً {artists.length} هنرمند در سیستم</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {artists.map((art) => (
              <div 
                key={art.id} 
                className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                    {art.name || art.artistProfile?.brandName || 'هنرمند بدون نام'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {art._count?.createdReferrals || 0} کد صادر شده
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTargetArtistUserId(art.id);
                    setShowCreateModal(true);
                    setCreateError('');
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                >
                  ➕ صدور کد
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            همه ({stats.totalCodes})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'active' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            فعال ({stats.activeCodes})
          </button>
          <button
            onClick={() => setStatusFilter('used')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'used' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            استفاده شده ({stats.usedCodes})
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-80">
          <input
            type="text"
            placeholder="جستجوی کد، هنرمند یا شماره..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            جستجو
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">در حال بارگذاری کدهای معرف...</p>
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <span className="text-4xl block mb-2">🔍</span>
            <p className="font-bold text-sm">هیچ کد معِرفی یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-black">
                <tr>
                  <th className="py-4 px-4">کد معرف</th>
                  <th className="py-4 px-4">وضعیت</th>
                  <th className="py-4 px-4">مالک / معرف</th>
                  <th className="py-4 px-4">استفاده‌کننده</th>
                  <th className="py-4 px-4">تاریخ صدور</th>
                  <th className="py-4 px-4">تاریخ استفاده</th>
                  <th className="py-4 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {codes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Code */}
                    <td className="py-4 px-4">
                      <span className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg ${
                        item.isUsed ? 'bg-slate-100 text-slate-400 line-through' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      }`}>
                        {item.code}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {item.isUsed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                          <span>❌</span>
                          <span>استفاده شده</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-400">
                          <span>✓</span>
                          <span>فعال</span>
                        </span>
                      )}
                    </td>

                    {/* Creator */}
                    <td className="py-4 px-4">
                      {item.creator ? (
                        <div>
                          <p className="font-bold text-slate-900">
                            {item.creator.name || item.creator.artistProfile?.brandName || (item.creator.role === 'ADMIN' ? 'مدیر کل (سیستم)' : 'هنرمند')}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {item.creator.phoneNumber || item.creator.email || '-'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">سیستمی / ادمین</span>
                      )}
                    </td>

                    {/* Used By */}
                    <td className="py-4 px-4">
                      {item.usedBy ? (
                        <div>
                          <p className="font-bold text-slate-900">
                            {item.usedBy.name || item.usedBy.artistProfile?.brandName || 'هنرمند عضو شده'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {item.usedBy.phoneNumber || item.usedBy.email || '-'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Created At */}
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                    </td>

                    {/* Used At */}
                    <td className="py-4 px-4 text-slate-500">
                      {item.usedAt ? new Date(item.usedAt).toLocaleDateString('fa-IR') : '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleCopyCode(item.code)}
                          className="text-slate-500 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          title="کپی کردن فقط کد"
                        >
                          📋
                        </button>
                        {!item.isUsed && (
                          <>
                            <button
                              onClick={() => handleCopyLink(item.code)}
                              className="text-slate-500 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              title="کپی لینک مستقیم ثبت‌نام با این کد"
                            >
                              🔗
                            </button>
                            <button
                              onClick={() => { setSendModalCode(item.code); setSendTarget(''); setSendError(''); }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold py-1 px-2.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="ارسال پیامک یا ایمیل به متقاضی"
                            >
                              <span>✉️</span>
                              <span>ارسال</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Generate Referral Codes */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800">صدور کدهای معرف جدید</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border border-red-200">
                {createError}
              </div>
            )}

            {/* Mode selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setGenMode('batch')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  genMode === 'batch' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                تولید خودکار دسته‌ای
              </button>
              <button
                type="button"
                onClick={() => setGenMode('custom')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  genMode === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                کد معرف سفارشی
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Target Artist Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تخصیص کد به هنرمند (افزایش سهمیه هنرمند):
                </label>
                <select
                  value={targetArtistUserId}
                  onChange={(e) => setTargetArtistUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">کدهای عمومی سیستم (مدیر کل / بدون تخصیص به هنرمند خاص)</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name || a.artistProfile?.brandName || 'هنرمند بدون نام'} {a.artistProfile?.brandName ? `(استودیو ${a.artistProfile.brandName})` : ''} — {a.phoneNumber || a.email || ''} ({a._count?.createdReferrals || 0} کد فعلی)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  در صورت انتخاب هنرمند، این کدهای جدید به عنوان سهمیه در پنل معرف آن هنرمند قرار خواهد گرفت.
                </p>
              </div>

              {genMode === 'batch' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    تعداد کدهای رندوم جهت صدور
                  </label>
                  <select
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value={1}>۱ عدد کد معرف</option>
                    <option value={2}>۲ عدد کد معرف</option>
                    <option value={3}>۳ عدد کد معرف</option>
                    <option value={5}>۵ عدد کد معرف (سهمیه استاندارد)</option>
                    <option value={10}>۱۰ عدد کد معرف</option>
                    <option value={20}>۲۰ عدد کد معرف</option>
                    <option value={50}>۵۰ عدد کد معرف</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    کد معرف سفارشی دلخواه
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="مثال: HONAR2026 یا VIP-ARTIST"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center tracking-widest"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    کد سفارشی برای رویدادهای ویژه یا تبلیغاتی (حداقل ۳ کاراکتر).
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? 'در حال صدور...' : 'ثبت و صدور کد'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Invite Modal (SMS / Email) */}
      {sendModalCode && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSendModalCode(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold">
                  ✉️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">ارسال دعوت‌نامه با کد معرف</h3>
                  <p className="text-xs text-slate-500">ارسال پیامک یا ایمیل رسمی حاوی لینک ثبت‌نام</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSendModalCode(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInviteSubmit} className="space-y-4">
              {/* Selected Code Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">کد معرف ارسالی:</span>
                <span className="font-mono text-lg font-black text-emerald-800 tracking-wider">
                  {sendModalCode}
                </span>
              </div>

              {/* Target Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره موبایل یا ایمیل مقصد:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={sendTarget}
                  onChange={(e) => setSendTarget(e.target.value)}
                  placeholder="0912... یا artist@example.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl font-sans text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800 text-left placeholder:text-right"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  💡 با وارد کردن شماره موبایل، پیامک رسمی ارسال اعتبارسنجی حاوی لینک ثبت‌نام ارسال می‌شود. با وارد کردن ایمیل، دعوت‌نامه اختصاصی ارسال می‌گردد.
                </p>
              </div>

              {/* Error display */}
              {sendError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                  {sendError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSendModalCode(null)}
                  disabled={sendLoading}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={sendLoading || !sendTarget.trim()}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {sendLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>در حال ارسال...</span>
                    </>
                  ) : (
                    <span>ارسال دعوت‌نامه 🚀</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

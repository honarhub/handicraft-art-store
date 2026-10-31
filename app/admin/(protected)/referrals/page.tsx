'use client';

import React, { useState, useEffect, useRef } from 'react';
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

const toPersianDigits = (num: number | string) =>
  String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export default function AdminReferralsPage() {
  const [codes, setCodes] = useState<ReferralAdminItem[]>([]);
  const [stats, setStats] = useState({ totalCodes: 0, activeCodes: 0, usedCodes: 0 });
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [creatorSearch, setCreatorSearch] = useState('');
  const [usedBySearch, setUsedBySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'used'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10
  });

  // Modal / Form state for generating codes
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [genMode, setGenMode] = useState<'batch' | 'custom'>('batch');
  const [batchCount, setBatchCount] = useState<number>(5);
  const [customCode, setCustomCode] = useState<string>('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Live Artist Search inside Modal
  const [artistSearchInput, setArtistSearchInput] = useState('');
  const [artistSearchResults, setArtistSearchResults] = useState<ArtistOption[]>([]);
  const [artistSearchLoading, setArtistSearchLoading] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ArtistOption | null>(null);
  const [targetArtistUserId, setTargetArtistUserId] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Client-side quick random code generator for preview
  const generateClientCode = (prefix = 'HNR'): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${randomPart}`;
  };

  // Quick Instant Code Generate & Send Modal state
  const [showQuickSendModal, setShowQuickSendModal] = useState(false);
  const [quickSendMode, setQuickSendMode] = useState<'auto' | 'custom'>('auto');
  const [quickSendCode, setQuickSendCode] = useState('');
  const [quickSendCustomCode, setQuickSendCustomCode] = useState('');
  const [quickSendTarget, setQuickSendTarget] = useState('');
  const [quickSendLoading, setQuickSendLoading] = useState(false);
  const [quickSendError, setQuickSendError] = useState('');

  // Send Invite Modal state
  const [sendModalCode, setSendModalCode] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');

  const fetchCodes = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (creatorSearch.trim()) params.set('creator', creatorSearch.trim());
      if (usedBySearch.trim()) params.set('usedBy', usedBySearch.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/admin/referrals?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setCodes(data.codes || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes(1);
    setCurrentPage(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCodes(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCreatorSearch('');
    setUsedBySearch('');
    setStatusFilter('all');
    setCurrentPage(1);
    // fetch with clean params
    setTimeout(() => {
      fetch(`/api/admin/referrals?page=1&limit=10`, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          if (data.codes) setCodes(data.codes);
          if (data.stats) setStats(data.stats);
          if (data.pagination) setPagination(data.pagination);
        });
    }, 0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchCodes(newPage);
  };

  // Live debounce search for artist in modal
  const handleArtistSearchChange = (val: string) => {
    setArtistSearchInput(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val.trim()) {
      setArtistSearchResults([]);
      setArtistSearchLoading(false);
      return;
    }

    setArtistSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/referrals?artistSearch=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        if (res.ok && data.artists) {
          setArtistSearchResults(data.artists);
        }
      } catch {
        // ignore
      } finally {
        setArtistSearchLoading(false);
      }
    }, 280);
  };

  const handleSelectArtist = (artist: ArtistOption) => {
    setSelectedArtist(artist);
    setTargetArtistUserId(artist.id);
    setArtistSearchInput('');
    setArtistSearchResults([]);
  };

  const handleClearSelectedArtist = () => {
    setSelectedArtist(null);
    setTargetArtistUserId('');
    setArtistSearchInput('');
    setArtistSearchResults([]);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current));
    }, 2500);
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
    const origin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')
      ? window.location.origin 
      : 'https://honarhub.ir';
    const link = `${origin}/artist-panel/login?invite=${encodeURIComponent(code)}&tab=register`;
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

  const handleOpenQuickSendModal = () => {
    setQuickSendMode('auto');
    setQuickSendCode(generateClientCode());
    setQuickSendCustomCode('');
    setQuickSendTarget('');
    setQuickSendError('');
    setShowQuickSendModal(true);
  };

  const handleQuickSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSendTarget.trim()) return;

    const activeCode = quickSendMode === 'custom' 
      ? quickSendCustomCode.trim().toUpperCase() 
      : quickSendCode.trim().toUpperCase();

    if (quickSendMode === 'custom') {
      if (!activeCode || activeCode.length < 3) {
        setQuickSendError('کد سفارشی باید حداقل ۳ کاراکتر باشد.');
        return;
      }
      if (activeCode.length > 25) {
        setQuickSendError('طول کد سفارشی نمی‌تواند بیش از ۲۵ کاراکتر باشد (محدودیت سامانه پیامک).');
        return;
      }
      if (/\s/.test(activeCode)) {
        setQuickSendError('کد سفارشی نمی‌تواند حاوی فاصله باشد.');
        return;
      }
    }

    setQuickSendLoading(true);
    setQuickSendError('');

    try {
      const res = await fetch('/api/admin/referrals/quick-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: quickSendTarget.trim(),
          code: activeCode,
          isCustom: quickSendMode === 'custom'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setQuickSendError(data.error || 'خطا در صدور و ارسال کد معرف');
        return;
      }

      setShowQuickSendModal(false);
      setQuickSendTarget('');
      setQuickSendCode('');
      setQuickSendCustomCode('');
      showToast(data.message || `کد معرف «${activeCode}» با موفقیت صادر و ارسال شد.`);
      fetchCodes(1);
      setCurrentPage(1);
    } catch {
      setQuickSendError('خطای سرور در صدور و ارسال کد معرف');
    } finally {
      setQuickSendLoading(false);
    }
  };

  const handleDeleteCode = async (id: string, code: string) => {
    if (!window.confirm(`آیا از حذف و باطل کردن کد معرف «${code}» اطمینان دارید؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/referrals?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'خطا در حذف کد معرف');
        return;
      }
      showToast(data.message || `کد معرف «${code}» با موفقیت حذف گردید.`);
      fetchCodes(currentPage);
    } catch {
      showToast('خطای شبکه در حذف کد معرف.');
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
      handleClearSelectedArtist();
      showToast(data.message || 'کدهای جدید با موفقیت ایجاد شدند.');
      fetchCodes(1);
      setCurrentPage(1);
    } catch {
      setCreateError('خطای سرور در ایجاد کدهای معرف');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-7 font-sans pb-16" dir="rtl">
      {/* 2.5s Toast */}
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
            مشاهده، صدور، تخصیص به هنرمندان و ارسال دعوت‌نامه از طریق پیامک یا ایمیل
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleOpenQuickSendModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <span className="text-lg">⚡</span>
            <span>صدور کد آنی</span>
          </button>

          <button
            onClick={() => {
              setShowCreateModal(true);
              setCreateError('');
              handleClearSelectedArtist();
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span className="text-lg">➕</span>
            <span>صدور دسته‌ای / سفارشی</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block mb-1">مجموع کل کدهای صادر شده</span>
          <span className="text-3xl font-black text-slate-900">{toPersianDigits(stats.totalCodes)}</span>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-emerald-800 block mb-1">کدهای فعال و آماده استفاده</span>
          <span className="text-3xl font-black text-emerald-800">{toPersianDigits(stats.activeCodes)}</span>
        </div>
        <div className="bg-slate-100 p-5 rounded-2xl border border-slate-300 shadow-sm">
          <span className="text-xs font-bold text-slate-600 block mb-1">کدهای استفاده شده (سوخته)</span>
          <span className="text-3xl font-black text-slate-700">{toPersianDigits(stats.usedCodes)}</span>
        </div>
      </div>

      {/* Advanced Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              همه ({toPersianDigits(stats.totalCodes)})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'active' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              فعال ({toPersianDigits(stats.activeCodes)})
            </button>
            <button
              onClick={() => setStatusFilter('used')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'used' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              استفاده شده ({toPersianDigits(stats.usedCodes)})
            </button>
          </div>

          {(search || creatorSearch || usedBySearch || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-red-600 hover:text-red-700 font-bold self-start sm:self-auto flex items-center gap-1 cursor-pointer"
            >
              <span>✕</span>
              <span>پاک کردن فیلترها</span>
            </button>
          )}
        </div>

        {/* 3 Search Inputs: Code / Creator / UsedBy */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* General / Code */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              جستجو بر اساس کد معرف:
            </label>
            <input
              type="text"
              dir="ltr"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="مثال: HNR- یا نام کلی..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 outline-none text-slate-800"
            />
          </div>

          {/* Creator Artist Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              جستجو در ستون هنرمند معرّف (صاحب کد):
            </label>
            <input
              type="text"
              value={creatorSearch}
              onChange={(e) => setCreatorSearch(e.target.value)}
              placeholder="نام هنرمند معرف، برند، شماره یا ایمیل..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 outline-none text-slate-800"
            />
          </div>

          {/* UsedBy Artist Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              جستجو در ستون هنرمند استفاده‌کننده:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={usedBySearch}
                onChange={(e) => setUsedBySearch(e.target.value)}
                placeholder="نام عضو جدید، برند، شماره یا ایمیل..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 outline-none text-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                اعمال فیلتر
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Referral Codes Table (10 per page) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">در حال بارگذاری کدهای معرف...</p>
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-2">
            <span className="text-4xl block">🔍</span>
            <p className="font-bold text-sm text-slate-700">هیچ کد معِرفی با مشخصات جستجو شده یافت نشد.</p>
            <p className="text-xs text-slate-400">فیلترهای جستجو را پاک کنید یا کد جدید صادر فرمایید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-black">
                <tr>
                  <th className="py-4 px-4">کد معرف</th>
                  <th className="py-4 px-4">وضعیت</th>
                  <th className="py-4 px-4">هنرمند معرّف (صاحب کد)</th>
                  <th className="py-4 px-4">هنرمند استفاده‌کننده (عضو جدید)</th>
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
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg ${
                          item.isUsed ? 'bg-slate-100 text-slate-400 line-through' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        }`}>
                          {item.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.code)}
                          className="text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="کپی کد معرف"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      </div>
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

                    {/* Creator Artist */}
                    <td className="py-4 px-4">
                      {item.creator ? (
                        <div>
                          <p className="font-bold text-slate-900">
                            {item.creator.name || item.creator.artistProfile?.brandName || (item.creator.role === 'ADMIN' ? 'مدیر کل (سیستم)' : 'هنرمند')}
                          </p>
                          {item.creator.artistProfile?.brandName && (
                            <span className="text-[11px] text-emerald-700 font-medium block">
                              برند: {item.creator.artistProfile.brandName}
                            </span>
                          )}
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                            {item.creator.phoneNumber || item.creator.email || '-'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">سیستمی / ادمین</span>
                      )}
                    </td>

                    {/* UsedBy Artist */}
                    <td className="py-4 px-4">
                      {item.usedBy ? (
                        <div>
                          <p className="font-bold text-slate-900">
                            {item.usedBy.name || item.usedBy.artistProfile?.brandName || 'هنرمند عضو شده'}
                          </p>
                          {item.usedBy.artistProfile?.brandName && (
                            <span className="text-[11px] text-emerald-700 font-medium block">
                              برند: {item.usedBy.artistProfile.brandName}
                            </span>
                          )}
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
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

                    {/* Actions: ONLY Copy Link (chain icon) and Delete (standard trash icon) */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleCopyLink(item.code)}
                          className="text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 p-2 rounded-lg transition-colors cursor-pointer"
                          title="کپی لینک مستقیم ثبت‌نام با این کد"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCode(item.id, item.code)}
                          title="حذف و باطل کردن کد معرف"
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar (10 per page) */}
        {!loading && codes.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
            <div>
              <span>نمایش ۱۰ مورد در هر صفحه — مجموعاً </span>
              <strong className="text-slate-900 font-bold">{toPersianDigits(pagination.totalItems)}</strong>
              <span> کد معرف یافت شده</span>
            </div>

            <div className="flex items-center gap-1 self-center sm:self-auto">
              {/* Prev Button */}
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
              >
                قبلی
              </button>

              {/* Page Numbers */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 2)
                .map((pageNum, idx, arr) => {
                  const showEllipsis = idx > 0 && pageNum - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {toPersianDigits(pageNum)}
                      </button>
                    </React.Fragment>
                  );
                })}

              {/* Next Button */}
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Generate Referral Codes with Dynamic Artist Live Search */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-800">صدور و تخصیص کدهای معرف جدید</h3>
                <p className="text-xs text-slate-500 mt-0.5">امکان صدور کدهای عمومی یا افزایش سهمیه یک هنرمند خاص</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border border-red-200">
                {createError}
              </div>
            )}

            {/* Mode selector (Batch vs Custom) */}
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
              {/* Dynamic Live Artist Search Section */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تخصیص به هنرمند خاص (جستجو و انتخاب هنرمند):
                </label>

                {selectedArtist ? (
                  /* Selected Artist Pill/Card */
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-emerald-900">
                        {selectedArtist.name || selectedArtist.artistProfile?.brandName || 'هنرمند انتخابی'}
                        {selectedArtist.artistProfile?.brandName ? ` (${selectedArtist.artistProfile.brandName})` : ''}
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        شماره/ایمیل: {selectedArtist.phoneNumber || selectedArtist.email || '-'} — دارای {toPersianDigits(selectedArtist._count?.createdReferrals || 0)} کد قبلی
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSelectedArtist}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="لغو انتخاب و صدور برای مدیر کل (عمومی)"
                    >
                      ✕ لغو انتخاب
                    </button>
                  </div>
                ) : (
                  /* Artist Live Search Input */
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        value={artistSearchInput}
                        onChange={(e) => handleArtistSearchChange(e.target.value)}
                        placeholder="برای تخصیص به هنرمند، نام، برند یا شماره موبایل را تایپ کنید..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 outline-none text-slate-800"
                      />
                      {artistSearchLoading && (
                        <div className="absolute left-3 top-3 w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      در صورت عدم انتخاب هنرمند، کدها به عنوان کدهای عمومی سیستم صادر می‌گردند.
                    </p>

                    {/* Autocomplete Dropdown */}
                    {artistSearchResults.length > 0 && (
                      <div className="absolute z-20 top-full mt-1.5 right-0 left-0 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {artistSearchResults.map((art) => (
                          <button
                            key={art.id}
                            type="button"
                            onClick={() => handleSelectArtist(art)}
                            className="w-full p-2.5 text-right hover:bg-emerald-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-slate-900">
                                {art.name || art.artistProfile?.brandName || 'هنرمند'}
                                {art.artistProfile?.brandName && (
                                  <span className="text-emerald-700 font-medium mr-1.5">
                                    ({art.artistProfile.brandName})
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                                {art.phoneNumber || art.email || '-'}
                              </p>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                              {toPersianDigits(art._count?.createdReferrals || 0)} کد
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {genMode === 'batch' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تعداد کدهای رندوم جهت صدور:
                  </label>
                  <select
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    کد معرف سفارشی دلخواه:
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="مثال: HONAR2026 یا VIP-ARTIST"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center tracking-widest"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    کد سفارشی برای رویدادهای ویژه یا کمپین‌ها (حداقل ۳ کاراکتر).
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? 'در حال صدور...' : 'ثبت و صدور کدها'}
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
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
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

      {/* Quick Instant Code Generate & Send Modal */}
      {showQuickSendModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowQuickSendModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold">
                  ⚡
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">صدور کد آنی</h3>
                  <p className="text-xs text-slate-500">صدور کد اختصاصی به نام مدیر کل و ارسال به متقاضی</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickSendModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickSendSubmit} className="space-y-4">
              {/* Code Mode Switcher: Auto vs Custom */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setQuickSendMode('auto');
                    setQuickSendError('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    quickSendMode === 'auto' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>⚡</span>
                  <span>کد خودکار (سیستمی)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickSendMode('custom');
                    setQuickSendError('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    quickSendMode === 'custom' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>✏️</span>
                  <span>کد سفارشی (دلخواه)</span>
                </button>
              </div>

              {quickSendMode === 'auto' ? (
                /* Generated Code Display */
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 block mb-0.5">کد معرف آنی:</span>
                    <span className="font-mono text-xl font-black text-emerald-900 tracking-wider" dir="ltr">
                      {quickSendCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickSendCode(generateClientCode())}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold bg-white/90 hover:bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    title="تولید یک کد دیگر"
                  >
                    <span>🔄</span>
                    <span>کد جدید</span>
                  </button>
                </div>
              ) : (
                /* Custom Code Input */
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    کد معرف سفارشی دلخواه:
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="مثال: VIP-ARTIST یا HONAR2026"
                    value={quickSendCustomCode}
                    onChange={(e) => setQuickSendCustomCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none text-center tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    کد سفارشی باید بین ۳ تا ۲۵ کاراکتر باشد (بدون فاصله).
                  </p>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 leading-relaxed">
                ✨ پس از ثبت، این کد تنها در صورت ارسال موفق پیامک یا ایمیل به عنوان معرف مدیر کل در سیستم ثبت و فعال خواهد شد.
              </div>

              {/* Target Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره موبایل یا ایمیل متقاضی / هنرمند مدعو:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={quickSendTarget}
                  onChange={(e) => setQuickSendTarget(e.target.value)}
                  placeholder="0912... یا artist@example.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl font-sans text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800 text-left placeholder:text-right"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  💡 با وارد کردن شماره موبایل پیامک حاوی کد معرف و لینک ثبت‌نام ارسال می‌شود؛ با وارد کردن ایمیل، دعوت‌نامه رسمی ارسال خواهد شد.
                </p>
              </div>

              {/* Error display */}
              {quickSendError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                  {quickSendError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickSendModal(false)}
                  disabled={quickSendLoading}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={quickSendLoading || !quickSendTarget.trim()}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {quickSendLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>در حال صدور و ارسال...</span>
                    </>
                  ) : (
                    <span>صدور و ارسال آنی ⚡</span>
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

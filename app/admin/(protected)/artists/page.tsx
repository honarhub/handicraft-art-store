'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPromptModal from '@/app/components/AdminPromptModal';

export default function AdminArtistsPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  
  // Filter Tabs: 'ALL' | '0' | '1' | 'VERIFIED'
  const [levelFilter, setLevelFilter] = useState<'ALL' | '0' | '1' | 'VERIFIED'>('ALL');

  // Filter States
  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState({ id: '', name: '', specialties: '' });
  const [activeFilterField, setActiveFilterField] = useState<string | null>(null);
  
  const [selectedArtistForPassword, setSelectedArtistForPassword] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [artistIdForDeactivation, setArtistIdForDeactivation] = useState<string | null>(null);

  // Modal for National Card image preview
  const [previewCardImage, setPreviewCardImage] = useState<string | null>(null);

  // Fetch artists
  const fetchArtists = () => {
    fetch('/api/artists', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setArtists(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const handleSoftDelete = async (id: string, name?: string) => {
    const confirm = window.confirm(`آیا از حذف / بایگانی هنرمند «${name || ''}» اطمینان دارید؟`);
    if (confirm) {
      try {
        const res = await fetch(`/api/artists/${id}`, { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete' })
        });
        if (!res.ok) throw new Error('خطا در حذف هنرمند');
        
        setArtists(prev => prev.map(a => a.id === id ? { ...a, status: 'DELETED', isActive: false } : a));
        window.dispatchEvent(new CustomEvent('admin-counts-update'));
      } catch (error) {
        alert('عملیات با خطا مواجه شد');
      }
    }
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      setArtistIdForDeactivation(id);
      setPromptModalOpen(true);
    } else {
      toggleActiveApi(id, true, '');
    }
  };

  const toggleActiveApi = async (id: string, isActive: boolean, adminFeedback: string) => {
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleActive', isActive, adminFeedback })
      });
      if (!res.ok) throw new Error('خطا در تغییر وضعیت');
      
      setArtists(prev => prev.map(a => a.id === id ? { 
        ...a, 
        isActive,
        status: isActive ? 'ACTIVE' : a.status
      } : a));
    } catch (error) {
      alert('خطا در تغییر وضعیت هنرمند');
    }
  };

  const handleDeactivateConfirm = (reason: string) => {
    if (artistIdForDeactivation) {
      toggleActiveApi(artistIdForDeactivation, false, reason);
    }
    setPromptModalOpen(false);
    setArtistIdForDeactivation(null);
  };

  const handleApproveLevel3 = async (id: string) => {
    if (!window.confirm('آیا از تایید مدارک هویتی/مالی و ارتقای این هنرمند به سطح ۳ (احراز کامل) اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approveLevel3' })
      });
      if (!res.ok) throw new Error('خطا در تایید سطح ۳');
      
      setArtists(prev => prev.map(a => a.id === id ? { ...a, verificationLevel: 3, isLevel3Pending: false } : a));
      window.dispatchEvent(new CustomEvent('admin-counts-update'));
      alert('هنرمند با موفقیت به سطح ۳ ارتقا یافت.');
    } catch (err: any) {
      alert(err.message || 'خطا در تایید سطح ۳');
    }
  };

  const handleRejectLevel3 = async (id: string) => {
    const reason = window.prompt('لطفاً دلیل رد مدارک سطح ۳ (کارت ملی / شماره شبا) را جهت اطلاع هنرمند وارد کنید:');
    if (!reason || !reason.trim()) return;
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejectLevel3', adminFeedback: reason.trim() })
      });
      if (!res.ok) throw new Error('خطا در رد مدارک');
      
      setArtists(prev => prev.map(a => a.id === id ? { 
        ...a, 
        nationalId: null, 
        nationalCardImage: null, 
        shebaNumber: null, 
        address: null, 
        postalCode: null, 
        isLevel3Pending: false 
      } : a));
      window.dispatchEvent(new CustomEvent('admin-counts-update'));
      alert('مدارک رد شد و پیام بازخورد به هنرمند ارسال گردید.');
    } catch (err: any) {
      alert(err.message || 'خطا در رد مدارک');
    }
  };

  const handleRejectRegistration = async (id: string) => {
    if (!window.confirm('آیا از رد ثبت‌نام و حذف کامل این حساب کاربری اطمینان دارید؟\nاین عملیات حساب را کلاً از سیستم پاک می‌کند.')) return;
    try {
      const res = await fetch(`/api/artists/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejectRegistration' })
      });
      if (!res.ok) throw new Error('خطا در رد هنرمند');
      
      setArtists(prev => prev.filter(a => a.id !== id));
      window.dispatchEvent(new CustomEvent('admin-counts-update'));
    } catch (error) {
      alert('عملیات با خطا مواجه شد');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword.length > 0 && newPassword.length < 6) {
      alert('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }
    if (!newEmail) {
      alert('ایمیل نمی‌تواند خالی باشد');
      return;
    }
    try {
      const res = await fetch(`/api/admin/artists/${selectedArtistForPassword.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, email: newEmail })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در اعمال تغییرات');
      }
      
      setArtists(prev => prev.map(a => a.id === selectedArtistForPassword.id ? { ...a, email: newEmail } : a));
      alert('تغییرات با موفقیت ذخیره شد.');
      setSelectedArtistForPassword(null);
      setNewPassword('');
      setNewEmail('');
    } catch (error: any) {
      alert(error.message || 'خطا در اعمال تغییرات');
    }
  };

  const toggleFilter = (field: string) => {
    setActiveFilterField(activeFilterField === field ? null : field);
  };

  const formatPersianDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return '—';
    }
  };

  // Active counts for filters
  const level0Artists = artists.filter(a => a.status !== 'DELETED' && (a.verificationLevel || 0) === 0);
  const level1Artists = artists.filter(a => a.status !== 'DELETED' && (a.verificationLevel || 0) === 1);
  const verifiedArtists = artists.filter(a => a.status !== 'DELETED' && (a.verificationLevel || 0) >= 2);

  // Red Lists (Verification Requests)
  const level2Requests = artists.filter(a => a.status !== 'DELETED' && a.isLevel2Pending);
  const level3Requests = artists.filter(a => a.status !== 'DELETED' && a.isLevel3Pending);

  // Yellow List (Profile Edits of Level 2 & 3 Artists)
  const profileEditRequests = artists.filter(a => a.status !== 'DELETED' && a.isProfileEditPending);

  // Filtered List for Table
  const filteredArtists = artists.filter(artist => {
    if (showArchived && artist.status !== 'DELETED') return false;
    if (!showArchived && artist.status === 'DELETED') return false;

    // Level Tab Filter
    if (levelFilter === '0' && (artist.verificationLevel || 0) !== 0) return false;
    if (levelFilter === '1' && (artist.verificationLevel || 0) !== 1) return false;
    if (levelFilter === 'VERIFIED' && (artist.verificationLevel || 0) < 2) return false;

    const matchGlobal = globalSearch === '' || 
      artist.name.toLowerCase().includes(globalSearch.toLowerCase()) || 
      (artist.brandName && artist.brandName.toLowerCase().includes(globalSearch.toLowerCase())) ||
      (artist.email && artist.email.toLowerCase().includes(globalSearch.toLowerCase())) ||
      (artist.phoneNumber && artist.phoneNumber.includes(globalSearch));
      
    const matchId = String(artist.displayId).includes(filters.id);
    const matchName = artist.name.toLowerCase().includes(filters.name.toLowerCase()) || 
      (artist.brandName && artist.brandName.toLowerCase().includes(filters.name.toLowerCase()));
    const matchSpec = (artist.specialties || []).map((s: any) => s.name).join(' ').toLowerCase().includes(filters.specialties.toLowerCase());
    
    return matchGlobal && matchId && matchName && matchSpec;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans" dir="rtl">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">مدیریت هنرمندان</h2>
          <p className="text-slate-500 mt-1 text-sm">لیست تمامی هنرمندان و سازندگان آثار سایت</p>
        </div>
        
        <div className="flex-1 max-w-sm mx-0 md:mx-6 w-full">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text" 
              placeholder="جستجوی نام، برند، تلفن یا ایمیل..." 
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200">
            <input 
              type="checkbox" 
              checked={showArchived} 
              onChange={e => setShowArchived(e.target.checked)} 
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4" 
            />
            نمایش بایگانی شده‌ها
          </label>
          <a href="/admin/artists/new" className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center gap-1.5">
            <span>+</span>
            <span>ثبت هنرمند جدید</span>
          </a>
        </div>
      </div>

      {/* Level Filter Buttons Bar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-8">
        <button
          onClick={() => setLevelFilter('ALL')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            levelFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <span>همه هنرمندان</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${levelFilter === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {artists.filter(a => a.status !== 'DELETED').length}
          </span>
        </button>

        <button
          onClick={() => setLevelFilter('0')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            levelFilter === '0'
              ? 'bg-slate-800 text-white shadow-md ring-2 ring-slate-400'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          title="هنرمندانی که وارد شده‌اند اما هنوز فرم آنبوردینگ سطح ۱ را پر نکرده‌اند"
        >
          <span>هنرمندان سطح صفر (ثبت‌نام اولیه)</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${levelFilter === '0' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700'}`}>
            {level0Artists.length}
          </span>
        </button>

        <button
          onClick={() => setLevelFilter('1')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            levelFilter === '1'
              ? 'bg-teal-700 text-white shadow-md ring-2 ring-teal-400'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          title="هنرمندانی که اطلاعات پایه و کارگاه را تکمیل کرده‌اند"
        >
          <span>هنرمندان سطح ۱ (اطلاعات پایه)</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${levelFilter === '1' ? 'bg-amber-400 text-slate-950' : 'bg-teal-50 text-teal-800 border border-teal-200'}`}>
            {level1Artists.length}
          </span>
        </button>

        <button
          onClick={() => setLevelFilter('VERIFIED')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
            levelFilter === 'VERIFIED'
              ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-400'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          title="هنرمندان تایید شده با پروفایل عمومی در ویترین"
        >
          <span>هنرمندان تایید شده (سطح ۲ و ۳)</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${levelFilter === 'VERIFIED' ? 'bg-white text-emerald-900' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
            {verifiedArtists.length}
          </span>
        </button>
      </div>

      {/* 🔴 RED SECTION 1: Level 2 Verification Requests */}
      {level2Requests.length > 0 && (
        <div className="mb-8 bg-red-50/90 border-2 border-red-300 rounded-3xl p-6 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <h3 className="text-base sm:text-lg font-black text-red-950">
              درخواست‌های احراز هویت سطح ۲ ({level2Requests.length})
            </h3>
            <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
              نیازمند اقدام
            </span>
          </div>
          <p className="text-xs text-red-800 mb-4 leading-relaxed">
            این هنرمندان اطلاعات پایه (سطح ۱) را تکمیل کرده و رزومه و شناسنامه هنری خود را جهت ارتقا به سطح ۲ و انتشار عمومی در ویترین ارسال نموده‌اند.
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-red-50 text-red-900 font-bold border-b border-red-200">
                <tr>
                  <th className="px-6 py-3.5">هنرمند و استودیو</th>
                  <th className="px-6 py-3.5">تماس و موقعیت</th>
                  <th className="px-6 py-3.5">تخصص‌ها</th>
                  <th className="px-6 py-3.5">تاریخ ارسال</th>
                  <th className="px-6 py-3.5 text-left">عملیات بررسی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {level2Requests.map((artist) => (
                  <tr key={artist.id} className="hover:bg-red-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{artist.name}</div>
                      {artist.brandName && (
                        <div className="text-xs text-emerald-800 font-bold mt-0.5">برند: {artist.brandName}</div>
                      )}
                      <div className="text-xs text-slate-500 mt-1" dir="ltr">{artist.email || 'بدون ایمیل'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-800" dir="ltr">{artist.phoneNumber || '—'}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        {artist.province ? `${artist.province} - ${artist.city || ''}` : 'نامشخص'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {artist.specialties && artist.specialties.length > 0 ? artist.specialties.map((s: any) => (
                          <span key={s.id} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {s.name}
                          </span>
                        )) : <span className="text-slate-400 text-xs">ثبت نشده</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatPersianDate(artist.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex justify-end items-center gap-2">
                        <a 
                          href={`/admin/artists/${artist.id}/review-edits`} 
                          className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-colors shadow-sm shadow-red-500/20"
                        >
                          <span>بررسی و تایید سطح ۲</span>
                          <span>←</span>
                        </a>
                        <button 
                          onClick={() => handleRejectRegistration(artist.id)} 
                          className="bg-red-100 hover:bg-red-200 text-red-800 p-2 rounded-xl text-xs font-bold transition-colors"
                          title="رد و حذف کاربر"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🔴 RED SECTION 2: Level 3 KYC Financial Verification Requests */}
      {level3Requests.length > 0 && (
        <div className="mb-8 bg-red-50/90 border-2 border-red-300 rounded-3xl p-6 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <h3 className="text-base sm:text-lg font-black text-red-950">
              در انتظار احراز هویت کامل (سطح ۳ مالی و تسویه) ({level3Requests.length})
            </h3>
            <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
              بررسی مدارک مالی
            </span>
          </div>
          <p className="text-xs text-red-800 mb-4 leading-relaxed">
            هنرمندان تایید شده‌ای که اطلاعات هویتی و مالی (کد ملی، تصویر کارت ملی و شماره شبا) را جهت تسویه درآمدهای فروش ثبت کرده‌اند.
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-red-50 text-red-900 font-bold border-b border-red-200">
                <tr>
                  <th className="px-6 py-3.5">هنرمند</th>
                  <th className="px-6 py-3.5">کد ملی و شماره شبا</th>
                  <th className="px-6 py-3.5">آدرس و کد پستی</th>
                  <th className="px-6 py-3.5">کارت ملی</th>
                  <th className="px-6 py-3.5 text-left">عملیات تایید</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {level3Requests.map((artist) => (
                  <tr key={artist.id} className="hover:bg-red-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{artist.name}</div>
                      {artist.brandName && <div className="text-xs text-slate-500">{artist.brandName}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-800 text-xs">کد ملی: {artist.nationalId || '—'}</div>
                      <div className="font-mono text-xs text-teal-800 mt-1 dir-ltr inline-block">
                        IR{artist.shebaNumber || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">
                      <p className="truncate">{artist.address || '—'}</p>
                      <span className="text-slate-400 font-mono mt-0.5 block">کد پستی: {artist.postalCode || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {artist.nationalCardImage ? (
                        <button
                          type="button"
                          onClick={() => setPreviewCardImage(artist.nationalCardImage)}
                          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 transition-colors border border-slate-200"
                        >
                          <span>🔍</span>
                          <span>مشاهده تصویر</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">بدون تصویر</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleApproveLevel3(artist.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                        >
                          ✓ تایید سطح ۳
                        </button>
                        <button
                          onClick={() => handleRejectLevel3(artist.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs px-3 py-2 rounded-xl transition-colors"
                        >
                          ✕ رد مدارک
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🟡 YELLOW SECTION: Profile Edits of Verified (Level 2 & 3) Artists */}
      {profileEditRequests.length > 0 && (
        <div className="mb-8 bg-yellow-50/90 border-2 border-yellow-300 rounded-3xl p-6 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
            <h3 className="text-base sm:text-lg font-black text-yellow-950">
              درخواست‌های ویرایش پروفایل ({profileEditRequests.length})
            </h3>
            <span className="bg-amber-400 text-amber-950 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
              ویرایش هنرمند فعال
            </span>
          </div>
          <p className="text-xs text-yellow-800 mb-4 leading-relaxed">
            هنرمندان تایید شده سطح ۲ یا ۳ که اطلاعات پروفایل (نام، عکس، بیوگرافی یا تخصص‌ها) را ویرایش کرده‌اند.
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-yellow-200 overflow-hidden">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-yellow-50 text-yellow-900 font-bold border-b border-yellow-200">
                <tr>
                  <th className="px-6 py-3.5">هنرمند و سطح فعلی</th>
                  <th className="px-6 py-3.5">ایمیل و تلفن</th>
                  <th className="px-6 py-3.5">تخصص‌ها</th>
                  <th className="px-6 py-3.5 text-left">عملیات بررسی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-100">
                {profileEditRequests.map((artist) => (
                  <tr key={artist.id} className="hover:bg-yellow-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{artist.name}</span>
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                          ⭐ سطح {artist.verificationLevel}
                        </span>
                      </div>
                      {artist.brandName && (
                        <div className="text-xs text-emerald-800 font-medium mt-0.5">برند: {artist.brandName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-700" dir="ltr">{artist.phoneNumber || '—'}</div>
                      <div className="text-xs text-slate-500 mt-0.5" dir="ltr">{artist.email || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {artist.specialties && artist.specialties.length > 0 ? artist.specialties.map((s: any) => (
                          <span key={s.id} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {s.name}
                          </span>
                        )) : <span className="text-slate-400 text-xs">ثبت نشده</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <a 
                        href={`/admin/artists/${artist.id}/review-edits`} 
                        className="inline-flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition-colors shadow-sm"
                      >
                        <span>بررسی تغییرات</span>
                        <span>←</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Artists Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-slate-800 text-base">
              {levelFilter === '0'
                ? 'هنرمندان سطح صفر (ثبت‌نام اولیه)'
                : levelFilter === '1'
                ? 'هنرمندان سطح ۱ (اطلاعات پایه)'
                : levelFilter === 'VERIFIED'
                ? 'هنرمندان تایید شده (سطح ۲ و ۳)'
                : 'تمامی هنرمندان'}
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
              {filteredArtists.length} مورد
            </span>
          </div>

          {(levelFilter === '0' || levelFilter === '1') && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl font-medium">
              این هنرمندان در دید عمومی قرار ندارند و تنها توسط خودشان و ادمین قابل پیش‌نمایش هستند.
            </p>
          )}
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-right text-xs sm:text-sm relative">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-16 text-center">
                  <div className="flex items-center justify-center gap-1">
                    آیدی
                    <button onClick={() => toggleFilter('id')} className="text-slate-400 hover:text-teal-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                  </div>
                  {activeFilterField === 'id' && (
                    <input type="text" placeholder="آیدی..." className="mt-2 text-xs p-1 border border-slate-300 rounded w-full font-normal" value={filters.id} onChange={e => setFilters({...filters, id: e.target.value})} />
                  )}
                </th>

                <th className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    نام و برند هنرمند
                    <button onClick={() => toggleFilter('name')} className="text-slate-400 hover:text-teal-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                  </div>
                  {activeFilterField === 'name' && (
                    <input type="text" placeholder="نام یا برند..." className="mt-2 text-xs p-1 border border-slate-300 rounded w-full font-normal" value={filters.name} onChange={e => setFilters({...filters, name: e.target.value})} />
                  )}
                </th>

                <th className="px-6 py-4 text-center">سطح احراز هویت</th>
                <th className="px-6 py-4">تماس و موقعیت</th>
                <th className="px-6 py-4">زمان ثبت‌نام</th>
                <th className="px-6 py-4 text-center">تعداد آثار</th>
                <th className="px-6 py-4 text-center">وضعیت فعال</th>
                <th className="px-6 py-4 text-left">عملیات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredArtists.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 font-medium">
                    هیچ هنرمندی با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : filteredArtists.map((artist) => (
                <tr key={artist.id} className={`hover:bg-slate-50 transition-colors ${artist.status === 'DELETED' ? 'opacity-60 bg-slate-100 grayscale-[30%]' : ''}`}>
                  <td className="px-6 py-4 font-mono font-bold text-slate-400 text-center text-sm">{artist.displayId}</td>
                  
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{artist.name}</span>
                      {artist.hasPendingEdits && (
                        <span title="درخواست در حال بررسی" className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      )}
                    </div>
                    {artist.brandName && (
                      <div className="text-xs text-emerald-800 font-medium mt-0.5">برند: {artist.brandName}</div>
                    )}
                    <div className="text-xs text-slate-400 mt-1 font-mono" dir="ltr">{artist.email || 'بدون ایمیل'}</div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${
                      artist.verificationLevel >= 3
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : artist.verificationLevel === 2
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : artist.verificationLevel === 1
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      <span>⭐ سطح {artist.verificationLevel || 0}</span>
                      <span className="text-[10px] opacity-75 font-normal">
                        {artist.verificationLevel >= 3 ? '(کامل)' : artist.verificationLevel === 2 ? '(عمومی)' : artist.verificationLevel === 1 ? '(پایه)' : '(صفر)'}
                      </span>
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-slate-800" dir="ltr">{artist.phoneNumber || '—'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {artist.province ? `${artist.province} - ${artist.city || ''}` : 'نامشخص'}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatPersianDate(artist.createdAt)}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">{artist.productsCount}</span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button 
                      dir="ltr"
                      onClick={() => handleToggleActive(artist.id, artist.isActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${artist.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      title={artist.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          artist.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-6 py-4 text-left">
                    <div className="flex justify-end items-center gap-2">
                      {/* Preview Profile */}
                      <a 
                        href={`/artist/${artist.id}`} 
                        target="_blank" 
                        className="text-teal-700 hover:bg-teal-50 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-bold border border-teal-200 flex items-center gap-1"
                        title="پیش‌نمایش صفحه عمومی هنرمند"
                      >
                        <span>👁️</span>
                        <span>پیش‌نمایش</span>
                      </a>
                      
                      {/* Edit Review if pending */}
                      {artist.hasPendingEdits && (
                        <a 
                          href={`/admin/artists/${artist.id}/review-edits`} 
                          title="بررسی درخواست ارتقا / ویرایش" 
                          className="bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-lg text-xs font-black transition-colors shadow-xs"
                        >
                          بررسی
                        </a>
                      )}

                      {/* Admin Edit */}
                      <a 
                        href={`/admin/artists/${artist.id}/edit`} 
                        title="ویرایش مستقیم هنرمند" 
                        className="text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                      >
                        ✏️
                      </a>

                      {/* Reset Credentials */}
                      <button 
                        onClick={() => {
                          setSelectedArtistForPassword(artist);
                          setNewEmail(artist.email || '');
                          setNewPassword('');
                        }} 
                        title="تنظیمات رمز عبور و ورود" 
                        className="text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg transition-colors"
                      >
                        🔑
                      </button>

                      {/* Delete Button (Red X as requested) */}
                      {artist.status !== 'DELETED' && (
                        <button 
                          onClick={() => handleSoftDelete(artist.id, artist.name)} 
                          title="حذف هنرمند" 
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors font-black text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* National Card Image Preview Modal */}
      {previewCardImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full text-center relative shadow-2xl">
            <button
              onClick={() => setPreviewCardImage(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
            >
              ✕
            </button>
            <h4 className="text-base font-black text-slate-800 mb-4">تصویر کارت ملی هنرمند</h4>
            <div className="rounded-2xl overflow-hidden border border-slate-200 mb-4 bg-slate-100 max-h-[70vh] flex items-center justify-center">
              <img src={previewCardImage} alt="National Card" className="max-w-full max-h-[65vh] object-contain" />
            </div>
            <button
              onClick={() => setPreviewCardImage(null)}
              className="bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-slate-700 transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {selectedArtistForPassword && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">تنظیمات ورود هنرمند</h3>
            <p className="text-sm text-slate-500 mb-6">بروزرسانی ایمیل و رمز عبور برای: <span className="font-bold text-slate-700">{selectedArtistForPassword.name}</span></p>
            
            <form onSubmit={handleChangePassword} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">ایمیل</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-left"
                  dir="ltr"
                  placeholder="ایمیل هنرمند"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">رمز عبور جدید <span className="text-slate-400 font-normal text-xs">(اختیاری)</span></label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-left"
                  dir="ltr"
                  placeholder="در صورت عدم نیاز، خالی بگذارید"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setSelectedArtistForPassword(null); setNewPassword(''); setNewEmail(''); }} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">انصراف</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors">ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminPromptModal 
        isOpen={promptModalOpen}
        title="دلیل غیرفعال‌سازی هنرمند"
        placeholder="دلیل خود را وارد کنید (اختیاری)..."
        onConfirm={handleDeactivateConfirm}
        onCancel={() => {
          setPromptModalOpen(false);
          setArtistIdForDeactivation(null);
        }}
      />
    </div>
  );
}

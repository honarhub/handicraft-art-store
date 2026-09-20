'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPromptModal from '@/app/components/AdminPromptModal';

export default function AdminArtistsPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  
  // Filter States
  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState({ id: '', name: '', specialties: '' });
  const [activeFilterField, setActiveFilterField] = useState<string | null>(null);
  
  const [selectedArtistForPassword, setSelectedArtistForPassword] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [artistIdForDeactivation, setArtistIdForDeactivation] = useState<string | null>(null);

  // دریافت اطلاعات واقعی از دیتابیس
  useEffect(() => {
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
  }, []);

  const handleSoftDelete = async (id: string) => {
    const confirm = window.confirm('آیا از بایگانی کردن این هنرمند اطمینان دارید؟');
    if (confirm) {
      try {
        const res = await fetch(`/api/artists/${id}`, { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete' })
        });
        if (!res.ok) throw new Error('خطا در حذف هنرمند');
        
        setArtists(artists.map(a => a.id === id ? { ...a, status: 'DELETED', isActive: false } : a));
      } catch (error) {
        alert('عملیات با خطا مواجه شد');
      }
    }
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      // اگر در حال فعال بودن است و می‌خواهیم غیرفعال کنیم، مودال دلیل باز شود
      setArtistIdForDeactivation(id);
      setPromptModalOpen(true);
    } else {
      // اگر غیرفعال است و می‌خواهیم فعال کنیم، مستقیما انجام می‌شود
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
      
      setArtists(artists.map(a => a.id === id ? { 
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

  const handleApprove = async (id: string) => {
    if (!window.confirm('آیا از تایید این هنرمند اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/artists/${id}/approve`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('خطا در تایید هنرمند');
      
      setArtists(artists.map(a => a.id === id ? { ...a, isApproved: true, isActive: true } : a));
      window.location.reload();
    } catch (error) {
      alert('عملیات با خطا مواجه شد');
    }
  };

  const handleRejectRegistration = async (id: string) => {
    if (!window.confirm('آیا از رد ثبت‌نام و حذف کامل این حساب کاربری اطمینان دارید؟\nاین عملیات ایمیل کاربر را برای ثبت‌نام مجدد آزاد می‌کند.')) return;
    try {
      const res = await fetch(`/api/artists/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejectRegistration' })
      });
      if (!res.ok) throw new Error('خطا در رد هنرمند');
      
      setArtists(artists.filter(a => a.id !== id));
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
      
      // Update local state to reflect email change
      setArtists(artists.map(a => a.id === selectedArtistForPassword.id ? { ...a, email: newEmail } : a));
      
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

  // فیلتر کردن لیست (Fuzzy Search)
  const filteredArtists = artists.filter(artist => {
    if (showArchived && artist.status !== 'DELETED') return false;
    
    const matchGlobal = globalSearch === '' || 
      artist.name.toLowerCase().includes(globalSearch.toLowerCase()) || 
      (artist.email && artist.email.toLowerCase().includes(globalSearch.toLowerCase()));
      
    const matchId = String(artist.displayId).includes(filters.id);
    const matchName = artist.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchSpec = (artist.specialties || []).map((s: any) => s.name).join(' ').toLowerCase().includes(filters.specialties.toLowerCase());
    
    return matchGlobal && matchId && matchName && matchSpec;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">مدیریت هنرمندان</h2>
          <p className="text-slate-500 mt-1 text-sm">لیست تمامی هنرمندان و سازندگان آثار سایت</p>
        </div>
        
        <div className="flex-1 max-w-sm mx-8">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text" 
              placeholder="جستجوی نام یا ایمیل هنرمند..." 
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
            <input 
              type="checkbox" 
              checked={showArchived} 
              onChange={e => setShowArchived(e.target.checked)} 
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" 
            />
            نمایش بایگانی شده‌ها
          </label>
          <a href="/admin/artists/new" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>ثبت هنرمند جدید</span>
          </a>
        </div>
      </div>

      {/* بخش هنرمندان در انتظار تایید ثبت‌نام */}
      {artists.some(a => !a.isApproved && a.status !== 'DELETED') && (
        <div className="mb-10 bg-red-50 border border-red-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h3 className="text-lg font-bold text-red-900">ثبت‌نام‌های در انتظار تایید ({artists.filter(a => !a.isApproved && a.status !== 'DELETED').length})</h3>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-red-50/50 text-red-800 font-bold border-b border-red-100">
                <tr>
                  <th className="px-6 py-4">نام هنرمند و ایمیل</th>
                  <th className="px-6 py-4">تخصص‌ها</th>
                  <th className="px-6 py-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {artists.filter(a => !a.isApproved && a.status !== 'DELETED').map((artist) => (
                  <tr key={artist.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{artist.name}</div>
                      <div className="text-xs text-slate-500 mt-1" dir="ltr">{artist.email || 'ندارد'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {artist.specialties && artist.specialties.length > 0 ? artist.specialties.map((s: any) => (
                          <span key={s.id} className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                            {s.name}
                          </span>
                        )) : <span className="text-slate-400 text-xs">نامشخص</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleApprove(artist.id)} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm shadow-emerald-200">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          تایید
                        </button>
                        <button onClick={() => handleRejectRegistration(artist.id)} className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          رد کردن
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

      {artists.some(a => a.hasPendingEdits) && (
        <div className="mb-10 bg-yellow-50 border border-yellow-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
            <h3 className="text-lg font-bold text-yellow-900">درخواست‌های ویرایش پروفایل ({artists.filter(a => a.hasPendingEdits).length})</h3>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 overflow-hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-yellow-50/50 text-yellow-800 font-bold border-b border-yellow-100">
                <tr>
                  <th className="px-6 py-4">نام هنرمند و ایمیل</th>
                  <th className="px-6 py-4">تخصص‌ها</th>
                  <th className="px-6 py-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-100">
                {artists.filter(a => a.hasPendingEdits).map((artist) => (
                  <tr key={artist.id} className="hover:bg-yellow-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{artist.name}</div>
                      <div className="text-xs text-slate-500 mt-1" dir="ltr">{artist.email || 'ندارد'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {artist.specialties && artist.specialties.length > 0 ? artist.specialties.map((s: any) => (
                          <span key={s.id} className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                            {s.name}
                          </span>
                        )) : <span className="text-slate-400 text-xs">نامشخص</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <a href={`/admin/artists/${artist.id}/review-edits`} className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                        بررسی تغییرات
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-right text-sm relative">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    آیدی
                    <button onClick={() => toggleFilter('id')} className="text-slate-400 hover:text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                  </div>
                  {activeFilterField === 'id' && (
                    <input type="text" placeholder="جستجو آیدی..." className="mt-2 text-xs p-1.5 border border-slate-300 rounded-md w-full font-normal focus:ring-2 focus:ring-blue-500 focus:outline-none" value={filters.id} onChange={e => setFilters({...filters, id: e.target.value})} />
                  )}
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    نام هنرمند / ایمیل
                    <button onClick={() => toggleFilter('name')} className="text-slate-400 hover:text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                  </div>
                  {activeFilterField === 'name' && (
                    <input type="text" placeholder="جستجو نام..." className="mt-2 text-xs p-1.5 border border-slate-300 rounded-md w-full font-normal focus:ring-2 focus:ring-blue-500 focus:outline-none" value={filters.name} onChange={e => setFilters({...filters, name: e.target.value})} />
                  )}
                </th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    تخصص‌ها
                    <button onClick={() => toggleFilter('specialties')} className="text-slate-400 hover:text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                  </div>
                  {activeFilterField === 'specialties' && (
                    <input type="text" placeholder="جستجو تخصص..." className="mt-2 text-xs p-1.5 border border-slate-300 rounded-md w-full font-normal focus:ring-2 focus:ring-blue-500 focus:outline-none" value={filters.specialties} onChange={e => setFilters({...filters, specialties: e.target.value})} />
                  )}
                </th>
                <th className="px-6 py-4 text-center">تعداد آثار</th>
                <th className="px-6 py-4 text-center">وضعیت نمایش</th>
                <th className="px-6 py-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArtists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-medium">هیچ هنرمندی با این مشخصات یافت نشد.</td>
                </tr>
              ) : filteredArtists.map((artist) => (
                <tr key={artist.id} className={`hover:bg-slate-50 transition-colors ${artist.status === 'DELETED' ? 'opacity-60 bg-slate-100 grayscale-[30%]' : ''}`}>
                  <td className="px-6 py-4 font-black text-slate-400 text-center w-16 text-lg">{artist.displayId}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {artist.name}
                      {artist.hasPendingEdits && (
                        <span title="درخواست ویرایش پروفایل دارد" className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1" dir="ltr">{artist.email || 'بدون ایمیل'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {artist.specialties && artist.specialties.length > 0 ? artist.specialties.map((s: any) => (
                        <span key={s.id} className={`text-[10px] font-bold px-2 py-1 rounded-md ${s.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
                          {s.name}
                        </span>
                      )) : <span className="text-slate-400 text-xs">نامشخص</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">{artist.productsCount}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5">
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
                      {artist.status === 'DELETED' && !artist.isActive && (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            غیرفعال
                          </span>
                          <span className="block mt-1.5 text-[10px] text-red-500 font-black">بایگانی شده</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex justify-end items-center gap-3">
                      <a href={`/artist/${artist.id}`} target="_blank" className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-transparent hover:border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        مشاهده
                      </a>
                      
                      {artist.hasPendingEdits && (
                        <a href={`/admin/artists/${artist.id}/review-edits`} title="بررسی درخواست ویرایش" className="text-yellow-600 hover:bg-yellow-50 p-2 rounded-lg transition-colors border border-transparent hover:border-yellow-100 animate-pulse">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                        </a>
                      )}

                      <a href={`/admin/artists/${artist.id}/edit`} title="ویرایش هنرمند" className="text-emerald-500 hover:bg-emerald-50 p-2 rounded-lg transition-colors border border-transparent hover:border-emerald-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </a>

                      {artist.status !== 'DELETED' && (
                        <>
                          <button onClick={() => {
                            setSelectedArtistForPassword(artist);
                            setNewEmail(artist.email || '');
                            setNewPassword('');
                          }} title="تنظیمات ورود هنرمند" className="text-purple-500 hover:bg-purple-50 p-2 rounded-lg transition-colors border border-transparent hover:border-purple-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          </button>
                          
                          <button onClick={() => handleSoftDelete(artist.id)} title="بایگانی / حذف نرم" className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
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
      </div>

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

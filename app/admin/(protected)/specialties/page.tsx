'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminPromptModal from '@/app/components/AdminPromptModal';

type Specialty = {
  id: string;
  name: string;
  isApproved: boolean;
  createdAt: string;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  children?: { id: string; name: string }[];
  artists?: { user: { name: string } }[];
};

export default function AdminSpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING' | 'MASTERS' | 'CHILDREN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal for editing specialty name
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, id: string, name: string}>({isOpen: false, id: '', name: ''});
  
  // Modal for changing parent category
  const [parentModalConfig, setParentModalConfig] = useState<{isOpen: boolean, id: string, currentParentId: string | null, name: string}>({
    isOpen: false,
    id: '',
    currentParentId: null,
    name: ''
  });

  // New specialty creation form states
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecParentId, setNewSpecParentId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchSpecialties = () => {
    fetch('/api/specialties?admin=true')
      .then(res => res.json())
      .then(data => {
        setSpecialties(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  // List of master categories (parentId is null)
  const masterCategories = useMemo(() => {
    return specialties.filter(s => !s.parentId);
  }, [specialties]);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/specialties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentStatus })
      });
      if (res.ok) {
        setSpecialties(prev => prev.map(s => s.id === id ? { ...s, isApproved: !currentStatus } : s));
        window.dispatchEvent(new CustomEvent('admin-counts-update'));
      }
    } catch (error) {
      alert('خطا در تغییر وضعیت');
    }
  };

  const handleEditSpecialty = (id: string, currentName: string) => {
    setModalConfig({ isOpen: true, id, name: currentName });
  };

  const submitEditSpecialty = async (newName: string) => {
    const { id, name: currentName } = modalConfig;
    setModalConfig({ ...modalConfig, isOpen: false });
    
    if (!newName || newName.trim() === '' || newName === currentName) return;
    
    try {
      const res = await fetch(`/api/specialties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (res.ok) {
        setSpecialties(prev => prev.map(s => s.id === id ? { ...s, name: newName.trim() } : s));
      } else {
        alert('خطا در بروزرسانی نام تخصص');
      }
    } catch (error) {
      alert('خطا در ارتباط با سرور');
    }
  };

  const handleChangeParent = async (id: string, newParentId: string) => {
    try {
      const res = await fetch(`/api/specialties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: newParentId ? newParentId : null })
      });
      if (res.ok) {
        const updated = await res.json();
        setSpecialties(prev => prev.map(s => s.id === id ? { ...s, parentId: updated.parentId, parent: updated.parent } : s));
        setParentModalConfig({ ...parentModalConfig, isOpen: false });
      } else {
        alert('خطا در تغییر دسته‌بندی والد');
      }
    } catch (error) {
      alert('خطا در ارتباط با سرور');
    }
  };

  const handleCreateNewSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/specialties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSpecName.trim(),
          parentId: newSpecParentId ? newSpecParentId : undefined
        })
      });

      if (res.ok) {
        const created = await res.json();
        // Since admin created it, auto-approve it
        await fetch(`/api/specialties/${created.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isApproved: true })
        });
        setNewSpecName('');
        setNewSpecParentId('');
        fetchSpecialties();
      } else {
        alert('خطا در ثبت تخصص');
      }
    } catch (error) {
      alert('خطا در ارتباط با سرور');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteSpecialty = async (id: string) => {
    if (!confirm('آیا از حذف این تخصص اطمینان دارید؟ اگر این دسته والد باشد، اتصال زیرمجموعه‌ها قطع می‌شود.')) return;
    try {
      const res = await fetch(`/api/specialties/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSpecialties(prev => prev.filter(s => s.id !== id));
      }
    } catch (error) {
      alert('خطا در حذف');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold" dir="rtl">در حال دریافت تخصص‌ها...</div>;

  const pendingCount = specialties.filter(s => !s.isApproved).length;

  const filteredSpecialties = specialties.filter(item => {
    if (filterMode === 'PENDING' && item.isApproved) return false;
    if (filterMode === 'MASTERS' && item.parentId !== null) return false;
    if (filterMode === 'CHILDREN' && item.parentId === null) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchParent = item.parent?.name.toLowerCase().includes(q);
      return matchName || matchParent;
    }
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans" dir="rtl">
      {/* Edit Name Modal */}
      <AdminPromptModal 
        isOpen={modalConfig.isOpen}
        title="ویرایش نام تخصص"
        initialValue={modalConfig.name}
        onConfirm={submitEditSpecialty}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />

      {/* Change Parent Category Modal */}
      {parentModalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-2">تغییر دسته‌بندی والد</h3>
            <p className="text-xs text-slate-500 mb-4">
              انتخاب دسته‌بندی والد جدید برای تخصص «<strong className="text-purple-600">{parentModalConfig.name}</strong>»:
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">دسته‌بندی والد:</label>
                <select
                  defaultValue={parentModalConfig.currentParentId || ''}
                  id="parentSelectInput"
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                >
                  <option value="">بدون والد (تبدیل به دسته اصلی)</option>
                  {masterCategories
                    .filter(m => m.id !== parentModalConfig.id)
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setParentModalConfig({ ...parentModalConfig, isOpen: false })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const select = document.getElementById('parentSelectInput') as HTMLSelectElement;
                    handleChangeParent(parentModalConfig.id, select.value);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-md transition cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>مدیریت درختواره تخصص‌ها و دسته‌بندی‌های هنری</span>
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            تنظیم ساختار ۲ سطحی دسته‌ها (دسته‌بندی‌های اصلی و زیرمجموعه‌ها)، بررسی و تایید تخصص‌های پیشنهادی هنرمندان
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{pendingCount} هنر جدید نیازمند بررسی و تایید است</span>
          </div>
        )}
      </div>

      {/* Add New Specialty Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 mb-8">
        <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
          <span>➕ افزودن دسته‌بندی یا تخصص جدید</span>
        </h4>
        <form onSubmit={handleCreateNewSpecialty} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newSpecName}
            onChange={e => setNewSpecName(e.target.value)}
            placeholder="نام تخصص یا هنر (مثلاً: نگارگری روی چوب)..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-purple-500 outline-none"
            required
          />
          <select
            value={newSpecParentId}
            onChange={e => setNewSpecParentId(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-purple-500 outline-none"
          >
            <option value="">دسته اصلی (سطح ۱ - والد)</option>
            {masterCategories.map(m => (
              <option key={m.id} value={m.id}>
                زیرمجموعه «{m.name}»
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isCreating || !newSpecName.trim()}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isCreating ? 'در حال ثبت...' : 'افزودن به لیست'}
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-4">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${filterMode === 'ALL' ? 'bg-white text-purple-700 shadow-xs' : 'hover:text-slate-900'}`}
          >
            همه تخصص‌ها ({specialties.length})
          </button>
          <button
            onClick={() => setFilterMode('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filterMode === 'PENDING' ? 'bg-white text-amber-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            در انتظار تایید ({pendingCount})
          </button>
          <button
            onClick={() => setFilterMode('MASTERS')}
            className={`px-3 py-1.5 rounded-lg transition ${filterMode === 'MASTERS' ? 'bg-white text-purple-700 shadow-xs' : 'hover:text-slate-900'}`}
          >
            دسته‌های اصلی ({masterCategories.length})
          </button>
          <button
            onClick={() => setFilterMode('CHILDREN')}
            className={`px-3 py-1.5 rounded-lg transition ${filterMode === 'CHILDREN' ? 'bg-white text-purple-700 shadow-xs' : 'hover:text-slate-900'}`}
          >
            زیرمجموعه‌ها ({specialties.length - masterCategories.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام یا دسته والد..."
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Specialties Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <table className="w-full text-right text-xs text-slate-600">
          <thead className="text-[11px] text-slate-500 bg-slate-50 border-b border-slate-100 uppercase">
            <tr>
              <th className="px-6 py-4 font-black">نام تخصص / هنر</th>
              <th className="px-6 py-4 font-black">دسته‌بندی والد (سطح ۱)</th>
              <th className="px-6 py-4 font-black">درخواست‌دهنده</th>
              <th className="px-6 py-4 font-black">وضعیت</th>
              <th className="px-6 py-4 font-black text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSpecialties.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  موردی با این مشخصات یافت نشد.
                </td>
              </tr>
            ) : (
              filteredSpecialties.map(specialty => {
                const isMaster = specialty.parentId === null;
                return (
                  <tr
                    key={specialty.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      !specialty.isApproved ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {/* Name */}
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        {isMaster && (
                          <span className="text-purple-600 font-bold" title="دسته اصلی">📁</span>
                        )}
                        <span>{specialty.name}</span>
                        {isMaster && specialty.children && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                            {specialty.children.length} زیرمجموعه
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Parent */}
                    <td className="px-6 py-4">
                      {isMaster ? (
                        <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg text-[11px] font-black inline-flex items-center gap-1">
                          ★ دسته اصلی (سطح ۱)
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">
                            {specialty.parent ? specialty.parent.name : '—'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setParentModalConfig({
                                isOpen: true,
                                id: specialty.id,
                                currentParentId: specialty.parentId || null,
                                name: specialty.name
                              })
                            }
                            className="text-[10px] text-purple-600 hover:text-purple-800 underline cursor-pointer"
                          >
                            تغییر
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Requester */}
                    <td className="px-6 py-4 text-slate-600">
                      {specialty.artists && specialty.artists.length > 0 ? (
                        specialty.artists.map(a => a.user.name).join('، ')
                      ) : (
                        <span className="text-slate-400 italic">پیش‌فرض سیستم</span>
                      )}
                    </td>

                    {/* Status Toggle Switch (Exact match to artists & blog) */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <button 
                          type="button"
                          dir="ltr"
                          onClick={() => toggleApproval(specialty.id, specialty.isApproved)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${specialty.isApproved ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          title={specialty.isApproved ? 'لغو تایید (غیرفعال کردن انتشار)' : 'تایید و انتشار تخصص'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              specialty.isApproved ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[10px] font-bold text-slate-400">
                          {specialty.isApproved ? 'تایید شده' : 'در انتظار بررسی'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit specialty */}
                        <button
                          type="button"
                          onClick={() => handleEditSpecialty(specialty.id, specialty.name)}
                          className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors border border-transparent hover:border-emerald-100 cursor-pointer"
                          title="ویرایش نام تخصص"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>

                        {/* Change Parent Category */}
                        <button
                          type="button"
                          onClick={() =>
                            setParentModalConfig({
                              isOpen: true,
                              id: specialty.id,
                              currentParentId: specialty.parentId || null,
                              name: specialty.name
                            })
                          }
                          className="px-2.5 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="تغییر دسته والد"
                        >
                          تغییر والد
                        </button>

                        {/* Delete specialty */}
                        <button
                          type="button"
                          onClick={() => deleteSpecialty(specialty.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                          title="حذف تخصص"
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

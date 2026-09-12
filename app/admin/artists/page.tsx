'use client';

import React, { useState, useEffect } from 'react';

export default function AdminArtistsPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [filters, setFilters] = useState({ id: '', name: '', specialties: '' });
  const [activeFilterField, setActiveFilterField] = useState<string | null>(null);

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

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleActive', isActive: nextStatus })
      });
      if (!res.ok) throw new Error('خطا در تغییر وضعیت');
      
      setArtists(artists.map(a => a.id === id ? { 
        ...a, 
        isActive: nextStatus,
        status: nextStatus ? 'ACTIVE' : a.status // Remove archive status if turning active
      } : a));
    } catch (error) {
      alert('خطا در تغییر وضعیت هنرمند');
    }
  };

  const toggleFilter = (field: string) => {
    setActiveFilterField(activeFilterField === field ? null : field);
  };

  // فیلتر کردن لیست (Fuzzy Search)
  const filteredArtists = artists.filter(artist => {
    const matchId = String(artist.displayId).includes(filters.id);
    const matchName = artist.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchSpec = artist.specialties.toLowerCase().includes(filters.specialties.toLowerCase());
    return matchId && matchName && matchSpec;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">مدیریت هنرمندان</h2>
          <p className="text-slate-500 mt-1 text-sm">لیست تمامی هنرمندان و سازندگان آثار سایت</p>
        </div>
        <a href="/admin/artists/new" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>ثبت هنرمند جدید</span>
        </a>
      </div>

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
                    نام هنرمند
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
                <tr key={artist.id} className={`hover:bg-slate-50 transition-colors ${artist.status === 'DELETED' ? 'opacity-60 bg-slate-50' : ''}`}>
                  <td className="px-6 py-4 font-black text-slate-400 text-center w-16 text-lg">{artist.displayId}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{artist.name}</td>
                  <td className="px-6 py-4 text-slate-600">{artist.specialties}</td>
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
                        <span className="text-slate-500 font-bold text-[10px] bg-slate-200 px-2 py-0.5 rounded-md">بایگانی شده</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex justify-end items-center gap-3">
                      <a href={`/artist/${artist.id}`} target="_blank" className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-transparent hover:border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        مشاهده پروفایل
                      </a>
                      
                      <a href={`/admin/artists/${artist.id}/edit`} title="ویرایش هنرمند" className="text-emerald-500 hover:bg-emerald-50 p-2 rounded-lg transition-colors border border-transparent hover:border-emerald-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </a>

                      {artist.status !== 'DELETED' && (
                        <button onClick={() => handleSoftDelete(artist.id)} title="بایگانی / حذف نرم" className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
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
    </div>
  );
}

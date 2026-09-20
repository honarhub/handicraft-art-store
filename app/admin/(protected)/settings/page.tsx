'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChangePasswordForm from '@/app/components/ChangePasswordForm';

export type RowType = 'SPECIALTY' | 'ARTIST' | 'PRICE_UNDER' | 'PRICE_OVER' | 'CHEAPEST' | 'EXPENSIVE' | 'NEWEST';

export interface DynamicRow {
  id: string;
  type: RowType;
  value: string;
  title: string;
  subtitle?: string;
  isActive: boolean;
  order: number;
}

export default function AdminSettingsPage() {
// ... (I will use multi_replace for this to be safer)
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [dynamicRows, setDynamicRows] = useState<DynamicRow[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/specialties').then(r => r.json()),
      fetch('/api/artists').then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json())
    ]).then(([specialtiesData, artistsData, settingsData]) => {
      setSpecialties(specialtiesData.filter((s: any) => s.isApproved));
      setArtists(artistsData.filter((a: any) => a.isActive && !a.isDeleted));
      if (settingsData && settingsData.dynamicRows) {
        setDynamicRows(typeof settingsData.dynamicRows === 'string' ? JSON.parse(settingsData.dynamicRows) : settingsData.dynamicRows);
      }
    }).catch(err => console.error('Error fetching data:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddRow = () => {
    const newRow: DynamicRow = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'ردیف جدید',
      subtitle: 'منتخبی از بهترین آثار برای شما',
      type: 'NEWEST',
      value: '',
      isActive: true,
      order: dynamicRows.length
    };
    setDynamicRows([...dynamicRows, newRow]);
  };

  const handleUpdateRow = (index: number, updates: Partial<DynamicRow>) => {
    const newRows = [...dynamicRows];
    newRows[index] = { ...newRows[index], ...updates };
    setDynamicRows(newRows);
  };

  const handleRemoveRow = (index: number) => {
    const newRows = [...dynamicRows];
    newRows.splice(index, 1);
    setDynamicRows(newRows);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newRows = [...dynamicRows];
    const temp = newRows[index - 1];
    newRows[index - 1] = newRows[index];
    newRows[index] = temp;
    // Update order values
    newRows.forEach((r, i) => r.order = i);
    setDynamicRows(newRows);
  };

  const handleMoveDown = (index: number) => {
    if (index === dynamicRows.length - 1) return;
    const newRows = [...dynamicRows];
    const temp = newRows[index + 1];
    newRows[index + 1] = newRows[index];
    newRows[index] = temp;
    // Update order values
    newRows.forEach((r, i) => r.order = i);
    setDynamicRows(newRows);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dynamicRows })
      });
      if (!res.ok) throw new Error('خطا در ذخیره تنظیمات');
      alert('تنظیمات با موفقیت ذخیره شد.');
      router.refresh();
    } catch (error) {
      alert('مشکلی پیش آمد.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">در حال بارگذاری...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">صفحه‌ساز لندینگ پیج</h2>
          <p className="text-slate-500 mt-1 text-sm">مدیریت ردیف‌های پویا در صفحه اصلی (اسلایدرهای محصولات)</p>
        </div>
        <button onClick={handleAddRow} className="bg-purple-100 text-purple-700 hover:bg-purple-200 font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          افزودن ردیف جدید
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-4">
            {dynamicRows.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-medium">
                هیچ ردیفی اضافه نشده است. برای شروع "افزودن ردیف جدید" را بزنید.
              </div>
            ) : (
              dynamicRows.map((row, index) => (
                <div key={row.id} className={`p-5 rounded-2xl border ${row.isActive ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-slate-100 opacity-60'} flex flex-col md:flex-row gap-4 relative transition-all`}>
                  
                  {/* Controls */}
                  <div className="flex md:flex-col gap-2 justify-center items-center md:border-l border-slate-200 md:pl-4">
                    <button type="button" onClick={() => handleMoveUp(index)} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </button>
                    <button type="button" onClick={() => handleMoveDown(index)} disabled={index === dynamicRows.length - 1} className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-slate-500 mb-1">عنوان نمایشی</label>
                      <input 
                        type="text" 
                        value={row.title}
                        onChange={(e) => handleUpdateRow(index, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-purple-500 outline-none text-sm font-bold text-slate-800 mb-2"
                        placeholder="مثلا: محصولات شگفت‌انگیز"
                        required
                      />
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">زیرعنوان (اختیاری)</label>
                      <input 
                        type="text" 
                        value={row.subtitle || ''}
                        onChange={(e) => handleUpdateRow(index, { subtitle: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-purple-400 outline-none text-xs text-slate-600 bg-slate-50"
                        placeholder="مثلا: منتخبی از بهترین آثار برای شما"
                      />
                    </div>
                    
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-500 mb-1">نوع ردیف</label>
                      <select 
                        value={row.type}
                        onChange={(e) => handleUpdateRow(index, { type: e.target.value as RowType, value: '' })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-purple-500 outline-none text-sm font-medium"
                      >
                        <option value="NEWEST">جدیدترین‌ها</option>
                        <option value="SPECIALTY">بر اساس دسته‌بندی</option>
                        <option value="ARTIST">بر اساس هنرمند</option>
                        <option value="PRICE_UNDER">ارزان‌تر از (تومان)</option>
                        <option value="PRICE_OVER">گران‌تر از (تومان)</option>
                        <option value="CHEAPEST">ارزان‌ترین‌ها</option>
                        <option value="EXPENSIVE">گران‌ترین‌ها</option>
                      </select>
                    </div>

                    <div className="md:col-span-5">
                      <label className="block text-xs font-bold text-slate-500 mb-1">مقدار فیلتر (بسته به نوع)</label>
                      
                      {row.type === 'SPECIALTY' && (
                        <select 
                          value={row.value}
                          onChange={(e) => handleUpdateRow(index, { value: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-purple-500 outline-none text-sm font-medium"
                          required
                        >
                          <option value="">-- انتخاب دسته‌بندی --</option>
                          {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      )}

                      {row.type === 'ARTIST' && (
                        <select 
                          value={row.value}
                          onChange={(e) => handleUpdateRow(index, { value: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-purple-500 outline-none text-sm font-medium"
                          required
                        >
                          <option value="">-- انتخاب هنرمند --</option>
                          {artists.map(a => <option key={a.id} value={a.id}>{a.name || 'هنرمند بی‌نام'}</option>)}
                        </select>
                      )}

                      {(row.type === 'PRICE_UNDER' || row.type === 'PRICE_OVER') && (
                        <input 
                          type="number" 
                          value={row.value}
                          onChange={(e) => handleUpdateRow(index, { value: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-purple-500 outline-none text-sm font-medium"
                          placeholder="مبلغ به تومان (مثلا 1000000)"
                          required
                        />
                      )}

                      {(row.type === 'NEWEST' || row.type === 'CHEAPEST' || row.type === 'EXPENSIVE') && (
                        <div className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-sm text-slate-400 font-medium">
                          نیازی به مقدار ندارد
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col justify-end gap-2 md:border-r border-slate-200 md:pr-4">
                    <button type="button" onClick={() => handleUpdateRow(index, { isActive: !row.isActive })} title={row.isActive ? 'غیرفعال کردن' : 'فعال کردن'} className={`p-2 rounded-lg transition-colors ${row.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                      {row.isActive ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      )}
                    </button>
                    <button type="button" onClick={() => handleRemoveRow(index)} title="حذف ردیف" className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-10 rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره صفحه‌ساز'}
            </button>
          </div>
        </form>
      </div>
      
      <ChangePasswordForm />
    </div>
  );
}

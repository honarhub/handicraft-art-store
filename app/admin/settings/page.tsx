'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [featuredSpecialtyId, setFeaturedSpecialtyId] = useState<string>('');

  useEffect(() => {
    // Fetch specialties
    fetch('/api/specialties')
      .then(res => res.json())
      .then(data => {
        setSpecialties(data.filter((s: any) => s.isApproved));
      })
      .catch(err => console.error('Error fetching specialties:', err));

    // Fetch current settings
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.featuredSpecialtyId) {
          setFeaturedSpecialtyId(data.featuredSpecialtyId);
        }
      })
      .catch(err => console.error('Error fetching settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredSpecialtyId: featuredSpecialtyId || null })
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
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">تنظیمات سایت</h2>
        <p className="text-slate-500 mt-1 text-sm">مدیریت بخش‌های پویا در صفحه اصلی</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">دسته‌بندی (تخصص) ویژه در صفحه اصلی</label>
            <p className="text-xs text-slate-500 mb-4">با انتخاب یک دسته‌بندی، یک ردیف کامل از محصولات آن در صفحه اصلی سایت به کاربران نمایش داده می‌شود.</p>
            
            <select 
              value={featuredSpecialtyId} 
              onChange={e => setFeaturedSpecialtyId(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none font-bold text-slate-700"
            >
              <option value="">-- عدم نمایش دسته‌بندی ویژه --</option>
              {specialties.map(spec => (
                <option key={spec.id} value={spec.id}>{spec.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

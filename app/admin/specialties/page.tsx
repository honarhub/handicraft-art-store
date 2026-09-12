'use client';
import React, { useState, useEffect } from 'react';

type Specialty = {
  id: string;
  name: string;
  isApproved: boolean;
  createdAt: string;
  artists?: { user: { name: string } }[];
};

export default function AdminSpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/specialties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentStatus })
      });
      if (res.ok) {
        setSpecialties(prev => prev.map(s => s.id === id ? { ...s, isApproved: !currentStatus } : s));
      }
    } catch (error) {
      alert('خطا در تغییر وضعیت');
    }
  };

  const deleteSpecialty = async (id: string) => {
    if (!confirm('آیا از حذف این تخصص اطمینان دارید؟')) return;
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

  if (loading) return <div className="p-8 text-center" dir="rtl">در حال دریافت...</div>;

  const pendingCount = specialties.filter(s => !s.isApproved).length;

  return (
    <div className="p-8 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">مدیریت تخصص‌ها (Taxonomy)</h2>
          <p className="text-slate-500 mt-1 text-sm">بررسی و تایید تخصص‌های جدید پیشنهاد شده توسط هنرمندان</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl font-bold text-sm">
            {pendingCount} تخصص جدید نیاز به بررسی دارد
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right text-sm text-slate-600">
          <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase">
            <tr>
              <th className="px-6 py-4 font-bold">نام تخصص</th>
              <th className="px-6 py-4 font-bold">درخواست دهنده</th>
              <th className="px-6 py-4 font-bold">وضعیت</th>
              <th className="px-6 py-4 font-bold">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {specialties.map(specialty => (
              <tr key={specialty.id} className={`hover:bg-slate-50 transition-colors ${!specialty.isApproved ? 'bg-yellow-50/30' : ''}`}>
                <td className="px-6 py-4 font-bold text-slate-800">{specialty.name}</td>
                <td className="px-6 py-4 text-slate-600">
                  {specialty.artists && specialty.artists.length > 0
                    ? specialty.artists.map(a => a.user.name).join('، ')
                    : <span className="text-slate-400 italic">پیش‌فرض سیستم</span>}
                </td>
                <td className="px-6 py-4">
                  {specialty.isApproved ? (
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold">تایید شده / پیش‌فرض</span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">در انتظار بررسی</span>
                  )}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => toggleApproval(specialty.id, specialty.isApproved)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${specialty.isApproved ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md'}`}>
                    {specialty.isApproved ? 'لغو تایید' : 'تایید و انتشار'}
                  </button>
                  <button onClick={() => deleteSpecialty(specialty.id)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors">
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

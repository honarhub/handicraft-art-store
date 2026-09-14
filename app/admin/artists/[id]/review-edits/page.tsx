'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ReviewArtistEditsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Re-use the existing GET /api/artists API and filter, or create a single fetch
    fetch('/api/artists')
      .then(res => res.json())
      .then(data => {
        const found = data.find((a: any) => a.id === id);
        // We actually need the full artist profile including pendingEdits, 
        // which might not be returned in the list API fully.
        // Let's fetch from the exact artist API.
        fetch(`/api/artists/${id}`)
          .then(res2 => res2.json())
          .then(fullArtist => {
             setArtist(fullArtist);
             setLoading(false);
          })
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleAction = async (actionType: 'approveEdits' | 'rejectEdits') => {
    let feedback = '';
    if (actionType === 'rejectEdits') {
      const reason = window.prompt('لطفا دلیل رد کردن این تغییرات را برای هنرمند بنویسید:');
      if (reason === null) return;
      feedback = reason;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, adminFeedback: feedback })
      });

      if (!res.ok) throw new Error('Action failed');
      
      alert(actionType === 'approveEdits' ? 'تغییرات تایید و اعمال شد' : 'درخواست رد شد');
      router.push('/admin/artists');
    } catch (err) {
      alert('خطا در انجام عملیات');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">در حال بارگذاری اطلاعات...</div>;
  if (!artist || !artist.pendingEdits) return <div className="p-8 text-center text-red-500 font-bold">درخواستی برای بررسی وجود ندارد</div>;

  const current = {
    name: artist.user?.name || '',
    bio: artist.bio || '',
    portfolioUrl: artist.portfolioUrl || '',
    image: artist.user?.image || null,
    specialties: artist.specialties?.map((s: any) => s.name).join('، ') || ''
  };

  const pending = {
    ...artist.pendingEdits,
    specialties: artist.pendingEdits?.specialties ? artist.pendingEdits.specialties.map((s: any) => s.name).join('، ') : undefined
  };

  const DiffField = ({ label, oldVal, newVal, isImage = false }: { label: string, oldVal: string, newVal: string, isImage?: boolean }) => {
    // If newVal is undefined, it means this field was not part of the pending edits (or didn't change).
    const isChanged = oldVal !== newVal && newVal !== undefined;
    if (!isChanged) return null;

    return (
      <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <h4 className="font-bold text-slate-700 mb-4">{label}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-100">
            <span className="text-xs font-bold text-red-600 block mb-2">مقدار قبلی:</span>
            {isImage ? (
              oldVal ? <img src={oldVal} alt="Old" className="w-16 h-16 rounded-lg object-cover" /> : <span className="text-slate-400">بدون تصویر</span>
            ) : (
              <p className="whitespace-pre-wrap">{oldVal || <span className="text-slate-400">خالی</span>}</p>
            )}
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
            <span className="text-xs font-bold text-emerald-600 block mb-2">مقدار جدید (پیشنهادی):</span>
            {isImage ? (
              newVal ? <img src={newVal} alt="New" className="w-16 h-16 rounded-lg object-cover" /> : <span className="text-slate-400">حذف تصویر</span>
            ) : (
              <p className="whitespace-pre-wrap">{newVal || <span className="text-slate-400">خالی</span>}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">بررسی درخواست ویرایش پروفایل</h2>
          <p className="text-slate-500 mt-1 text-sm">هنرمند: {current.name}</p>
        </div>
        <button onClick={() => router.push('/admin/artists')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
          بازگشت به لیست
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8">
        <h3 className="font-bold text-lg text-slate-800 mb-6">تغییرات یافت شده:</h3>
        
        <DiffField label="تصویر پروفایل" oldVal={current.image} newVal={pending.image} isImage={true} />
        <DiffField label="نام هنرمند" oldVal={current.name} newVal={pending.name} />
        <DiffField label="تخصص‌ها" oldVal={current.specialties} newVal={pending.specialties} />
        <DiffField label="لینک پورتفولیو" oldVal={current.portfolioUrl} newVal={pending.portfolioUrl} />
        <DiffField label="بیوگرافی" oldVal={current.bio} newVal={pending.bio} />

        <div className="flex gap-4 mt-8 pt-8 border-t border-slate-100">
          <button 
            disabled={actionLoading}
            onClick={() => handleAction('approveEdits')}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            تایید و اعمال تغییرات
          </button>
          
          <button 
            disabled={actionLoading}
            onClick={() => handleAction('rejectEdits')}
            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            رد کردن تغییرات
          </button>
        </div>
      </div>
    </div>
  );
}

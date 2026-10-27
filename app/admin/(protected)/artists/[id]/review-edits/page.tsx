'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ReviewArtistEditsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  // Field decisions: key -> { status: 'approve' | 'reject', reason: string }
  const [decisions, setDecisions] = useState<Record<string, { status: 'approve' | 'reject', reason: string }>>({});

  useEffect(() => {
    fetch(`/api/artists/${id}`)
      .then(res => res.json())
      .then(data => {
        setArtist(data);
        if (data.pendingEdits) {
          const edits = typeof data.pendingEdits === 'string' ? JSON.parse(data.pendingEdits) : data.pendingEdits;
          // Default all changed fields to 'approve'
          const initialDecisions: Record<string, { status: 'approve' | 'reject', reason: string }> = {};
          const keys = ['image', 'name', 'brandName', 'bio', 'specialties', 'portfolioUrl', 'socialLinks'];
          keys.forEach(k => {
            if (edits[k] !== undefined) {
              initialDecisions[k] = { status: 'approve', reason: '' };
            }
          });
          setDecisions(initialDecisions);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleDecisionChange = (field: string, status: 'approve' | 'reject') => {
    setDecisions(prev => ({
      ...prev,
      [field]: { ...prev[field], status }
    }));
  };

  const handleReasonChange = (field: string, reason: string) => {
    setDecisions(prev => ({
      ...prev,
      [field]: { ...prev[field], reason }
    }));
  };

  const handleApproveAll = () => {
    const updated: Record<string, { status: 'approve' | 'reject', reason: string }> = {};
    Object.keys(decisions).forEach(k => {
      updated[k] = { status: 'approve', reason: '' };
    });
    setDecisions(updated);
  };

  const handleSubmitDecisions = async () => {
    // Validate reasons for rejected fields
    const approvedFields: string[] = [];
    const rejectedFields: Record<string, string> = {};

    for (const [field, dec] of Object.entries(decisions)) {
      if (dec.status === 'approve') {
        approvedFields.push(field);
      } else {
        if (!dec.reason.trim()) {
          alert(`لطفاً دلیل رد کردن فیلد «${getFieldLabel(field)}» را وارد کنید.`);
          return;
        }
        rejectedFields[field] = dec.reason.trim();
      }
    }

    setActionLoading(true);
    setSubmitMsg('');

    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'granularReview',
          approvedFields,
          rejectedFields
        })
      });

      if (!res.ok) throw new Error('خطا در ثبت بررسی');

      alert('تصمیمات شما با موفقیت ثبت شد و به هنرمند منعکس گردید.');
      router.push('/admin/artists');
    } catch (err: any) {
      alert(err.message || 'خطا در انجام عملیات');
    } finally {
      setActionLoading(false);
    }
  };

  const getFieldLabel = (field: string) => {
    const map: Record<string, string> = {
      image: 'تصویر پروفایل',
      name: 'نام و نام خانوادگی',
      brandName: 'نام برند هنری یا استودیو',
      bio: 'درباره شما (بیوگرافی)',
      specialties: 'تخصص‌ها و رشته‌ها',
      portfolioUrl: 'لینک وب‌سایت شخصی',
      socialLinks: 'شبکه‌های اجتماعی'
    };
    return map[field] || field;
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">در حال بارگذاری اطلاعات...</div>;
  if (!artist || !artist.pendingEdits) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center" dir="rtl">
        <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200">
          <span className="text-3xl mb-2 block">ℹ️</span>
          <h3 className="font-bold text-slate-800">درخواستی برای بررسی وجود ندارد</h3>
          <p className="text-slate-500 text-sm mt-1 mb-4">تمامی تغییرات قبلاً بررسی شده‌اند یا هنرمند درخواست جدیدی ارسال نکرده است.</p>
          <button onClick={() => router.push('/admin/artists')} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs">
            بازگشت به لیست هنرمندان
          </button>
        </div>
      </div>
    );
  }

  const formatSocials = (links: any) => {
    if (!links || Object.keys(links).length === 0) return '';
    const names: Record<string, string> = { instagram: 'اینستاگرام', twitter: 'ایکس', telegram: 'تلگرام', bale: 'بله' };
    return Object.entries(links).map(([k, v]) => `${names[k] || k}: ${v}`).join('\n');
  };

  const edits = typeof artist.pendingEdits === 'string' ? JSON.parse(artist.pendingEdits) : artist.pendingEdits;

  const current = {
    name: artist.user?.name || '',
    brandName: artist.brandName || '',
    bio: artist.bio || '',
    portfolioUrl: artist.portfolioUrl || '',
    image: artist.user?.image || null,
    specialties: artist.specialties?.map((s: any) => s.name).join('، ') || '',
    socialLinks: formatSocials(artist.socialLinks)
  };

  const pending = {
    name: edits.name,
    brandName: edits.brandName,
    bio: edits.bio,
    portfolioUrl: edits.portfolioUrl,
    image: edits.image,
    specialties: edits.specialties ? edits.specialties.map((s: any) => s.name).join('، ') : undefined,
    socialLinks: edits.socialLinks ? formatSocials(edits.socialLinks) : undefined
  };

  const fieldsToCheck = [
    { key: 'image', isImage: true },
    { key: 'name' },
    { key: 'brandName' },
    { key: 'bio' },
    { key: 'specialties' },
    { key: 'portfolioUrl' },
    { key: 'socialLinks' }
  ];

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto font-sans" dir="rtl">
      
      {/* Top Bar */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">بررسی درخواست پروفایل هنرمند</h2>
          <p className="text-slate-500 mt-1 text-sm">
            هنرمند: <span className="font-bold text-slate-900">{artist.user?.name}</span> ({artist.brandName || 'بدون برند'})
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={handleApproveAll} 
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl font-bold text-xs transition-colors"
          >
            ✓ تایید همه فیلدها
          </button>
          <button 
            type="button" 
            onClick={() => router.push('/admin/artists')} 
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs transition-colors"
          >
            بازگشت به لیست
          </button>
        </div>
      </div>

      {submitMsg && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 text-sm font-bold rounded-2xl border border-emerald-200">
          {submitMsg}
        </div>
      )}

      {/* Review Cards */}
      <div className="space-y-6">
        {fieldsToCheck.map(({ key, isImage }) => {
          const oldVal = (current as any)[key];
          const newVal = (pending as any)[key];
          
          // Only show field if it was submitted or changed
          if (newVal === undefined) return null;

          const decision = decisions[key] || { status: 'approve', reason: '' };

          return (
            <div key={key} className={`bg-white rounded-3xl p-6 border shadow-xs transition-all ${
              decision.status === 'approve' ? 'border-emerald-200 ring-2 ring-emerald-500/10' : 'border-red-200 ring-2 ring-red-500/10'
            }`}>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 mb-4">
                <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <span>{getFieldLabel(key)}</span>
                </h4>

                {/* Approve / Reject Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleDecisionChange(key, 'approve')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                      decision.status === 'approve'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>✓</span>
                    <span>تایید</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecisionChange(key, 'reject')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                      decision.status === 'reject'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>✕</span>
                    <span>رد با دلیل</span>
                  </button>
                </div>
              </div>

              {/* Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 block mb-1.5">مقدار قبلی:</span>
                  {isImage ? (
                    oldVal ? <img src={oldVal} alt="Old" className="w-20 h-20 rounded-xl object-cover border" /> : <span className="text-slate-400">بدون تصویر</span>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{oldVal || <span className="text-slate-400">خالی</span>}</p>
                  )}
                </div>

                <div className="p-3.5 bg-emerald-50/60 text-slate-900 rounded-2xl border border-emerald-200 text-xs">
                  <span className="font-bold text-emerald-800 block mb-1.5">مقدار ارسالی هنرمند:</span>
                  {isImage ? (
                    newVal ? <img src={newVal} alt="New" className="w-20 h-20 rounded-xl object-cover border border-emerald-300 shadow-sm" /> : <span className="text-slate-400">بدون تصویر</span>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed font-medium">{newVal || <span className="text-slate-400">خالی</span>}</p>
                  )}
                </div>
              </div>

              {/* If Rejected, show reason input */}
              {decision.status === 'reject' && (
                <div className="mt-4 pt-4 border-t border-red-100 animate-in fade-in">
                  <label className="block text-xs font-bold text-red-700 mb-1.5">
                    دلیل رد این مورد (جهت نمایش به هنرمند) *:
                  </label>
                  <input
                    type="text"
                    value={decision.reason}
                    onChange={e => handleReasonChange(key, e.target.value)}
                    placeholder="مثال: کیفیت تصویر پایین است / متن بیوگرافی باید حرفه‌ای‌تر نوشته شود..."
                    className="w-full px-3.5 py-2.5 bg-red-50/50 border border-red-200 rounded-xl text-xs text-red-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
                    required
                  />
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Action Submit Button */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          disabled={actionLoading}
          onClick={handleSubmitDecisions}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-teal-500/20 text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {actionLoading ? 'در حال ثبت تصمیمات...' : 'ثبت نهایی تصمیمات ادمین و اعمال تغییرات'}
        </button>

        <button
          type="button"
          disabled={actionLoading}
          onClick={() => router.push('/admin/artists')}
          className="px-6 py-4 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
        >
          انصراف
        </button>
      </div>

    </div>
  );
}

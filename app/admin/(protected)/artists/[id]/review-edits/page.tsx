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

  // Decisions for changed fields: key -> { status: 'approve' | 'reject', reason: string }
  const [decisions, setDecisions] = useState<Record<string, { status: 'approve' | 'reject', reason: string }>>({});

  const formatSocials = (links: any) => {
    if (!links || typeof links !== 'object') return '';
    const names: Record<string, string> = { instagram: 'اینستاگرام', twitter: 'ایکس', telegram: 'تلگرام', bale: 'بله' };
    return Object.entries(links)
      .filter(([_, v]) => typeof v === 'string' && (v as string).trim().length > 0)
      .map(([k, v]) => `${names[k] || k}: ${v}`)
      .join('\n');
  };

  const getFieldLabel = (field: string) => {
    const map: Record<string, string> = {
      image: 'تصویر پروفایل',
      name: 'نام و نام خانوادگی',
      brandName: 'نام برند هنری یا استودیو',
      province: 'استان کارگاه',
      city: 'شهرستان کارگاه',
      bio: 'درباره شما (بیوگرافی)',
      specialties: 'تخصص‌ها و رشته‌ها',
      portfolioUrl: 'لینک وب‌سایت شخصی',
      socialLinks: 'شبکه‌های اجتماعی'
    };
    return map[field] || field;
  };

  useEffect(() => {
    fetch(`/api/artists/${id}`)
      .then(res => res.json())
      .then(data => {
        setArtist(data);
        if (data.pendingEdits) {
          const edits = typeof data.pendingEdits === 'string' ? JSON.parse(data.pendingEdits) : data.pendingEdits;
          
          const currentVals = {
            name: data.user?.name || '',
            brandName: data.brandName || '',
            province: data.province || '',
            city: data.city || '',
            bio: data.bio || '',
            portfolioUrl: data.portfolioUrl || '',
            image: data.user?.image || null,
            specialties: data.specialties?.map((s: any) => s.name).sort().join('، ') || '',
            socialLinks: formatSocials(data.socialLinks)
          };

          const pendingVals = {
            name: edits.name ?? currentVals.name,
            brandName: edits.brandName ?? currentVals.brandName,
            province: edits.province ?? currentVals.province,
            city: edits.city ?? currentVals.city,
            bio: edits.bio ?? currentVals.bio,
            portfolioUrl: edits.portfolioUrl ?? currentVals.portfolioUrl,
            image: edits.image ?? currentVals.image,
            specialties: edits.specialties ? edits.specialties.map((s: any) => s.name).sort().join('، ') : currentVals.specialties,
            socialLinks: edits.socialLinks ? formatSocials(edits.socialLinks) : currentVals.socialLinks
          };

          // Requirement: Default state of changed fields is RED ('reject') with reason box
          const initialDecisions: Record<string, { status: 'approve' | 'reject', reason: string }> = {};
          const keys = ['image', 'name', 'brandName', 'province', 'city', 'bio', 'specialties', 'portfolioUrl', 'socialLinks'];
          
          keys.forEach(k => {
            const oldV = (currentVals as any)[k];
            const newV = (pendingVals as any)[k];
            const isChanged = (oldV || '').toString().trim() !== (newV || '').toString().trim();
            if (isChanged) {
              initialDecisions[k] = { status: 'reject', reason: '' };
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

  const toggleDecision = (field: string) => {
    setDecisions(prev => {
      const currentStatus = prev[field]?.status || 'reject';
      const nextStatus = currentStatus === 'reject' ? 'approve' : 'reject';
      return {
        ...prev,
        [field]: {
          status: nextStatus,
          reason: nextStatus === 'approve' ? '' : prev[field]?.reason || ''
        }
      };
    });
  };

  const handleReasonChange = (field: string, reason: string) => {
    setDecisions(prev => ({
      ...prev,
      [field]: { ...prev[field], reason }
    }));
  };

  const handleApproveAll = () => {
    setDecisions(prev => {
      const updated: Record<string, { status: 'approve' | 'reject', reason: string }> = {};
      Object.keys(prev).forEach(k => {
        updated[k] = { status: 'approve', reason: '' };
      });
      return updated;
    });
  };

  const handleSubmitDecisions = async () => {
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

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">در حال بارگذاری اطلاعات...</div>;
  if (!artist || !artist.pendingEdits) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center font-sans" dir="rtl">
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

  const edits = typeof artist.pendingEdits === 'string' ? JSON.parse(artist.pendingEdits) : artist.pendingEdits;

  const current = {
    name: artist.user?.name || '',
    brandName: artist.brandName || '',
    province: artist.province || '',
    city: artist.city || '',
    bio: artist.bio || '',
    portfolioUrl: artist.portfolioUrl || '',
    image: artist.user?.image || null,
    specialties: artist.specialties?.map((s: any) => s.name).sort().join('، ') || '',
    socialLinks: formatSocials(artist.socialLinks)
  };

  const pending = {
    name: edits.name ?? current.name,
    brandName: edits.brandName ?? current.brandName,
    province: edits.province ?? current.province,
    city: edits.city ?? current.city,
    bio: edits.bio ?? current.bio,
    portfolioUrl: edits.portfolioUrl ?? current.portfolioUrl,
    image: edits.image ?? current.image,
    specialties: edits.specialties ? edits.specialties.map((s: any) => s.name).sort().join('، ') : current.specialties,
    socialLinks: edits.socialLinks ? formatSocials(edits.socialLinks) : current.socialLinks
  };

  const fieldsToCheck = [
    { key: 'image', isImage: true },
    { key: 'name' },
    { key: 'brandName' },
    { key: 'province' },
    { key: 'city' },
    { key: 'bio' },
    { key: 'specialties' },
    { key: 'portfolioUrl' },
    { key: 'socialLinks' }
  ];

  const changedCount = Object.keys(decisions).length;

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
          {changedCount > 0 && (
            <button 
              type="button" 
              onClick={handleApproveAll} 
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <span>✓</span>
              <span>تایید همه فیلدها</span>
            </button>
          )}
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
          
          const isChanged = (oldVal || '').toString().trim() !== (newVal || '').toString().trim();
          const decision = decisions[key];

          return (
            <div key={key} className={`bg-white rounded-3xl p-6 border shadow-xs transition-all ${
              !isChanged
                ? 'border-slate-200 bg-slate-50/50'
                : decision?.status === 'approve'
                ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                : 'border-red-300 ring-2 ring-red-500/10'
            }`}>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 mb-4">
                <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <span>{getFieldLabel(key)}</span>
                </h4>

                {/* Unchanged badge vs 2-state toggle */}
                {!isChanged ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black shadow-xs">
                    <span>✓</span>
                    <span>بدون تغییر</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleDecision(key)}
                      className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer ${
                        decision?.status === 'approve'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                      }`}
                      title="کلیک کنید تا بین تایید و رد سوئیچ شود"
                    >
                      {decision?.status === 'approve' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          <span>✓ تایید شد</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                          <span>✕ رد با دلیل</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
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

                <div className={`p-3.5 rounded-2xl border text-xs ${
                  isChanged ? 'bg-emerald-50/60 text-slate-900 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <span className={`font-bold block mb-1.5 ${isChanged ? 'text-emerald-800' : 'text-slate-500'}`}>
                    {isChanged ? 'مقدار جدید ارسالی هنرمند:' : 'مقدار فعلی:'}
                  </span>
                  {isImage ? (
                    newVal ? <img src={newVal} alt="New" className="w-20 h-20 rounded-xl object-cover border border-emerald-300 shadow-sm" /> : <span className="text-slate-400">بدون تصویر</span>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed font-medium">{newVal || <span className="text-slate-400">خالی</span>}</p>
                  )}
                </div>
              </div>

              {/* If Rejected, show reason input box (removed if approved) */}
              {isChanged && decision?.status === 'reject' && (
                <div className="mt-4 pt-4 border-t border-red-100 animate-in fade-in">
                  <label className="block text-xs font-bold text-red-700 mb-1.5">
                    دلیل رد این مورد (الزامی جهت نمایش به هنرمند) *:
                  </label>
                  <input
                    type="text"
                    value={decision?.reason || ''}
                    onChange={e => handleReasonChange(key, e.target.value)}
                    placeholder={`مثال: دلیل عدم تایید ${getFieldLabel(key)}...`}
                    className="w-full px-3.5 py-2.5 bg-red-50/50 border border-red-200 rounded-xl text-xs text-red-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
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

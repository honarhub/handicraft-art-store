'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

// Admin Level Medal Icon with specific colors: 0: Red, 1: Yellow, 2: Blue, 3: Green
function ReviewLevelMedalIcon({ level }: { level: number }) {
  const currentLvl = level || 0;
  const persianNums: Record<number, string> = { 0: '۰', 1: '۱', 2: '۲', 3: '۳' };
  const numText = persianNums[currentLvl] || String(currentLvl);

  const configs: Record<number, {
    ribbonPrimary: string;
    ribbonSecondary: string;
    gradientId: string;
    stroke: string;
    textFill: string;
    stops: [string, string, string];
  }> = {
    0: {
      ribbonPrimary: '#EF4444',
      ribbonSecondary: '#B91C1C',
      gradientId: 'reviewMedalRed',
      stroke: '#991B1B',
      textFill: '#FFFFFF',
      stops: ['#FCA5A5', '#EF4444', '#B91C1C']
    },
    1: {
      ribbonPrimary: '#F59E0B',
      ribbonSecondary: '#D97706',
      gradientId: 'reviewMedalYellow',
      stroke: '#B45309',
      textFill: '#78350F',
      stops: ['#FDE047', '#FBBF24', '#D97706']
    },
    2: {
      ribbonPrimary: '#3B82F6',
      ribbonSecondary: '#1D4ED8',
      gradientId: 'reviewMedalBlue',
      stroke: '#1E40AF',
      textFill: '#FFFFFF',
      stops: ['#93C5FD', '#3B82F6', '#1D4ED8']
    },
    3: {
      ribbonPrimary: '#10B981',
      ribbonSecondary: '#047857',
      gradientId: 'reviewMedalGreen',
      stroke: '#065F46',
      textFill: '#FFFFFF',
      stops: ['#6EE7B7', '#10B981', '#047857']
    }
  };

  const cfg = configs[currentLvl] || configs[0];

  return (
    <span className="inline-flex items-center justify-center shrink-0 drop-shadow-sm" title={`سطح احراز هویت: ${numText}`}>
      <svg width="24" height="30" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2L14 10L20 2V12L14 16L8 12V2Z" fill={cfg.ribbonPrimary} />
        <path d="M8 2L14 10V16L8 12V2Z" fill={cfg.ribbonSecondary} opacity="0.8" />
        <circle cx="14" cy="21" r="11" fill={`url(#${cfg.gradientId})`} stroke={cfg.stroke} strokeWidth="1.5" />
        <circle cx="14" cy="21" r="8.5" stroke="#FFFFFF" strokeWidth="0.8" fill="none" opacity="0.5" />
        <text
          x="14"
          y="25"
          textAnchor="middle"
          fill={cfg.textFill}
          fontSize="13"
          fontWeight="900"
          className="select-none font-bold"
          style={{ fontFamily: 'inherit' }}
        >
          {numText}
        </text>
        <defs>
          <linearGradient id={cfg.gradientId} x1="5" y1="12" x2="23" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor={cfg.stops[0]} />
            <stop offset="0.5" stopColor={cfg.stops[1]} />
            <stop offset="1" stopColor={cfg.stops[2]} />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

// Split Rectangle 2-State Review Toggle
function SplitReviewToggle({
  status,
  onToggle
}: {
  status: 'approve' | 'reject';
  onToggle: (newStatus: 'approve' | 'reject') => void;
}) {
  const isApproved = status === 'approve';

  return (
    <div 
      className="inline-flex rounded-xl border border-slate-300 overflow-hidden shadow-xs text-xs font-black select-none h-9 shrink-0"
      dir="rtl"
    >
      {/* Right half: تایید (سبز) */}
      <button
        type="button"
        onClick={() => onToggle('approve')}
        className={`px-3.5 sm:px-4 flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
          isApproved
            ? 'bg-emerald-600 text-white font-black shadow-inner'
            : 'bg-white text-emerald-700 hover:bg-emerald-50'
        }`}
      >
        <span>✓</span>
        <span>تایید</span>
      </button>

      {/* Center Divider line */}
      <div className={`w-[1px] ${isApproved ? 'bg-emerald-700' : 'bg-red-700'}`} />

      {/* Left half: عدم تایید (قرمز) */}
      <button
        type="button"
        onClick={() => onToggle('reject')}
        className={`px-3.5 sm:px-4 flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
          !isApproved
            ? 'bg-red-600 text-white font-black shadow-inner'
            : 'bg-white text-red-600 hover:bg-red-50'
        }`}
      >
        <span>✕</span>
        <span>عدم تایید</span>
      </button>
    </div>
  );
}

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

  const formatPersianDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return '—';
    }
  };

  const getFieldLabel = (field: string) => {
    const map: Record<string, string> = {
      image: 'تصویر پروفایل',
      name: 'نام و نام خانوادگی',
      brandName: 'نام برند هنری یا استودیو',
      phoneNumber: 'شماره تماس همراه',
      email: 'آدرس ایمیل',
      province: 'استان کارگاه',
      city: 'شهرستان کارگاه',
      bio: 'درباره شما (بیوگرافی و معرفی هنرمند)',
      specialties: 'تخصص‌ها و رشته‌های هنری',
      portfolioUrl: 'لینک وب‌سایت شخصی یا نمونه‌کار',
      socialLinks: 'شبکه‌های اجتماعی'
    };
    return map[field] || field;
  };

  useEffect(() => {
    fetch(`/api/artists/${id}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setArtist(data);
        if (data.pendingEdits) {
          const edits = typeof data.pendingEdits === 'string' ? JSON.parse(data.pendingEdits) : data.pendingEdits;
          
          const currentVals = {
            image: data.user?.image || null,
            name: data.user?.name || '',
            brandName: data.brandName || '',
            phoneNumber: data.user?.phoneNumber || '',
            email: data.user?.email || '',
            province: data.province || '',
            city: data.city || '',
            bio: data.bio || '',
            specialties: data.specialties?.map((s: any) => s.name).sort().join('، ') || '',
            portfolioUrl: data.portfolioUrl || '',
            socialLinks: formatSocials(data.socialLinks)
          };

          const pendingVals = {
            image: edits.image !== undefined ? edits.image : currentVals.image,
            name: edits.name !== undefined ? edits.name : currentVals.name,
            brandName: edits.brandName !== undefined ? edits.brandName : currentVals.brandName,
            phoneNumber: edits.phoneNumber !== undefined ? edits.phoneNumber : currentVals.phoneNumber,
            email: edits.email !== undefined ? edits.email : currentVals.email,
            province: edits.province !== undefined ? edits.province : currentVals.province,
            city: edits.city !== undefined ? edits.city : currentVals.city,
            bio: edits.bio !== undefined ? edits.bio : currentVals.bio,
            specialties: edits.specialties ? edits.specialties.map((s: any) => s.name).sort().join('، ') : currentVals.specialties,
            portfolioUrl: edits.portfolioUrl !== undefined ? edits.portfolioUrl : currentVals.portfolioUrl,
            socialLinks: edits.socialLinks ? formatSocials(edits.socialLinks) : currentVals.socialLinks
          };

          // Default state of changed fields is RED ('reject' / عدم تایید)
          const initialDecisions: Record<string, { status: 'approve' | 'reject', reason: string }> = {};
          const keys = ['image', 'name', 'brandName', 'phoneNumber', 'email', 'province', 'city', 'bio', 'specialties', 'portfolioUrl', 'socialLinks'];
          
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

  const setDecisionStatus = (field: string, newStatus: 'approve' | 'reject') => {
    setDecisions(prev => ({
      ...prev,
      [field]: {
        status: newStatus,
        reason: newStatus === 'approve' ? '' : prev[field]?.reason || ''
      }
    }));
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

      window.dispatchEvent(new CustomEvent('admin-counts-update'));
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
    image: artist.user?.image || null,
    name: artist.user?.name || '',
    brandName: artist.brandName || '',
    phoneNumber: artist.user?.phoneNumber || '',
    email: artist.user?.email || '',
    province: artist.province || '',
    city: artist.city || '',
    bio: artist.bio || '',
    portfolioUrl: artist.portfolioUrl || '',
    specialties: artist.specialties?.map((s: any) => s.name).sort().join('، ') || '',
    socialLinks: formatSocials(artist.socialLinks)
  };

  const pending = {
    image: edits.image !== undefined ? edits.image : current.image,
    name: edits.name !== undefined ? edits.name : current.name,
    brandName: edits.brandName !== undefined ? edits.brandName : current.brandName,
    phoneNumber: edits.phoneNumber !== undefined ? edits.phoneNumber : current.phoneNumber,
    email: edits.email !== undefined ? edits.email : current.email,
    province: edits.province !== undefined ? edits.province : current.province,
    city: edits.city !== undefined ? edits.city : current.city,
    bio: edits.bio !== undefined ? edits.bio : current.bio,
    portfolioUrl: edits.portfolioUrl !== undefined ? edits.portfolioUrl : current.portfolioUrl,
    specialties: edits.specialties ? edits.specialties.map((s: any) => s.name).sort().join('، ') : current.specialties,
    socialLinks: edits.socialLinks ? formatSocials(edits.socialLinks) : current.socialLinks
  };

  // All 11 Artist Profile Fields
  const fieldsToCheck = [
    { key: 'image', isImage: true },
    { key: 'name' },
    { key: 'brandName' },
    { key: 'phoneNumber' },
    { key: 'email' },
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
      
      {/* Top Header Card with All Artist Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm mb-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              {artist.user?.image ? (
                <img src={artist.user.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-slate-400">👤</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  بررسی پروفایل: {artist.user?.name || 'هنرمند بدون نام'}
                </h2>
                {artist.brandName && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {artist.brandName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                آیدی هنرمند: <span className="font-mono font-bold text-slate-700">{artist.displayId}</span> | شناسه سیستمی: <span className="font-mono text-[11px] text-slate-400">{artist.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {changedCount > 0 && (
              <button 
                type="button" 
                onClick={handleApproveAll} 
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>✓</span>
                <span>تایید همه فیلدها</span>
              </button>
            )}
            <button 
              type="button" 
              onClick={() => router.push('/admin/artists')} 
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
            >
              بازگشت به لیست
            </button>
          </div>
        </div>

        {/* Profile Meta Info Grid (Verification Level & Registration Date required) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-slate-400 block mb-1">سطح احراز هویت فعلی:</span>
            <div className="flex items-center gap-2 mt-0.5">
              <ReviewLevelMedalIcon level={artist.verificationLevel || 0} />
              <span className="font-bold text-slate-800">
                سطح {artist.verificationLevel || 0}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">تاریخ عضویت در هنرهاب:</span>
            <span className="font-bold text-slate-800 block mt-1">
              {formatPersianDate(artist.createdAt || artist.user?.createdAt)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">شماره تماس تاییدشده:</span>
            <span className="font-mono font-bold text-slate-800 block mt-1" dir="ltr">
              {artist.user?.phoneNumber || '—'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">محل کارگاه فعلی:</span>
            <span className="font-bold text-slate-800 block mt-1">
              {artist.province ? `${artist.province} - ${artist.city || ''}` : 'ثبت نشده'}
            </span>
          </div>
        </div>
      </div>

      {submitMsg && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 text-sm font-bold rounded-2xl border border-emerald-200">
          {submitMsg}
        </div>
      )}

      {/* Review Cards for All Fields: Changed fields on TOP, Unchanged fields on BOTTOM */}
      <div className="space-y-8">
        
        {/* SECTION 1: Changed Fields (Top) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-amber-400">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                موارد تغییر یافته و نیازمند بررسی
              </h3>
            </div>
            <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-2xs">
              {fieldsToCheck.filter(f => {
                const oldVal = (current as any)[f.key];
                const newVal = (pending as any)[f.key];
                return (oldVal || '').toString().trim() !== (newVal || '').toString().trim();
              }).length} مورد تغییر کرده
            </span>
          </div>

          <div className="space-y-5">
            {fieldsToCheck
              .filter(({ key }) => {
                const oldVal = (current as any)[key];
                const newVal = (pending as any)[key];
                return (oldVal || '').toString().trim() !== (newVal || '').toString().trim();
              })
              .map(({ key, isImage }) => {
                const oldVal = (current as any)[key];
                const newVal = (pending as any)[key];
                const decision = decisions[key];

                return (
                  <div key={key} className={`bg-white rounded-3xl p-6 border shadow-xs transition-all ${
                    decision?.status === 'approve'
                      ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                      : 'border-red-300 ring-2 ring-red-500/10'
                  }`}>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 mb-4">
                      <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>{getFieldLabel(key)}</span>
                      </h4>

                      <SplitReviewToggle
                        status={decision?.status || 'reject'}
                        onToggle={(newStatus) => setDecisionStatus(key, newStatus)}
                      />
                    </div>

                    {/* Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-500 block mb-1.5">مقدار قبلی:</span>
                        {isImage ? (
                          oldVal ? (
                            <img src={oldVal} alt="Old" className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                          ) : (
                            <span className="text-slate-400 font-medium">بدون تصویر / قبلاً ثبت نشده</span>
                          )
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{oldVal || <span className="text-slate-400">خالی</span>}</p>
                        )}
                      </div>

                      <div className="p-3.5 rounded-2xl border text-xs bg-emerald-50/60 text-slate-900 border-emerald-200">
                        <span className="font-bold block mb-1.5 text-emerald-800">
                          مقدار جدید ارسالی هنرمند:
                        </span>
                        {isImage ? (
                          newVal ? (
                            <img src={newVal} alt="New" className="w-20 h-20 rounded-xl object-cover border border-emerald-300 shadow-sm" />
                          ) : (
                            <span className="text-slate-400">بدون تصویر</span>
                          )
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed font-medium">{newVal || <span className="text-slate-400">خالی</span>}</p>
                        )}
                      </div>
                    </div>

                    {/* If Rejected, show reason input box (removed if approved) */}
                    {decision?.status === 'reject' && (
                      <div className="mt-4 pt-4 border-t border-red-100 animate-in fade-in">
                        <label className="block text-xs font-bold text-red-700 mb-1.5">
                          دلیل عدم تایید این مورد (الزامی جهت نمایش به هنرمند) *:
                        </label>
                        <input
                          type="text"
                          value={decision?.reason || ''}
                          onChange={e => handleReasonChange(key, e.target.value)}
                          placeholder={`مثال: دلیل عدم تایید ${getFieldLabel(key)}...`}
                          className="w-full px-3.5 py-2.5 bg-red-50/50 border border-red-200 rounded-xl text-xs text-red-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200 font-medium"
                        />
                      </div>
                    )}

                  </div>
                );
              })}
          </div>
        </div>

        {/* SECTION 2: Unchanged Fields (Bottom) */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">📁</span>
              <h3 className="font-bold text-slate-700 text-sm sm:text-base">
                موارد بدون تغییر
              </h3>
            </div>
            <span className="bg-slate-100 text-slate-600 font-bold text-xs px-2.5 py-0.5 rounded-full">
              {fieldsToCheck.filter(f => {
                const oldVal = (current as any)[f.key];
                const newVal = (pending as any)[f.key];
                return (oldVal || '').toString().trim() === (newVal || '').toString().trim();
              }).length} مورد بدون تغییر
            </span>
          </div>

          <div className="space-y-4">
            {fieldsToCheck
              .filter(({ key }) => {
                const oldVal = (current as any)[key];
                const newVal = (pending as any)[key];
                return (oldVal || '').toString().trim() === (newVal || '').toString().trim();
              })
              .map(({ key, isImage }) => {
                const val = (current as any)[key];

                return (
                  <div key={key} className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200 shadow-2xs">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/80 mb-3">
                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        <span>{getFieldLabel(key)}</span>
                      </h4>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                        <span>✓</span>
                        <span>بدون تغییر</span>
                      </span>
                    </div>

                    <div className="p-3 bg-white text-slate-700 rounded-xl border border-slate-200 text-xs">
                      {isImage ? (
                        val ? (
                          <img src={val} alt="Current" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                        ) : (
                          <span className="text-slate-400">بدون تصویر</span>
                        )
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{val || <span className="text-slate-400">خالی</span>}</p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

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

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { IRAN_PROVINCES } from '@/lib/provinces';

interface Specialty {
  id: string;
  name: string;
  parentId?: string | null;
}

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // All Specialties from DB
  const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);

  // Level 1: Basic Info & Specialties
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([]);

  // Level 2: Artistic Identity & Portfolio
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telegram, setTelegram] = useState('');
  const [bale, setBale] = useState('');

  // Level 3: KYC & Legal/Financial Info
  const [nationalId, setNationalId] = useState('');
  const [nationalCardImage, setNationalCardImage] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shebaNumber, setShebaNumber] = useState('');

  // Artist existing verification level
  const [savedVerificationLevel, setSavedVerificationLevel] = useState<number>(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/artist-panel/login');
      return;
    }

    if (status === 'authenticated') {
      fetchOnboardingData();
    }
  }, [status]);

  const fetchOnboardingData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/artist/onboarding');
      const data = await res.json();

      if (data.allSpecialties) {
        setAllSpecialties(data.allSpecialties);
      }

      if (data.artist) {
        const a = data.artist;
        setSavedVerificationLevel(a.verificationLevel || 0);

        // Pre-fill Level 1
        setName(a.user?.name || '');
        setPhone(a.user?.phoneNumber || '');
        setBrandName(a.brandName || '');
        setProvince(a.province || 'تهران');
        setCity(a.city || 'تهران');
        if (a.specialties && a.specialties.length > 0) {
          setSelectedSpecialtyIds(a.specialties.map((s: Specialty) => s.id));
        }

        // Pre-fill Level 2
        setBio(a.bio || '');
        setAvatarUrl(a.user?.image || '');
        setBannerUrl(a.bannerUrl || '');
        if (a.socialLinks) {
          setInstagram(a.socialLinks.instagram || '');
          setTelegram(a.socialLinks.telegram || '');
          setBale(a.socialLinks.bale || '');
        }

        // Pre-fill Level 3
        setNationalId(a.nationalId || '');
        setNationalCardImage(a.nationalCardImage || '');
        setAddress(a.address || '');
        setPostalCode(a.postalCode || '');
        setShebaNumber(a.shebaNumber || '');

        // Decide initial active step based on saved level
        if (a.verificationLevel === 1) {
          setCurrentStep(2);
        } else if (a.verificationLevel === 2) {
          setCurrentStep(3);
        } else if (a.verificationLevel >= 3) {
          setCurrentStep(3);
        } else {
          setCurrentStep(1);
        }
      }
    } catch (err) {
      setErrorMsg('خطا در بارگذاری اطلاعات آنبوردینگ.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSpecialty = (id: string) => {
    setSelectedSpecialtyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Available cities for selected province
  const currentProvinceCities =
    IRAN_PROVINCES.find((p) => p.name === province)?.cities || [];

  // --- SUBMIT LEVEL 1 ---
  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brandName.trim() || !province || !city) {
      setErrorMsg('لطفاً نام، نام برند و استان/شهر را تکمیل کنید.');
      return;
    }
    if (selectedSpecialtyIds.length === 0) {
      setErrorMsg('حداقل یک رشته و تخصص هنری را انتخاب نمایید.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/artist/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 1,
          name,
          brandName,
          province,
          city,
          phone,
          specialtyIds: selectedSpecialtyIds
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'خطا در ذخیره اطلاعات مرحله ۱.');
      } else {
        setSavedVerificationLevel(Math.max(savedVerificationLevel, 1));
        setSuccessMsg('اطلاعات مرحله ۱ با موفقیت ثبت شد!');
        setTimeout(() => {
          setSuccessMsg('');
          setCurrentStep(2);
        }, 800);
      }
    } catch {
      setErrorMsg('خطا در اتصال به سرور.');
    } finally {
      setSaving(false);
    }
  };

  // --- SUBMIT LEVEL 2 ---
  const handleSubmitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/artist/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 2,
          bio,
          bannerUrl,
          avatarUrl,
          socialLinks: { instagram, telegram, bale }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'خطا در ذخیره اطلاعات مرحله ۲.');
      } else {
        setSavedVerificationLevel(Math.max(savedVerificationLevel, 2));
        setSuccessMsg('اطلاعات رزومه و گالری هنری ثبت شد!');
        setTimeout(() => {
          setSuccessMsg('');
          setCurrentStep(3);
        }, 800);
      }
    } catch {
      setErrorMsg('خطا در اتصال به سرور.');
    } finally {
      setSaving(false);
    }
  };

  // --- SUBMIT LEVEL 3 ---
  const handleSubmitStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId.trim() || !address.trim() || !shebaNumber.trim()) {
      setErrorMsg('کد ملی، آدرس و شماره شبا الزامی هستند.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/artist/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 3,
          nationalId,
          nationalCardImage,
          address,
          postalCode,
          shebaNumber
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'خطا در ثبت مدارک مرحله ۳.');
      } else {
        setSavedVerificationLevel(3);
        setSuccessMsg('احراز هویت کامل شد! در حال انتقال به داشبورد هنرمندان...');
        setTimeout(() => {
          router.push('/artist-panel/dashboard');
        }, 1200);
      }
    } catch {
      setErrorMsg('خطا در اتصال به سرور.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-slate-600">در حال آماده‌سازی اطلاعات آنبوردینگ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-3xl font-black tracking-tight group mb-4" dir="rtl">
            <span className="text-black transition-colors group-hover:text-emerald-700">هنر</span>
            <span className="bg-[#FF9900] text-black px-2 py-0.5 rounded-md mr-1 text-2xl font-black shadow-sm">هاب</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ویزارد راه‌اندازی و احراز هویت هنرمند
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            با تکمیل ۳ سطح زیر، هویت و ویترین اختصاصی خود را در بازارچه سراسری هنرهاب فعال کنید.
          </p>
        </div>

        {/* Stepper Navigation */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 mb-8">
          <div className="grid grid-cols-3 gap-2 relative">
            
            {/* Step 1 Indicator */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                currentStep === 1
                  ? 'bg-emerald-50 text-emerald-800'
                  : savedVerificationLevel >= 1
                  ? 'text-slate-700 hover:bg-slate-50'
                  : 'text-slate-400 opacity-60'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black mb-1.5 ${
                currentStep === 1
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : savedVerificationLevel >= 1
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {savedVerificationLevel >= 1 ? '✓' : '۱'}
              </div>
              <span className="text-xs font-bold leading-tight">سطح ۱: پایه و تخصص</span>
            </button>

            {/* Step 2 Indicator */}
            <button
              type="button"
              onClick={() => { if (savedVerificationLevel >= 1) setCurrentStep(2); }}
              disabled={savedVerificationLevel < 1}
              className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                currentStep === 2
                  ? 'bg-emerald-50 text-emerald-800'
                  : savedVerificationLevel >= 2
                  ? 'text-slate-700 hover:bg-slate-50'
                  : 'text-slate-400 opacity-60'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black mb-1.5 ${
                currentStep === 2
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : savedVerificationLevel >= 2
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {savedVerificationLevel >= 2 ? '✓' : '۲'}
              </div>
              <span className="text-xs font-bold leading-tight">سطح ۲: هویت و گالری</span>
            </button>

            {/* Step 3 Indicator */}
            <button
              type="button"
              onClick={() => { if (savedVerificationLevel >= 1) setCurrentStep(3); }}
              disabled={savedVerificationLevel < 1}
              className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                currentStep === 3
                  ? 'bg-emerald-50 text-emerald-800'
                  : savedVerificationLevel >= 3
                  ? 'text-slate-700 hover:bg-slate-50'
                  : 'text-slate-400 opacity-60'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black mb-1.5 ${
                currentStep === 3
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : savedVerificationLevel >= 3
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {savedVerificationLevel >= 3 ? '✓' : '۳'}
              </div>
              <span className="text-xs font-bold leading-tight">سطح ۳: احراز هویت مالی</span>
            </button>

          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 bg-red-50 text-red-600 text-xs sm:text-sm font-bold p-4 rounded-2xl border border-red-100 flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-bold p-4 rounded-2xl border border-emerald-100 flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1 FORM */}
        {currentStep === 1 && (
          <form onSubmit={handleSubmitStep1} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>📌</span>
                <span>سطح ۱: مشخصات فردی، استودیو و تخصص‌های هنری</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                تکمیل این مرحله برای باز شدن دسترسی شما به پنل هنرمند کافی است.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام و نام خانوادگی هنرمند *
                </label>
                <input
                  type="text"
                  placeholder="مثال: رضا صادقی"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام برند هنری یا استودیو *
                </label>
                <input
                  type="text"
                  placeholder="مثال: کارگاه سفال نقش جهان"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره تماس همراه
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="09123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center font-mono text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  استان محل کارگاه *
                </label>
                <select
                  value={province}
                  onChange={(e) => {
                    const newProv = e.target.value;
                    setProvince(newProv);
                    const defaultCity = IRAN_PROVINCES.find((p) => p.name === newProv)?.cities[0] || '';
                    setCity(defaultCity);
                  }}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50"
                >
                  <option value="">انتخاب استان...</option>
                  {IRAN_PROVINCES.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شهرستان / شهر *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50"
                >
                  <option value="">انتخاب شهر...</option>
                  {currentProvinceCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Specialties Picker */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-700">
                  رشته‌ها و تخصص‌های دست‌سازه‌های شما *
                </label>
                <span className="text-xs text-emerald-700 font-bold">
                  {selectedSpecialtyIds.length} تخصص انتخاب شده
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                روی تخصص‌هایی که در آن اثر تولید می‌کنید کلیک کنید تا فعال شوند:
              </p>

              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                {allSpecialties.map((s) => {
                  const isSelected = selectedSpecialtyIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleToggleSpecialty(s.id)}
                      className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 scale-105'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {isSelected ? `✓ ${s.name}` : `+ ${s.name}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:flex-1 bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 text-sm disabled:opacity-50"
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره مرحله ۱ و ادامه به مرحله ۲ →'}
              </button>

              {savedVerificationLevel >= 1 && (
                <Link
                  href="/artist-panel/dashboard"
                  className="w-full sm:w-auto text-center px-5 py-3.5 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl font-bold text-sm"
                >
                  ورود به داشبورد
                </Link>
              )}
            </div>
          </form>
        )}

        {/* STEP 2 FORM */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmitStep2} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>🎨</span>
                <span>سطح ۲: هویت بصری، داستان هنرمند و شبکه‌های اجتماعی</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                این اطلاعات در ویترین و صفحه اختصاصی شما به خریداران سراسر کشور نمایش داده می‌شود.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  داستان و بیوگرافی هنرمند (درباره من)
                </label>
                <textarea
                  rows={4}
                  placeholder="از سابقه هنری، سبک کار، الهام‌بخش‌ها و تکنیک‌های ساخت دست‌سازه‌هایتان برای مخاطبان بنویسید..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    لینک تصویر آواتار / پرسنلی
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    لینک تصویر بنر هدر گالری
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://example.com/banner.jpg"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Social Media Links */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  پل‌های ارتباطی و شبکه‌های اجتماعی:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[11px] text-slate-500 mb-1">اینستاگرام:</span>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="@username"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-left bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 mb-1">تلگرام:</span>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="@channel"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-left bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-500 mb-1">پیام‌رسان بله:</span>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="ble.ir/username"
                      value={bale}
                      onChange={(e) => setBale(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-left bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:flex-1 bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 text-sm disabled:opacity-50"
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره سطح ۲ و ادامه به مرحله ۳ →'}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto px-4 py-3.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
              >
                ← بازگشت به مرحله ۱
              </button>

              <Link
                href="/artist-panel/dashboard"
                className="w-full sm:w-auto text-center px-5 py-3.5 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl font-bold text-sm"
              >
                ورود به داشبورد
              </Link>
            </div>
          </form>
        )}

        {/* STEP 3 FORM */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmitStep3} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>⚖️</span>
                <span>سطح ۳: احراز هویت حقوقی، مالی و حساب بانکی</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                این اطلاعات برای تسویه‌حساب درآمدهای فروش و دریافت نشان تایید پلتفرم ضروری است و نزد هنرهاب محفوظ است.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  کد ملی هنرمند (۱۰ رقم) *
                </label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={10}
                  placeholder="0123456789"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center font-mono text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره شبا بانکی (جهت واریز فروش) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={24}
                    placeholder="123456789012345678901234"
                    value={shebaNumber}
                    onChange={(e) => setShebaNumber(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center font-mono text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50 pr-12"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                    IR
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  آدرس دقیق کارگاه یا محل سکونت *
                </label>
                <textarea
                  rows={2}
                  placeholder="نام استان، شهر، خیابان اصلی، کوچه، پلاک و طبقه..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  کد پستی ۱۰ رقمی
                </label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={10}
                  placeholder="1234567890"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center font-mono text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  لینک تصویر کارت ملی
                </label>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://example.com/national-card.jpg"
                  value={nationalCardImage}
                  onChange={(e) => setNationalCardImage(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:flex-1 bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 text-sm disabled:opacity-50"
              >
                {saving ? 'در حال ثبت نهایی...' : 'ثبت نهایی و ورود به پنل هنرمند ✓'}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-4 py-3.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
              >
                ← بازگشت به مرحله ۲
              </button>

              <Link
                href="/artist-panel/dashboard"
                className="w-full sm:w-auto text-center px-5 py-3.5 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl font-bold text-sm"
              >
                ورود به داشبورد
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

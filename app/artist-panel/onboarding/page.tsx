'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { IRAN_PROVINCES } from '@/lib/provinces';

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Wizard Step: 1 | 2 | 3 | 4 (success screen)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [province, setProvince] = useState('تهران');
  const [city, setCity] = useState('تهران');
  const [phone, setPhone] = useState('');

  // Direction for horizontal slide animation
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/artist-panel/login');
      return;
    }

    if (status === 'authenticated') {
      if (session?.user?.name) {
        setName(session.user.name);
      }
      fetchExistingData();
    }
  }, [status, session]);

  const fetchExistingData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/artist/onboarding', { cache: 'no-store' });
      const data = await res.json();

      if (data?.artist) {
        const a = data.artist;
        if (a.user?.name) setName(a.user.name);
        else if (session?.user?.name) setName(session.user.name);
        if (a.user?.phoneNumber) setPhone(a.user.phoneNumber);
        if (a.brandName) setBrandName(a.brandName);
        if (a.province) setProvince(a.province);
        if (a.city) setCity(a.city);

        // If artist has already completed level 1, allow them to view or jump to dashboard
        if (a.verificationLevel >= 1 && a.province && a.city) {
          // Pre-filled ready
        }
      }
    } catch {
      // Quiet fail
    } finally {
      setLoading(false);
    }
  };

  const citiesForProvince =
    IRAN_PROVINCES.find((p) => p.name === province)?.cities || [];

  const goToStep = (targetStep: number) => {
    setErrorMsg('');
    if (targetStep > currentStep) {
      if (currentStep === 1 && !name.trim()) {
        setErrorMsg('لطفاً نام و نام خانوادگی خود را وارد کنید.');
        return;
      }
      setSlideDirection('forward');
    } else {
      setSlideDirection('backward');
    }
    setCurrentStep(targetStep);
  };

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('وارد کردن نام و نام خانوادگی الزامی است.');
      return;
    }
    goToStep(2);
  };

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    goToStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('نام و نام خانوادگی الزامی است.');
      setCurrentStep(1);
      return;
    }
    if (!province || !city) {
      setErrorMsg('انتخاب استان و شهرستان الزامی است.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/artist/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 1,
          name: name.trim(),
          brandName: brandName.trim() || undefined,
          province,
          city,
          phone
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'خطا در ثبت اطلاعات.');
        setSubmitting(false);
      } else {
        // Go to Success Screen
        setCurrentStep(4);
      }
    } catch {
      setErrorMsg('خطا در برقراری ارتباط با سرور.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans" dir="rtl">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- STEP 4: SUCCESS CONGRATULATORY SCREEN ---
  if (currentStep === 4) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-center items-center px-4 py-12" dir="rtl">
        <div className="max-w-md w-full bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in duration-300">
          
          {/* Subtle glow background */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full mx-auto flex items-center justify-center text-4xl mb-6 shadow-inner">
            ✓
          </div>

          <span className="inline-block bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20 mb-3">
            احراز هویت سطح ۱
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            ثبت‌نام با موفقیت انجام شد!
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed mb-8">
            اطلاعات پایه استودیو و هنرمندی شما در هنرهاب ثبت گردید. اکنون می‌توانید وارد پنل اختصاصی خود شوید و آثار دست‌سازه‌تان را ثبت نمایید.
          </p>

          <button
            type="button"
            onClick={() => router.push('/artist-panel/dashboard')}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all text-sm flex items-center justify-center gap-2 group"
          >
            <span>ورود به پیشخوان</span>
            <span className="transition-transform group-hover:-translate-x-1">←</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 select-none" dir="rtl">
      
      {/* Top Bar: Brand Logo, Interactive Progress Dots & Logout Button */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <Link href="/" className="inline-flex items-center text-xl sm:text-2xl font-black tracking-tight shrink-0" dir="rtl">
          <span className="text-white">هنر</span>
          <span className="bg-[#FF9900] text-black px-2 py-0.5 rounded-md mr-1 text-lg sm:text-xl font-black">هاب</span>
        </Link>

        {/* Step Indicator Circles */}
        <div className="flex items-center gap-2 sm:gap-3">
          {[1, 2, 3].map((stepNumber) => {
            const isActive = currentStep === stepNumber;
            const isCompleted = currentStep > stepNumber;

            return (
              <React.Fragment key={stepNumber}>
                <button
                  type="button"
                  onClick={() => goToStep(stepNumber)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30 scale-110 shadow-lg shadow-emerald-500/40'
                      : isCompleted
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/50 hover:bg-slate-700'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }`}
                  title={`مرحله ${stepNumber}`}
                >
                  {isCompleted ? '✓' : stepNumber}
                </button>

                {stepNumber < 3 && (
                  <div className={`w-6 sm:w-12 h-0.5 transition-colors duration-300 ${
                    currentStep > stepNumber ? 'bg-emerald-500' : 'bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/artist-panel/login' })}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all shrink-0 shadow-sm"
          title="خروج از حساب"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>خروج</span>
        </button>
      </div>

      {/* Main Slide Carousel Container */}
      <div className="max-w-xl w-full mx-auto my-auto py-8">
        
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm font-bold p-4 rounded-2xl flex items-center gap-2 animate-in fade-in">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* STEP 1: Full Name */}
          {currentStep === 1 && (
            <form onSubmit={handleNextFromStep1} className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 tracking-wider">مرحله ۱ از ۳</span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  نام و نام خانوادگی شما چیست؟ <span className="text-red-400">*</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  این نام به عنوان نام رسمی صاحب استودیو در شناسنامه اصالت آثار درج خواهد شد.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="مثال: مریم کریمی"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                  autoFocus
                  required
                  className="w-full px-5 py-4 bg-slate-950/70 border-2 border-slate-700 focus:border-emerald-500 focus:ring-0 rounded-2xl text-base sm:text-lg text-white placeholder-slate-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-7 rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 group"
                >
                  <span>بعدی</span>
                  <span className="transition-transform group-hover:-translate-x-1">←</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Brand or Studio Name (Optional) */}
          {currentStep === 2 && (
            <form onSubmit={handleNextFromStep2} className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 tracking-wider">مرحله ۲ از ۳</span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  نام برند هنری یا استودیو <span className="text-slate-400 font-normal text-sm sm:text-base">(اختیاری)</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  اگر برای فروشگاه یا کارگاه خود اسم تجاری دارید وارد کنید.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="مثال: گالری سفال مینا"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  autoFocus
                  className="w-full px-5 py-4 bg-slate-950/70 border-2 border-slate-700 focus:border-emerald-500 focus:ring-0 rounded-2xl text-base sm:text-lg text-white placeholder-slate-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-5 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs sm:text-sm font-bold flex items-center gap-1.5"
                >
                  <span>→</span>
                  <span>قبلی</span>
                </button>

                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-7 rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 group"
                >
                  <span>بعدی</span>
                  <span className="transition-transform group-hover:-translate-x-1">←</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Province & City */}
          {currentStep === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 tracking-wider">مرحله ۳ از ۳</span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  محل کارگاه و فعالیت شما کجاست؟ <span className="text-red-400">*</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  این مورد برای معرفی آثار استان‌ها و تسهیل ارسال سفارشات الزامی است.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    استان محل کارگاه *
                  </label>
                  <select
                    value={province}
                    onChange={(e) => {
                      const newP = e.target.value;
                      setProvince(newP);
                      const defCity = IRAN_PROVINCES.find((p) => p.name === newP)?.cities[0] || '';
                      setCity(defCity);
                    }}
                    required
                    className="w-full px-4 py-3.5 bg-slate-950/70 border-2 border-slate-700 focus:border-emerald-500 focus:ring-0 rounded-2xl text-sm text-white transition-colors"
                  >
                    {IRAN_PROVINCES.map((p) => (
                      <option key={p.name} value={p.name} className="bg-slate-900 text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    شهرستان / شهر *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 bg-slate-950/70 border-2 border-slate-700 focus:border-emerald-500 focus:ring-0 rounded-2xl text-sm text-white transition-colors"
                  >
                    {citiesForProvince.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-5 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs sm:text-sm font-bold flex items-center gap-1.5"
                >
                  <span>→</span>
                  <span>قبلی</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-7 rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {submitting ? (
                    <span>در حال ثبت...</span>
                  ) : (
                    <>
                      <span>ثبت نهایی</span>
                      <span className="transition-transform group-hover:scale-110">✓</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-600 py-2">
        پلتفرم اختصاصی دست‌سازه‌های هنری هنرهاب © {new Date().getFullYear()}
      </div>

    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import WaveDotsLoader from '@/app/components/WaveDotsLoader';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSource = searchParams.get('from') || '';

  // Mode: 'request' | 'reset' | 'success'
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [target, setTarget] = useState('');
  const [normalizedTarget, setNormalizedTarget] = useState('');
  const [targetType, setTargetType] = useState<'phone' | 'email'>('phone');
  
  // Reset fields
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  const codeInputRef = useRef<HTMLInputElement | null>(null);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Focus code input when entering step 2
  useEffect(() => {
    if (step === 'reset') {
      setTimeout(() => codeInputRef.current?.focus(), 150);
    }
  }, [step]);

  // Back link determined by context
  const getBackLink = () => {
    if (fromSource === 'admin') {
      return { href: '/admin/login', label: 'بازگشت به ورود مدیر سیستم' };
    }
    if (fromSource === 'artist') {
      return { href: '/artist-panel/login', label: 'بازگشت به ورود هنرمندان' };
    }
    return { href: '/login', label: 'بازگشت به ورود کاربران' };
  };

  const backLink = getBackLink();

  // Validate and submit Step 1 (Request OTP)
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setDevCode(null);

    const raw = target.trim();
    if (!raw) {
      setErrorMsg('لطفاً شماره موبایل یا آدرس ایمیل خود را وارد فرمایید.');
      return;
    }

    let isEmail = raw.includes('@');
    let finalTarget = raw;

    if (isEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        setErrorMsg('لطفاً یک آدرس ایمیل معتبر وارد فرمایید.');
        return;
      }
      finalTarget = raw.toLowerCase();
      setTargetType('email');
    } else {
      const normalizedPhone = normalizePhoneNumber(raw);
      if (!isValidIranianMobile(normalizedPhone)) {
        setErrorMsg('لطفاً شماره موبایل معتبر ۱۱ رقمی (مثال: ۰۹۱۲۳۴۵۶۷۸۹) یا ایمیل وارد نمایید.');
        return;
      }
      finalTarget = normalizedPhone;
      setTargetType('phone');
    }

    setNormalizedTarget(finalTarget);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          target: finalTarget
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'خطایی در ارسال کد بازیابی رخ داد.');
        setLoading(false);
        return;
      }

      setStep('reset');
      setTimer(60);

      if (data.devCode) {
        setDevCode(data.devCode);
        setInfoMsg(`کد بازیابی ارسال شد (کد تستی لوکال: ${data.devCode})`);
      } else {
        setInfoMsg(
          targetType === 'email'
            ? 'کد تایید بازیابی به ایمیل شما ارسال شد.'
            : 'کد تایید بازیابی به شماره موبایل شما پیامک شد.'
        );
      }
    } catch {
      setErrorMsg('خطا در ارتباط با سرور. لطفاً مجدداً تلاش نمایید.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0 || loading) return;
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          target: normalizedTarget
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'خطا در ارسال مجدد کد.');
      } else {
        setTimer(60);
        if (data.devCode) {
          setDevCode(data.devCode);
          setInfoMsg(`کد جدید ارسال شد (کد تستی لوکال: ${data.devCode})`);
        } else {
          setInfoMsg('کد تایید جدید ارسال گردید.');
        }
      }
    } catch {
      setErrorMsg('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 2 (Reset Password)
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length < 5) {
      setErrorMsg('لطفاً کد تایید ۵ رقمی را کامل وارد نمایید.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('رمز عبور جدید و تکرار آن یکسان نیستند.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          target: normalizedTarget,
          code: cleanCode,
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'خطا در تنظیم رمز عبور جدید.');
        setLoading(false);
        return;
      }

      setStep('success');
    } catch {
      setErrorMsg('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" dir="rtl">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 blur-[130px] rounded-full pointer-events-none -z-0" />

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80">
            
            {/* Header Icon & Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-sm border border-blue-100">
                {step === 'success' ? '🎉' : '🔑'}
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {step === 'success'
                  ? 'رمز عبور با موفقیت تغییر کرد'
                  : step === 'reset'
                  ? 'تنظیم رمز عبور جدید'
                  : 'فراموشی و بازیابی رمز عبور'}
              </h1>
              <p className="text-slate-500 mt-2 text-xs leading-relaxed">
                {step === 'success'
                  ? 'اکنون می‌توانید با رمز عبور جدید وارد حساب کاربری خود شوید.'
                  : step === 'reset'
                  ? `کد ۵ رقمی ارسال شده به ${normalizedTarget} را به همراه رمز جدید وارد کنید.`
                  : 'شماره موبایل یا ایمیل خود را وارد نمایید تا کد تایید یکبار مصرف ارسال گردد.'}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-50 text-red-600 text-xs p-4 rounded-2xl border border-red-100 mb-6 flex items-start gap-2 leading-relaxed">
                <span className="text-base shrink-0">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Info / Dev Message */}
            {infoMsg && (
              <div className="bg-blue-50 text-blue-700 text-xs p-4 rounded-2xl border border-blue-100 mb-6 flex items-start gap-2 leading-relaxed">
                <span className="text-base shrink-0">ℹ️</span>
                <div className="space-y-1">
                  <span>{infoMsg}</span>
                  {devCode && (
                    <div className="pt-1">
                      <span className="font-mono bg-blue-100 px-2 py-0.5 rounded text-blue-900 font-bold tracking-widest text-sm">
                        {devCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 1: REQUEST OTP */}
            {step === 'request' && (
              <form onSubmit={handleRequestSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    شماره موبایل یا ایمیل حساب کاربری
                  </label>
                  <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    dir="ltr"
                    required
                    autoFocus
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹ یا name@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-center font-mono text-sm placeholder-slate-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-2 text-right">
                    کد تایید ۵ رقمی پیامک یا ایمیل خواهد شد.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !target.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  {loading ? <WaveDotsLoader /> : <span>ارسال کد تایید</span>}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY CODE & RESET PASSWORD */}
            {step === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ارسال شده به:</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{normalizedTarget}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-bold text-[11px] cursor-pointer"
                  >
                    تغییر
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    کد تایید ۵ رقمی
                  </label>
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    dir="ltr"
                    required
                    placeholder="•••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-center font-mono text-xl tracking-[0.4em] placeholder-slate-300 font-black"
                  />
                  
                  {/* Resend button / Timer */}
                  <div className="flex justify-between items-center mt-2 text-[11px]">
                    {timer > 0 ? (
                      <span className="text-slate-400">
                        ارسال مجدد کد پس از <strong className="text-slate-600 font-mono">{timer}</strong> ثانیه
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                      >
                        ارسال مجدد کد تایید
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    رمز عبور جدید (حداقل ۶ کاراکتر)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      dir="ltr"
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-center font-mono text-sm tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
                    >
                      {showPassword ? 'مخفی' : 'نمایش'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تکرار رمز عبور جدید
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      dir="ltr"
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-center font-mono text-sm tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
                    >
                      {showConfirmPassword ? 'مخفی' : 'نمایش'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 5 || newPassword.length < 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs mt-3"
                >
                  {loading ? <WaveDotsLoader /> : <span>تغییر رمز عبور و ذخیره</span>}
                </button>
              </form>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 'success' && (
              <div className="space-y-4 text-center">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl text-xs leading-relaxed">
                  رمز عبور حساب کاربری شما با موفقیت به روزرسانی شد. اکنون می‌توانید با خیال راحت وارد سامانه شوید.
                </div>

                <div className="space-y-2.5 pt-2">
                  {fromSource === 'admin' ? (
                    <Link
                      href="/admin/login"
                      className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-xs transition-colors"
                    >
                      ورود به پنل مدیریت (Admin)
                    </Link>
                  ) : fromSource === 'artist' ? (
                    <Link
                      href="/artist-panel/login"
                      className="block w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-xs transition-colors"
                    >
                      ورود به پنل هنرمندان
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="block w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg text-xs transition-colors"
                    >
                      ورود به حساب کاربری
                    </Link>
                  )}

                  <Link
                    href="/"
                    className="block w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    بازگشت به صفحه اصلی
                  </Link>
                </div>
              </div>
            )}

            {/* Back link */}
            {step !== 'success' && (
              <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                <Link href={backLink.href} className="hover:text-blue-600 transition-colors font-medium">
                  &larr; {backLink.label}
                </Link>
                <Link href="/" className="hover:text-slate-800 transition-colors">
                  صفحه اصلی
                </Link>
              </div>
            )}

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <WaveDotsLoader />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}

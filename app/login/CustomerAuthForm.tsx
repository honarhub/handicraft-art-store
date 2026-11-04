'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

type AuthStep = 'IDENTIFIER' | 'OTP_LOGIN' | 'PASSWORD_LOGIN' | 'REGISTER';

// Wave Dots Loader Component: pulses from center outward
const WaveDotsLoader = () => (
  <span className="inline-flex items-center justify-center gap-1.5 py-1 px-2" aria-label="در حال پردازش">
    <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse [animation-delay:400ms]" />
    <span className="w-2.5 h-2.5 rounded-full bg-current opacity-80 animate-pulse [animation-delay:200ms]" />
    <span className="w-3.5 h-3.5 rounded-full bg-current animate-pulse [animation-delay:0ms] scale-110" />
    <span className="w-2.5 h-2.5 rounded-full bg-current opacity-80 animate-pulse [animation-delay:200ms]" />
    <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse [animation-delay:400ms]" />
  </span>
);

export default function CustomerAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/panel';

  const [step, setStep] = useState<AuthStep>('IDENTIFIER');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'phone' | 'email'>('phone');
  const [normalizedTarget, setNormalizedTarget] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [userName, setUserName] = useState('');

  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const cleanIdentifier = (input: string) => {
    const raw = input.trim();
    if (raw.includes('@')) {
      return { type: 'email' as const, value: raw.toLowerCase() };
    }
    const cleanPhone = normalizePhoneNumber(raw);
    return { type: 'phone' as const, value: cleanPhone };
  };

  // Send OTP Helper
  const sendOtp = async (target: string, isEmail: boolean, isRegister = false) => {
    const payload: any = {
      type: isRegister ? 'REGISTER_OTP' : isEmail ? 'EMAIL_OTP' : 'PHONE_OTP',
      purpose: 'customer'
    };
    if (isEmail) payload.email = target;
    else payload.phone = target;

    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'خطا در ارسال کد تایید');
    }
    setResendTimer(120);
    return data;
  };

  // STEP 1: Submit identifier (Phone or Email)
  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = cleanIdentifier(identifier);
    if (parsed.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.value)) {
        setError('لطفاً یک آدرس ایمیل معتبر وارد فرمایید.');
        return;
      }
    } else {
      if (!isValidIranianMobile(parsed.value)) {
        setError('لطفاً شماره موبایل معتبر ۱۱ رقمی (مثال: ۰۹۱۲۳۴۵۶۷۸۹) یا آدرس ایمیل وارد نمایید.');
        return;
      }
    }

    setIdentifierType(parsed.type);
    setNormalizedTarget(parsed.value);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: parsed.value, loginType: 'customer' })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'خطا در بررسی حساب کاربری');
      }

      if (data.exists) {
        // User exists
        setUserName(data.name || '');
        setHasPassword(Boolean(data.hasPassword));

        if (data.hasPassword) {
          // If user has a password, go directly to password screen (NO OTP sent yet)
          setStep('PASSWORD_LOGIN');
        } else {
          // User exists but has no password -> send OTP
          await sendOtp(parsed.value, parsed.type === 'email', false);
          setStep('OTP_LOGIN');
        }
      } else {
        // New User -> send registration OTP
        await sendOtp(parsed.value, parsed.type === 'email', true);
        setStep('REGISTER');
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ارتباط با سرور. لطفاً مجدداً تلاش نمایید.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      await sendOtp(normalizedTarget, identifierType === 'email', step === 'REGISTER');
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال مجدد کد تایید.');
    } finally {
      setLoading(false);
    }
  };

  // Switch to OTP Login from Password Screen
  const handleSwitchToOtpLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await sendOtp(normalizedTarget, identifierType === 'email', false);
      setStep('OTP_LOGIN');
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال کد تایید.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2a: OTP Login Submit
  const handleOtpLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 5) {
      setError('لطفاً کد تایید ۵ رقمی را کامل وارد نمایید.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const credentialsPayload: any = {
        code: otpCode.trim(),
        loginType: 'customer',
        redirect: false
      };
      if (identifierType === 'email') {
        credentialsPayload.email = normalizedTarget;
      } else {
        credentialsPayload.phone = normalizedTarget;
      }

      const res = await signIn('credentials', credentialsPayload);

      if (res?.error) {
        throw new Error(res.error || 'کد تایید اشتباه است یا منقضی شده است.');
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'خطا در ورود به حساب.');
      setLoading(false);
    }
  };

  // STEP 2b: Password Login Submit
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('لطفاً رمز عبور خود را وارد نمایید.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const credentialsPayload: any = {
        password,
        loginType: 'customer',
        redirect: false
      };
      if (identifierType === 'email') {
        credentialsPayload.email = normalizedTarget;
      } else {
        credentialsPayload.phone = normalizedTarget;
      }

      const res = await signIn('credentials', credentialsPayload);

      if (res?.error) {
        throw new Error(res.error || 'رمز عبور وارد شده اشتباه است.');
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'خطا در ورود با رمز عبور.');
      setLoading(false);
    }
  };

  // STEP 2c: Register Submit (OTP + Name + Mandatory Password)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.trim().length !== 5) {
      setError('لطفاً کد تایید ۵ رقمی را وارد نمایید.');
      return;
    }

    if (!name.trim()) {
      setError('لطفاً نام و نام خانوادگی خود را وارد نمایید.');
      return;
    }

    if (!password || password.trim().length < 6) {
      setError('لطفاً یک رمز عبور معتبر (حداقل ۶ کاراکتر) تعیین فرمایید.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create account in DB
      const regPayload: any = {
        code: otpCode.trim(),
        name: name.trim(),
        password: password.trim()
      };
      if (identifierType === 'email') regPayload.email = normalizedTarget;
      else regPayload.phone = normalizedTarget;

      const regRes = await fetch('/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regPayload)
      });
      const regData = await regRes.json();

      if (!regRes.ok || !regData.success) {
        throw new Error(regData.error || 'خطا در ثبت‌نام حساب کاربری.');
      }

      // 2. Automatically log in with credentials so browser prompts to save password
      const loginPayload: any = {
        password: password.trim(),
        loginType: 'customer',
        redirect: false
      };
      if (identifierType === 'email') loginPayload.email = normalizedTarget;
      else loginPayload.phone = normalizedTarget;

      const loginRes = await signIn('credentials', loginPayload);

      if (loginRes?.error) {
        throw new Error('حساب ایجاد شد اما ورود خودکار انجام نشد. لطفاً وارد شوید.');
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'خطا در تکمیل فرآیند ثبت‌نام.');
      setLoading(false);
    }
  };

  // Google SSO Handler
  const handleGoogleLogin = () => {
    setSsoLoading(true);
    signIn('google', { callbackUrl });
  };

  return (
    <div className="w-full max-w-md mx-auto font-sans">
      {/* HonarHub Logo above the card */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center text-3xl sm:text-4xl font-black tracking-tight group" dir="rtl">
          <span className="text-black transition-colors group-hover:text-emerald-700">هنر</span>
          <span className="bg-[#FF9900] text-black px-2.5 py-0.5 rounded-md mr-1.5 text-2xl sm:text-3xl font-black shadow-sm transition-transform group-hover:scale-105">هاب</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
        {/* Header */}
        <div className="text-center mb-6">
          {step === 'IDENTIFIER' && (
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              ورود / ثبت‌نام
            </h1>
          )}

          {(step === 'OTP_LOGIN' || step === 'PASSWORD_LOGIN') && (
            <>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {userName ? `${userName} خوش اومدی :)` : 'خوش اومدی :)'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                حساب شما: <span className="font-mono text-emerald-800 font-bold dir-ltr inline-block">{normalizedTarget}</span>
              </p>
            </>
          )}

          {step === 'REGISTER' && (
            <>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                به جمع هنر دوستان خوش اومدی :)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                عضویت با: <span className="font-mono text-emerald-800 font-bold dir-ltr inline-block">{normalizedTarget}</span>
              </p>
            </>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <span className="text-base shrink-0">⚠️</span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* STEP 1: Phone or Email input */}
        {step === 'IDENTIFIER' && (
          <div className="space-y-4">
            <form onSubmit={handleIdentifierSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره موبایل یا ایمیل:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="09123456789 یا you@example.com"
                  autoFocus
                  required
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none text-center font-bold text-base tracking-wider text-slate-900 bg-slate-50/50 transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 placeholder:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-700/15 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <WaveDotsLoader />
                ) : (
                  <>
                    <span>ادامه</span>
                    <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-medium">یا</span>
              </div>
            </div>

            {/* Google Quick Login Button (Simplified label without SSO) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={ssoLoading || loading}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {ssoLoading ? (
                <WaveDotsLoader />
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>ورود سریع با حساب گوگل</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-2">
              با ورود یا ثبت‌نام در هنرهاب، <Link href="/terms" className="text-emerald-700 font-bold hover:underline">قوانین و مقررات</Link> استفاده از سامانه را می‌پذیرید.
            </p>
          </div>
        )}

        {/* STEP 2a: Password Login (for existing users with password) */}
        {step === 'PASSWORD_LOGIN' && (
          <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
            {/* Hidden username for browser password autofill */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={normalizedTarget}
              readOnly
              className="sr-only"
              tabIndex={-1}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  رمز عبور حساب:
                </label>
                <button
                  type="button"
                  onClick={() => setStep('IDENTIFIER')}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  تغییر {identifierType === 'email' ? 'ایمیل' : 'شماره'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور خود را وارد نمایید"
                  autoFocus
                  required
                  className="w-full px-4 py-3.5 pl-11 rounded-2xl border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none text-center font-mono tracking-wider text-sm text-slate-900 bg-slate-50/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  title={showPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                  aria-label={showPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-700/15 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <WaveDotsLoader /> : <span>ورود با رمز عبور</span>}
            </button>

            <div className="pt-2 flex flex-col gap-2 text-center text-xs">
              <button
                type="button"
                onClick={handleSwitchToOtpLogin}
                disabled={loading}
                className="font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
              >
                ورود با رمز یکبار مصرف {identifierType === 'email' ? 'ایمیلی' : 'پیامکی'} (OTP)
              </button>
            </div>
          </form>
        )}

        {/* STEP 2b: OTP Login (for users logging in via OTP) */}
        {step === 'OTP_LOGIN' && (
          <form onSubmit={handleOtpLoginSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  کد تایید ۵ رقمی {identifierType === 'email' ? 'ایمیلی' : 'پیامکی'}:
                </label>
                <button
                  type="button"
                  onClick={() => setStep('IDENTIFIER')}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  تغییر {identifierType === 'email' ? 'ایمیل' : 'شماره'}
                </button>
              </div>
              <input
                type="tel"
                dir="ltr"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="•••••"
                maxLength={5}
                autoFocus
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none text-center font-black text-xl tracking-[0.5em] text-slate-900 bg-slate-50/50 transition-all"
              />
            </div>

            {/* Resend Timer / Button */}
            <div className="text-center text-xs">
              {resendTimer > 0 ? (
                <span className="text-slate-400 font-medium">
                  ارسال مجدد کد تا <span className="font-bold text-slate-700 font-mono">{resendTimer}</span> ثانیه دیگر
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-emerald-700 hover:text-emerald-900 font-bold transition-colors cursor-pointer"
                >
                  ارسال مجدد کد تایید
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 5}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-700/15 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <WaveDotsLoader /> : <span>تایید و ورود به حساب</span>}
            </button>

            {hasPassword && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('PASSWORD_LOGIN');
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  ورود با رمز عبور
                </button>
              </div>
            )}
          </form>
        )}

        {/* STEP 2c: Register (New User: OTP + Name + Password) */}
        {step === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Hidden username for browser password autofill */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={normalizedTarget}
              readOnly
              className="sr-only"
              tabIndex={-1}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  کد تایید ۵ رقمی ارسال شده <span className="text-red-500">*</span>:
                </label>
                <button
                  type="button"
                  onClick={() => setStep('IDENTIFIER')}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  ویرایش {identifierType === 'email' ? 'ایمیل' : 'شماره'}
                </button>
              </div>
              <input
                type="tel"
                dir="ltr"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="•••••"
                maxLength={5}
                autoFocus
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none text-center font-black text-xl tracking-[0.4em] text-slate-900 bg-slate-50/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نام و نام خانوادگی <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: سارا محمدی"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none text-right font-medium text-sm text-slate-900 bg-slate-50/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تعیین رمز عبور (جهت ورود آسان و ذخیره در مرورگر) <span className="text-red-500">*</span>:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  required
                  className="w-full px-4 py-2.5 pl-11 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none text-center font-mono tracking-wider text-sm text-slate-900 bg-slate-50/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  title={showPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                  aria-label={showPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Resend Timer / Button */}
            <div className="text-center text-xs">
              {resendTimer > 0 ? (
                <span className="text-slate-400 font-medium">
                  ارسال مجدد کد تا <span className="font-bold text-slate-700 font-mono">{resendTimer}</span> ثانیه دیگر
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-emerald-700 hover:text-emerald-900 font-bold transition-colors cursor-pointer"
                >
                  ارسال مجدد کد تایید
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 5 || !name.trim() || password.length < 6}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-700/15 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <WaveDotsLoader /> : <span>تکمیل عضویت و ورود به هنرهاب</span>}
            </button>
          </form>
        )}

        {/* Footer Artist switch note */}
        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-1.5 font-medium">هنرمند یا آفریننده اثر هستید؟</p>
          <Link
            href="/artist-panel/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline transition-colors"
          >
            <span>ورود به استودیوی هنرمندان</span>
            <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

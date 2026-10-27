'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ArtistLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Active Login Method Tab: 'otp' | 'password'
  const [activeTab, setActiveTab] = useState<'otp' | 'password'>('otp');

  // OTP State
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Email / Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotTarget, setForgotTarget] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  // General Error / Message
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle URL error query params
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'not_artist') {
      setErrorMsg('حساب کاربری شما دسترسی هنرمند ندارد. لطفاً ابتدا ثبت‌نام کنید یا با حساب هنرمندی وارد شوید.');
    } else if (error === 'no_profile') {
      setErrorMsg('پروفایل هنرمند برای این حساب یافت نشد. لطفاً ابتدا ثبت‌نام خود را تکمیل کنید.');
    } else if (error === 'deleted') {
      setErrorMsg('حساب هنرمندی شما غیرفعال یا حذف شده است. لطفاً با پشتیبانی تماس بگیرید.');
    }
  }, [searchParams]);

  // Handle redirect if already logged in as artist/admin
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'ARTIST' || session?.user?.role === 'ADMIN') {
        router.push('/artist-panel/dashboard');
      }
    }
  }, [status, session, router]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // --- Send OTP ---
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone) {
      setErrorMsg('لطفاً شماره موبایل خود را وارد کنید.');
      return;
    }

    if (!phone.trim().startsWith('0')) {
      setErrorMsg('شماره موبایل باید با ۰ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹).');
      return;
    }

    setOtpLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setDevCode(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, type: 'PHONE_OTP' })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'خطا در ارسال کد تایید.');
        setOtpLoading(false);
        return;
      }

      setOtpSent(true);
      setTimer(data.expiresIn || 120);
      setSuccessMsg('کد تایید ۵ رقمی برای شماره شما پیامک شد.');
      if (data.devCode) {
        setDevCode(data.devCode);
      }
    } catch (err) {
      setErrorMsg('خطا در برقراری ارتباط با سرور.');
    } finally {
      setOtpLoading(false);
    }
  };

  // --- Verify OTP & Login (Auto triggered on 5th digit) ---
  const executeVerifyOtp = async (codeToVerify: string) => {
    if (!codeToVerify || codeToVerify.length !== 5) {
      setErrorMsg('لطفاً کد تایید ۵ رقمی را به طور کامل وارد کنید.');
      return;
    }

    setOtpLoading(true);
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        phone,
        code: codeToVerify,
        loginType: 'otp'
      });

      if (res?.error) {
        setErrorMsg(res.error || 'کد تایید نامعتبر است یا منقضی شده است.');
        setOtpLoading(false);
      } else {
        // Successful login: Check if user needs onboarding
        const onboardingRes = await fetch('/api/artist/onboarding');
        const onboardingData = await onboardingRes.json();
        
        if (onboardingData?.artist && (onboardingData.artist.verificationLevel === 0 || !onboardingData.artist.province)) {
          router.push('/artist-panel/onboarding');
        } else {
          router.push('/artist-panel/dashboard');
        }
      }
    } catch (err) {
      setErrorMsg('خطایی رخ داد. لطفاً مجدداً تلاش کنید.');
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    executeVerifyOtp(otpCode);
  };

  // --- Password Login ---
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        loginType: 'artist'
      });

      if (res?.error) {
        setErrorMsg(res.error || 'ایمیل یا رمز عبور اشتباه است.');
        setPasswordLoading(false);
      } else {
        router.push('/artist-panel/dashboard');
      }
    } catch (err) {
      setErrorMsg('مشکلی پیش آمد.');
      setPasswordLoading(false);
    }
  };

  // --- Forgot Password Flow ---
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotTarget) {
      setForgotError('شماره موبایل یا ایمیل را وارد کنید.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', target: forgotTarget })
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || 'خطا در ارسال کد بازیابی.');
      } else {
        setForgotStep('reset');
        setForgotMsg('کد ۵ رقمی بازیابی ارسال شد. لطفاً آن را وارد کنید.');
        if (data.devCode) {
          setForgotMsg(`کد بازیابی ارسال شد (کد تستی: ${data.devCode})`);
        }
      }
    } catch {
      setForgotError('خطا در اتصال به سرور.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode || !forgotNewPassword) {
      setForgotError('کد بازیابی و رمز جدید الزامی هستند.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          target: forgotTarget,
          code: forgotCode,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || 'خطا در تغییر رمز عبور.');
      } else {
        setShowForgotModal(false);
        setForgotStep('request');
        setSuccessMsg('رمز عبور شما با موفقیت تغییر کرد! اکنون با رمز جدید وارد شوید.');
        setActiveTab('password');
      }
    } catch {
      setForgotError('خطا در اتصال به سرور.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Upgrading standard user account
  const [upgrading, setUpgrading] = useState(false);
  const handleUpgradeToArtist = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/artist/upgrade', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/artist-panel/onboarding';
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'خطا در ارتقای حساب کاربری');
        setUpgrading(false);
      }
    } catch {
      setErrorMsg('خطا در برقراری ارتباط با سرور');
      setUpgrading(false);
    }
  };

  // If already authenticated as a regular user, show role upgrade UI
  if (status === 'authenticated' && session?.user?.role !== 'ARTIST' && session?.user?.role !== 'ADMIN') {
    return (
      <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4">
          🎨
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">فعال‌سازی پنل هنرمند</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          شما با حساب (<strong className="text-slate-800">{session.user.email || session.user.name}</strong>) وارد شده‌اید. می‌توانید با یک کلیک دسترسی هنرمند را برای این حساب فعال کنید.
        </p>

        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleUpgradeToArtist}
          disabled={upgrading}
          className="w-full bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all disabled:opacity-50 text-sm mb-3"
        >
          {upgrading ? 'در حال فعال‌سازی...' : 'شروع فعالیت و راه‌اندازی فروشگاه من'}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: '/artist-panel/login' })}
          className="w-full text-slate-500 hover:text-slate-700 text-xs py-2 transition-colors font-medium"
        >
          خروج و ورود با حساب کاربری دیگر
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-3xl font-black tracking-tight group" dir="rtl">
            <span className="text-black transition-colors group-hover:text-emerald-700">هنر</span>
            <span className="bg-[#FF9900] text-black px-2 py-0.5 rounded-md mr-1 text-2xl font-black shadow-sm transition-transform group-hover:scale-105">هاب</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-black text-slate-900 tracking-tight">
          ورود به پنل اختصاصی هنرمندان
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          هنوز عضو خانواده هنرهاب نشده‌اید؟{' '}
          <Link href="/artist-panel/register" className="font-bold text-teal-600 hover:text-teal-700 underline underline-offset-4">
            ثبت‌نام
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          
          {/* Method Selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab('otp'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'otp'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📱 ورود با پیامک (OTP)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('password'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'password'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ✉️ ایمیل و رمز عبور
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-5 bg-red-50 text-red-600 text-xs sm:text-sm font-bold p-3.5 rounded-2xl border border-red-100 text-right leading-relaxed flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-bold p-3.5 rounded-2xl border border-emerald-100 text-right leading-relaxed flex items-start gap-2">
              <span className="text-base">✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {devCode && (
            <div className="mb-5 bg-amber-50 text-amber-900 text-xs font-mono font-bold p-3 rounded-xl border border-amber-200 text-center">
              کد تایید تستی برای شما: <span className="text-lg text-emerald-700 select-all">{devCode}</span>
            </div>
          )}

          {/* TAB 1: MOBILE OTP LOGIN */}
          {activeTab === 'otp' && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      شماره تلفن همراه (شروع با ۰)
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="09123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-mono text-base tracking-widest text-slate-900 bg-slate-50/50"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5 mr-1">
                      شماره موبایل ۱۱ رقمی خود را حتماً با ۰ وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹).
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all disabled:opacity-50 text-sm mt-2 flex items-center justify-center gap-2"
                  >
                    {otpLoading ? (
                      <span>در حال ارسال پیامک...</span>
                    ) : (
                      <span>دریافت کد تایید یکبار مصرف</span>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        کد تایید ۵ رقمی
                      </label>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpCode(''); setDevCode(null); }}
                        className="text-xs text-teal-600 hover:text-teal-700 font-bold"
                      >
                        ویرایش شماره ({phone})
                      </button>
                    </div>

                    <input
                      type="text"
                      dir="ltr"
                      maxLength={5}
                      placeholder="• • • • •"
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setOtpCode(val);
                        if (val.length === 5) {
                          executeVerifyOtp(val);
                        }
                      }}
                      autoFocus
                      required
                      className="w-full px-4 py-3.5 border-2 border-emerald-500/40 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-mono text-2xl font-black tracking-[0.5em] text-slate-900 bg-white"
                    />

                    <div className="flex justify-between items-center mt-2.5 px-1">
                      {timer > 0 ? (
                        <span className="text-xs text-slate-400 font-medium">
                          امکان ارسال مجدد تا {timer} ثانیه دیگر
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={otpLoading}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                        >
                          ارسال مجدد پیامک کد تایید
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length < 5}
                    className="w-full bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all disabled:opacity-50 text-sm mt-3"
                  >
                    {otpLoading ? 'در حال اعتبارسنجی...' : 'تایید و ورود به پنل'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL & PASSWORD LOGIN */}
          {activeTab === 'password' && (
            <form className="space-y-4" onSubmit={handlePasswordLogin}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  آدرس ایمیل
                </label>
                <input
                  type="email"
                  dir="ltr"
                  placeholder="artist@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-left text-sm text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    رمز عبور
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotTarget(email); }}
                    className="text-xs text-teal-600 hover:text-teal-700 font-bold"
                  >
                    فراموشی رمز؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-left text-sm text-slate-900 bg-slate-50/50 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                    title={showPassword ? 'مخفی کردن رمز عبور' : 'مشاهده رمز عبور'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                        <line x1="2" x2="22" y1="2" y2="22"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all disabled:opacity-50 text-sm mt-2"
              >
                {passwordLoading ? 'در حال ورود...' : 'ورود با رمز عبور'}
              </button>
            </form>
          )}

          {/* Social Login Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400 font-medium">یا ورود با حساب</span>
            </div>
          </div>

          {/* Google OAuth Login */}
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/artist-panel/dashboard' })}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-200 rounded-xl shadow-sm bg-white text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            ورود با حساب گوگل (Google)
          </button>

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-right animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-base">بازیابی رمز عبور</h3>
              <button
                type="button"
                onClick={() => { setShowForgotModal(false); setForgotError(''); setForgotMsg(''); }}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100">
                {forgotError}
              </div>
            )}

            {forgotMsg && (
              <div className="mb-4 bg-emerald-50 text-emerald-800 text-xs font-bold p-3 rounded-xl border border-emerald-100">
                {forgotMsg}
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  شماره موبایل یا آدرس ایمیل ثبت‌شده در حساب خود را وارد کنید تا کد بازیابی برای شما ارسال شود.
                </p>
                <div>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="09123456789 یا email@example.com"
                    value={forgotTarget}
                    onChange={(e) => setForgotTarget(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center text-sm font-mono text-slate-900 bg-slate-50/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                >
                  {forgotLoading ? 'در حال ارسال...' : 'ارسال کد بازیابی'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">کد ۵ رقمی دریافتی</label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={5}
                    placeholder="• • • • •"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-center text-xl font-mono font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رمز عبور جدید</label>
                  <input
                    type="password"
                    dir="ltr"
                    placeholder="حداقل ۶ کاراکتر"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-left text-sm text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                >
                  {forgotLoading ? 'در حال ثبت رمز جدید...' : 'تغییر رمز و ورود'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArtistLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ArtistLoginContent />
    </Suspense>
  );
}

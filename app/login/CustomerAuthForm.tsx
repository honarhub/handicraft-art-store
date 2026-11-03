'use client';

import React, { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type AuthStep = 'PHONE' | 'OTP_LOGIN' | 'PASSWORD_LOGIN' | 'REGISTER';

export default function CustomerAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/panel';

  const [step, setStep] = useState<AuthStep>('PHONE');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [userName, setUserName] = useState('');

  const [loading, setLoading] = useState(false);
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

  const normalizePhone = (input: string) => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    let clean = input.trim();
    for (let i = 0; i < 10; i++) {
      clean = clean.replace(new RegExp(persianDigits[i], 'g'), String(i));
      clean = clean.replace(new RegExp(arabicDigits[i], 'g'), String(i));
    }
    clean = clean.replace(/[^\d+]/g, '');
    if (clean.startsWith('+98')) clean = '0' + clean.slice(3);
    else if (clean.startsWith('0098')) clean = '0' + clean.slice(4);
    else if (clean.startsWith('98') && clean.length === 12) clean = '0' + clean.slice(2);
    else if (clean.length === 10 && clean.startsWith('9')) clean = '0' + clean;
    return clean;
  };

  const validatePhone = (p: string) => /^09\d{9}$/.test(normalizePhone(p));

  // Send OTP Helper
  const sendOtp = async (targetPhone: string, isRegister = false) => {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: targetPhone,
        type: isRegister ? 'REGISTER_OTP' : 'PHONE_OTP',
        purpose: 'customer'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'خطا در ارسال کد تایید پیامکی');
    }
    setResendTimer(120);
    return data;
  };

  // STEP 1: Phone identification submit
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanPhone = normalizePhone(phone);

    if (!validatePhone(cleanPhone)) {
      setError('لطفاً یک شماره موبایل معتبر ۱۱ رقمی (مثال: ۰۹۱۲۳۴۵۶۷۸۹) وارد نمایید.');
      return;
    }

    setPhone(cleanPhone);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanPhone, loginType: 'customer' })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'خطا در بررسی شماره');
      }

      if (data.exists) {
        // User exists -> go to login
        setUserName(data.name || '');
        setHasPassword(Boolean(data.hasPassword));

        // Send OTP by default
        await sendOtp(cleanPhone, false);
        setStep('OTP_LOGIN');
      } else {
        // User does not exist -> go to register
        await sendOtp(cleanPhone, true);
        setStep('REGISTER');
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ارتباط با سرور. لطفاً مجدداً تلاش نمایید.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      await sendOtp(phone, step === 'REGISTER');
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال مجدد کد.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2a: OTP Login submit
  const handleOtpLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 5) {
      setError('لطفاً کد تایید ۵ رقمی را کامل وارد نمایید.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        phone,
        code: otpCode.trim(),
        loginType: 'customer',
        redirect: false
      });

      if (res?.error) {
        throw new Error(res.error || 'کد تایید اشتباه است یا منقضی شده است.');
      }

      // Success
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'خطا در ورود به حساب.');
      setLoading(false);
    }
  };

  // STEP 2b: Password Login submit
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('لطفاً رمز عبور خود را وارد نمایید.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        phone,
        password,
        loginType: 'customer',
        redirect: false
      });

      if (res?.error) {
        throw new Error(res.error || 'رمز عبور وارد شده نادرست است.');
      }

      // Success
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'خطا در ورود به حساب.');
      setLoading(false);
    }
  };

  // STEP 2c: Register submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('لطفاً نام و نام خانوادگی خود را وارد نمایید.');
      return;
    }
    if (!otpCode || otpCode.trim().length !== 5) {
      setError('کد تایید ۵ رقمی پیامک‌شده را وارد نمایید.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create User via customer register API
      const registerRes = await fetch('/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          name: name.trim(),
          password: password ? password.trim() : null,
          code: otpCode.trim()
        })
      });

      const regData = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(regData.error || 'خطا در ثبت‌نام کاربر.');
      }

      // 2. Instant login with NextAuth
      const loginRes = await signIn('credentials', {
        phone,
        code: otpCode.trim(),
        loginType: 'customer',
        redirect: false
      });

      if (loginRes?.error) {
        // If password was set, try fallback password login
        if (password) {
          const passLogin = await signIn('credentials', {
            phone,
            password,
            loginType: 'customer',
            redirect: false
          });
          if (passLogin?.error) throw new Error(passLogin.error);
        } else {
          throw new Error(loginRes.error);
        }
      }

      // Success
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت‌نام و ورود.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 font-sans" dir="rtl">
      {/* Brand Icon & Heading */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-teal-600 via-teal-700 to-emerald-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-teal-700/20 mb-4">
          ✨
        </div>
        
        {step === 'PHONE' && (
          <>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              ورود و عضویت در هنرهاب
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
              برای ثبت سفارش، مدیریت آدرس‌ها و لیست علاقه‌مندی‌ها وارد شوید
            </p>
          </>
        )}

        {(step === 'OTP_LOGIN' || step === 'PASSWORD_LOGIN') && (
          <>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              خوش‌آمدید{userName ? `، ${userName}` : ''} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              شماره شما: <span className="font-mono text-teal-800 font-bold">{phone}</span>
            </p>
          </>
        )}

        {step === 'REGISTER' && (
          <>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              به جمع علاقه‌مندان هنر بپیوندید 🎨
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              عضویت سریع با شماره: <span className="font-mono text-teal-800 font-bold">{phone}</span>
            </p>
          </>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Phone input */}
      {step === 'PHONE' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              شماره موبایل:
            </label>
            <input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09123456789"
              maxLength={14}
              autoFocus
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 outline-none text-center font-bold text-base tracking-wider text-slate-900 bg-slate-50/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm shadow-md hover:shadow-teal-600/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <>
                <span>ادامه و دریافت کد تایید</span>
                <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-2">
            با ورود یا ثبت‌نام در هنرهاب، <Link href="/terms" className="text-teal-700 font-bold hover:underline">قوانین و مقررات</Link> استفاده از پلتفرم را می‌پذیرید.
          </p>
        </form>
      )}

      {/* STEP 2a: OTP Login */}
      {step === 'OTP_LOGIN' && (
        <form onSubmit={handleOtpLoginSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                کد تایید پیامکی (۵ رقم):
              </label>
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-[11px] font-bold text-teal-600 hover:text-teal-800"
              >
                تغییر شماره
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
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 outline-none text-center font-black text-xl tracking-[0.5em] text-slate-900 bg-slate-50/50 transition-all"
            />
          </div>

          {/* Resend Timer / Button */}
          <div className="text-center text-xs">
            {resendTimer > 0 ? (
              <span className="text-slate-400 font-medium">
                امکان ارسال مجدد کد تا <span className="font-bold text-slate-700 font-mono">{resendTimer}</span> ثانیه دیگر
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-teal-600 hover:text-teal-800 font-bold transition-colors cursor-pointer"
              >
                ارسال مجدد کد تایید
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 5}
            className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <span className="animate-spin">⏳</span> : 'تایید و ورود به حساب'}
          </button>

          {hasPassword && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep('PASSWORD_LOGIN');
                }}
                className="text-xs font-bold text-slate-600 hover:text-teal-700 transition-colors"
              >
                ورود با استفاده از رمز عبور
              </button>
            </div>
          )}
        </form>
      )}

      {/* STEP 2b: Password Login */}
      {step === 'PASSWORD_LOGIN' && (
        <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                رمز عبور حساب:
              </label>
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-[11px] font-bold text-teal-600 hover:text-teal-800"
              >
                تغییر شماره
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور خود را وارد نمایید"
              autoFocus
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 outline-none text-right font-medium text-sm text-slate-900 bg-slate-50/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <span className="animate-spin">⏳</span> : 'ورود به حساب'}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setError('');
                sendOtp(phone, false).catch(() => {});
                setStep('OTP_LOGIN');
              }}
              className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors"
            >
              ورود با رمز یکبار مصرف پیامکی (OTP)
            </button>
          </div>
        </form>
      )}

      {/* STEP 2c: Register form */}
      {step === 'REGISTER' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نام و نام خانوادگی:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: سارا محمدی"
              autoFocus
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 outline-none text-right font-medium text-sm text-slate-900 bg-slate-50/50 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                کد تایید پیامک‌شده به شماره شما:
              </label>
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-[11px] font-bold text-teal-600 hover:text-teal-800"
              >
                تغییر شماره
              </button>
            </div>
            <input
              type="tel"
              dir="ltr"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="•••••"
              maxLength={5}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 outline-none text-center font-black text-xl tracking-[0.4em] text-slate-900 bg-slate-50/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              تعیین رمز عبور (اختیاری):
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل ۶ کاراکتر (اختیاری جهت ورودهای بعدی)"
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/10 outline-none text-right font-medium text-xs text-slate-900 bg-slate-50/50 transition-all"
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
                className="text-teal-600 hover:text-teal-800 font-bold transition-colors cursor-pointer"
              >
                ارسال مجدد کد تایید
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 5 || !name.trim()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <span className="animate-spin">⏳</span> : 'تکمیل عضویت و ورود به هنرهاب'}
          </button>
        </form>
      )}

      {/* Footer Artist switch note */}
      <div className="mt-8 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500 mb-1.5 font-medium">هنرمند یا آفریننده اثر هستید؟</p>
        <Link
          href="/artist-panel/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline transition-colors"
        >
          <span>ورود به پنل تخصصی هنرمندان</span>
          <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </div>
  );
}

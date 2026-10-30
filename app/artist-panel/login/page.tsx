'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

function ArtistLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Main Mode: 'login' | 'register'
  const [mainMode, setMainMode] = useState<'login' | 'register'>('login');

  // --- LOGIN STATES ---
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [loginStep, setLoginStep] = useState<'identifier' | 'password' | 'otp'>('identifier');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [loginTimer, setLoginTimer] = useState(0);
  const [loginDevCode, setLoginDevCode] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'MOCK' | 'SANDBOX' | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isUnregisteredError, setIsUnregisteredError] = useState(false);
  const [unregisteredEmail, setUnregisteredEmail] = useState<string | null>(null);

  // --- REGISTER STATES ---
  const [regMethod, setRegMethod] = useState<'phone' | 'email'>('phone');
  const [regStep, setRegStep] = useState<'form' | 'otp'>('form');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regReferralCode, setRegReferralCode] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regTimer, setRegTimer] = useState(0);
  const [regDevCode, setRegDevCode] = useState<string | null>(null);
  const [regMode, setRegMode] = useState<'MOCK' | 'SANDBOX' | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [refFromUrl, setRefFromUrl] = useState(false);

  // --- FORGOT PASSWORD MODAL ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotTarget, setForgotTarget] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const forgotPasswordInputRef = React.useRef<HTMLInputElement | null>(null);

  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Read search params on load
  useEffect(() => {
    const tab = searchParams.get('tab') || searchParams.get('mode');
    const ref = searchParams.get('ref');
    const err = searchParams.get('error');

    if (ref) {
      setRegReferralCode(ref.trim().toUpperCase());
      setRefFromUrl(true);
      setMainMode('register');
    } else if (tab === 'register') {
      setMainMode('register');
    }

    if (err === 'not_registered') {
      setErrorMsg('این حساب کاربری در سیستم ثبت نشده است. لطفاً ابتدا «ثبت‌نام» نمایید.');
      setIsUnregisteredError(true);
      const emailParam = searchParams.get('email');
      if (emailParam) {
        setUnregisteredEmail(decodeURIComponent(emailParam));
      }
    } else if (err === 'archived' || err === 'deleted') {
      signOut({ redirect: false });
      setErrorMsg('حساب کاربری هنرمندی شما بایگانی شده است. لطفاً جهت پیگیری یا فعال‌سازی مجدد با پشتیبانی در تماس باشید.');
    } else if (err === 'deactivated') {
      signOut({ redirect: false });
      setErrorMsg('حساب کاربری هنرمندی شما توسط ادمین غیرفعال شده است. لطفاً جهت پیگیری با پشتیبانی در تماس باشید.');
    } else if (err === 'not_artist') {
      setErrorMsg('حساب کاربری شما دسترسی هنرمند ندارد. لطفاً ابتدا ثبت‌نام کنید.');
    }
  }, [searchParams]);

  // Handle redirect if already logged in as artist/admin
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (status === 'authenticated' && !['deleted', 'archived', 'deactivated'].includes(errorParam || '')) {
      if (session?.user?.role === 'ARTIST' || session?.user?.role === 'ADMIN') {
        router.push('/artist-panel/dashboard');
      }
    }
  }, [status, session, router, searchParams]);

  // Timers for OTP
  useEffect(() => {
    let interval: any = null;
    if (loginTimer > 0) {
      interval = setInterval(() => setLoginTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [loginTimer]);

  useEffect(() => {
    let interval: any = null;
    if (regTimer > 0) {
      interval = setInterval(() => setRegTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [regTimer]);

  // ==========================================
  // 1. LOGIN FLOW
  // ==========================================

  // Step 1: Check user existence with unified identifier (phone or email)
  const handleCheckUserAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    const raw = loginIdentifier.trim();
    if (!raw) {
      setErrorMsg('شماره موبایل یا ایمیل را وارد کنید.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let detectedType: 'phone' | 'email';
    let normalizedIdentifier = raw;

    if (raw.includes('@')) {
      if (!emailRegex.test(raw)) {
        setErrorMsg('شماره موبایل یا ایمیل صحیح دریافت نشد لطفا با دقت وارد نماید.');
        return;
      }
      detectedType = 'email';
      normalizedIdentifier = raw.toLowerCase();
    } else {
      if (!isValidIranianMobile(raw)) {
        setErrorMsg('شماره موبایل یا ایمیل صحیح دریافت نشد لطفا با دقت وارد نماید.');
        return;
      }
      detectedType = 'phone';
      normalizedIdentifier = normalizePhoneNumber(raw);
    }

    setLoginMethod(detectedType);
    setLoginIdentifier(normalizedIdentifier);
    setLoginLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setIsUnregisteredError(false);

    try {
      const res = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: normalizedIdentifier })
      });

      const data = await res.json();

      if (!res.ok) {
        setIsUnregisteredError(false);
        setErrorMsg(data.message || data.error || 'خطا در بررسی اطلاعات کاربری.');
        setLoginLoading(false);
        return;
      }

      if (!data.exists) {
        setIsUnregisteredError(true);
        setUnregisteredEmail(null);
        setErrorMsg('این حساب کاربری در سیستم ثبت نشده است. لطفاً ابتدا «ثبت‌نام» نمایید.');
        setLoginLoading(false);
        return;
      }

      // User exists! Move to password step
      setLoginStep('password');
    } catch {
      setErrorMsg('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 2A: Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    if (!loginPassword) {
      setErrorMsg('رمز عبور را وارد کنید.');
      return;
    }

    setLoginLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const isPhone = loginMethod === 'phone';
      const credentials: any = {
        redirect: false,
        password: loginPassword,
        loginType: 'artist'
      };

      if (isPhone) {
        credentials.phone = loginIdentifier.trim();
      } else {
        credentials.email = loginIdentifier.trim().toLowerCase();
      }

      const res = await signIn('credentials', credentials);

      if (res?.error) {
        setSuccessMsg('');
        setErrorMsg(res.error || 'اطلاعات ورود اشتباه است.');
        setLoginLoading(false);
      } else {
        if (typeof window !== 'undefined' && 'PasswordCredential' in window && (navigator as any).credentials?.store) {
          try {
            const cred = new (window as any).PasswordCredential({
              id: loginIdentifier.trim(),
              password: loginPassword,
              name: loginIdentifier.trim()
            });
            await (navigator as any).credentials.store(cred);
          } catch {
            // Ignore if browser unsupported or rejected
          }
        }
        router.push('/artist-panel/dashboard');
      }
    } catch {
      setSuccessMsg('');
      setErrorMsg('مشکلی در ورود رخ داد.');
      setLoginLoading(false);
    }
  };

  // Step 2B: Switch to OTP Login for Mobile
  const handleSwitchToLoginOtp = async () => {
    setLoginLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setLoginDevCode(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginIdentifier.trim(), type: 'PHONE_OTP' })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'خطا در ارسال کد تایید.');
        setLoginLoading(false);
        return;
      }

      setLoginStep('otp');
      setLoginTimer(data.expiresIn || 120);
      if (data.devCode) {
        setLoginDevCode(data.devCode);
        setLoginMode(data.mode || 'MOCK');
      } else {
        setLoginDevCode(null);
        setLoginMode(null);
      }
      setSuccessMsg(data.mode === 'SANDBOX' ? 'وب‌سرویس sms.ir درخواست را تایید کرد (حالت سندباکس).' : 'کد تایید ۵ رقمی ارسال شد.');
    } catch {
      setErrorMsg('خطا در برقراری ارتباط.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 2C: Verify OTP & Login
  const handleVerifyLoginOtp = async (codeToVerify: string) => {
    setSuccessMsg('');
    if (!codeToVerify || codeToVerify.length !== 5) {
      setErrorMsg('کد تایید ۵ رقمی را کامل وارد کنید.');
      return;
    }

    setLoginLoading(true);
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        phone: loginIdentifier.trim(),
        code: codeToVerify,
        loginType: 'otp'
      });

      if (res?.error) {
        setSuccessMsg('');
        setErrorMsg(res.error || 'کد تایید نامعتبر است.');
        setLoginLoading(false);
      } else {
        router.push('/artist-panel/dashboard');
      }
    } catch {
      setSuccessMsg('');
      setErrorMsg('خطایی رخ داد.');
      setLoginLoading(false);
    }
  };

  // Switch to register tab with prefilled identifier (from SSO email or login input)
  const handleGoToRegister = () => {
    if (unregisteredEmail) {
      setRegIdentifier(unregisteredEmail);
      setRegMethod('email');
    } else if (loginIdentifier) {
      setRegIdentifier(loginIdentifier);
      setRegMethod(loginMethod);
    }
    // Reset login sensitive inputs
    setLoginPassword('');
    setShowLoginPassword(false);
    setLoginStep('identifier');
    setLoginOtpCode('');

    setRegStep('form');
    setRegOtpCode('');
    setMainMode('register');
    setErrorMsg('');
    setIsUnregisteredError(false);
    if (searchParams.get('error')) {
      router.replace('/artist-panel/login', { scroll: false });
    }
  };

  // ==========================================
  // 2. REGISTER FLOW
  // ==========================================

  // Step 1: Submit Register Form & Request OTP
  const handleRegisterFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regIdentifier.trim()) {
      setErrorMsg(regMethod === 'phone' ? 'شماره موبایل الزامی است.' : 'ایمیل الزامی است.');
      return;
    }
    if (!regReferralCode.trim()) {
      setErrorMsg('کد معرف الزامی است (جهت ثبت‌نام به کد دعوت از هنرمندان دیگر یا ادمین نیاز دارید).');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('تکرار رمز عبور با رمز عبور اصلی یکسان نیست.');
      return;
    }

    setRegLoading(true);

    try {
      const isEmail = regMethod === 'email';
      const payload: any = {
        type: 'REGISTER_OTP',
        referralCode: regReferralCode.trim().toUpperCase()
      };
      if (isEmail) payload.email = regIdentifier.trim();
      else payload.phone = regIdentifier.trim();

      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'خطا در اعتبارسنجی و ارسال کد تایید.');
        setRegLoading(false);
        return;
      }

      setRegStep('otp');
      setRegTimer(data.expiresIn || 120);
      if (data.devCode) {
        setRegDevCode(data.devCode);
        setRegMode(data.mode || 'MOCK');
      } else {
        setRegDevCode(null);
        setRegMode(null);
      }
      setSuccessMsg(data.mode === 'SANDBOX' ? 'وب‌سرویس sms.ir درخواست را تایید کرد (حالت سندباکس).' : `کد تایید ۵ رقمی به ${isEmail ? 'ایمیل' : 'شماره موبایل'} شما ارسال شد.`);
    } catch {
      setErrorMsg('خطا در اتصال به سرور.');
    } finally {
      setRegLoading(false);
    }
  };

  // Step 2: Complete Registration & Auto Login
  const handleCompleteRegistration = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const codeToVerify = (overrideCode ?? regOtpCode).trim();
    if (codeToVerify.length !== 5) {
      setErrorMsg('کد تایید ۵ رقمی را کامل وارد کنید.');
      return;
    }

    if (regLoading) return;
    setRegLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifierType: regMethod,
          identifier: regIdentifier.trim(),
          referralCode: regReferralCode.trim().toUpperCase(),
          password: regPassword,
          otpCode: codeToVerify
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'خطا در تکمیل ثبت‌نام.');
        setRegLoading(false);
        return;
      }

      setSuccessMsg('ثبت‌نام با موفقیت انجام شد! در حال ورود به پنل...');

      // Auto login so browser prompts to save credentials
      const loginPayload: any = {
        redirect: false,
        password: regPassword,
        loginType: 'artist'
      };
      if (regMethod === 'phone') loginPayload.phone = regIdentifier.trim();
      else loginPayload.email = regIdentifier.trim().toLowerCase();

      const loginRes = await signIn('credentials', loginPayload);

      if (!loginRes?.error) {
        if (typeof window !== 'undefined' && 'PasswordCredential' in window && (navigator as any).credentials?.store) {
          try {
            const cred = new (window as any).PasswordCredential({
              id: regIdentifier.trim(),
              password: regPassword,
              name: regIdentifier.trim()
            });
            await (navigator as any).credentials.store(cred);
          } catch {
            // Ignore if browser unsupported or rejected
          }
        }
        router.push('/artist-panel/onboarding');
      } else {
        router.push('/artist-panel/dashboard');
      }
    } catch {
      setErrorMsg('مشکلی در تکمیل ثبت‌نام پیش آمد.');
      setRegLoading(false);
    }
  };

  // Close forgot modal on Escape
  useEffect(() => {
    if (!showForgotModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseForgotModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForgotModal]);

  // ==========================================
  // 3. FORGOT PASSWORD FLOW
  // ==========================================
  const handleOpenForgotModal = () => {
    // Automatically clear any previous login error or warning
    setErrorMsg('');
    setSuccessMsg('');
    setIsUnregisteredError(false);
    setUnregisteredEmail(null);
    if (searchParams.get('error')) {
      router.replace('/artist-panel/login', { scroll: false });
    }

    if (forgotPasswordInputRef.current) {
      forgotPasswordInputRef.current.value = '';
    }
    setForgotTarget(loginIdentifier);
    setForgotStep('request');
    setForgotCode('');
    setForgotNewPassword('');
    setShowForgotNewPassword(false);
    setForgotError('');
    setForgotMsg('');
    setShowForgotModal(true);
  };

  const handleCloseForgotModal = () => {
    // Clear DOM input value directly so browsers do not detect dirty credentials on unmount
    if (forgotPasswordInputRef.current) {
      forgotPasswordInputRef.current.value = '';
    }
    setForgotNewPassword('');
    setShowForgotNewPassword(false);
    setForgotCode('');
    setForgotError('');
    setForgotMsg('');
    setForgotStep('request');
    setShowForgotModal(false);
  };

  const handleForgotBackToRequest = () => {
    if (forgotPasswordInputRef.current) {
      forgotPasswordInputRef.current.value = '';
    }
    setForgotNewPassword('');
    setShowForgotNewPassword(false);
    setForgotCode('');
    setForgotError('');
    setForgotMsg('');
    setForgotStep('request');
  };

  const handleForgotRequest = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!forgotTarget.trim()) {
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
        body: JSON.stringify({ action: 'request', target: forgotTarget.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || 'خطا در ارسال کد بازیابی.');
      } else {
        setForgotStep('reset');
        if (data.devCode) {
          if (data.mode === 'SANDBOX') {
            setForgotMsg(`کد بازیابی ارسال شد (تایید سندباکس sms.ir: ${data.devCode})`);
          } else {
            setForgotMsg(`کد بازیابی ارسال شد (کد شبیه‌ساز لوکال: ${data.devCode})`);
          }
        } else {
          setForgotMsg('کد ۵ رقمی بازیابی به شماره موبایل شما پیامک شد.');
        }
      }
    } catch {
      setForgotError('خطا در اتصال به سرور.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!forgotCode || !forgotNewPassword) {
      setForgotError('کد بازیابی و رمز جدید الزامی هستند.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
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
          target: forgotTarget.trim(),
          code: forgotCode.trim(),
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || 'خطا در تغییر رمز عبور.');
      } else {
        const savedTarget = forgotTarget.trim();
        const savedNewPassword = forgotNewPassword;

        // Prompt browser to store/update credentials natively via PasswordCredential API
        if (typeof window !== 'undefined' && 'PasswordCredential' in window && (navigator as any).credentials?.store) {
          try {
            const cred = new (window as any).PasswordCredential({
              id: savedTarget,
              password: savedNewPassword,
              name: savedTarget
            });
            await (navigator as any).credentials.store(cred);
          } catch {
            // Ignore if browser unsupported or rejected
          }
        }

        // Clean up DOM input value safely before closing
        if (forgotPasswordInputRef.current) {
          forgotPasswordInputRef.current.value = '';
        }
        setShowForgotModal(false);
        setForgotStep('request');
        setForgotCode('');
        setForgotNewPassword('');
        setShowForgotNewPassword(false);
        setForgotError('');
        setForgotMsg('');

        // Completely clear ANY previous login errors
        setErrorMsg('');
        setIsUnregisteredError(false);
        setUnregisteredEmail(null);
        if (searchParams.get('error')) {
          router.replace('/artist-panel/login', { scroll: false });
        }

        // Display success message and prefill login credentials
        setSuccessMsg('رمز عبور شما با موفقیت تغییر کرد! اکنون با رمز جدید وارد شوید.');
        setMainMode('login');
        setLoginStep('password');
        setLoginIdentifier(savedTarget);
        setLoginPassword(savedNewPassword);
      }
    } catch {
      setForgotError('خطا در اتصال به سرور.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-3xl font-black tracking-tight group" dir="rtl">
            <span className="text-black transition-colors group-hover:text-emerald-700">هنر</span>
            <span className="bg-[#FF9900] text-black px-2 py-0.5 rounded-md mr-1 text-2xl font-black shadow-sm transition-transform group-hover:scale-105">هاب</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-black text-slate-900 tracking-tight">
          پنل اختصاصی هنرمندان
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          پلتفرم معرفی، نمایش و فروش تخصصی دست‌سازه‌های اصیل ایرانی
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">

          {/* MAIN MODE SWITCHER: ورود / ثبت‌نام */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMainMode('login');
                setErrorMsg('');
                setSuccessMsg('');
                setIsUnregisteredError(false);
                setUnregisteredEmail(null);
                setRegPassword('');
                setRegConfirmPassword('');
                setShowRegPassword(false);
                setRegStep('form');
                setRegOtpCode('');
                if (searchParams.get('error')) {
                  router.replace('/artist-panel/login', { scroll: false });
                }
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all ${
                mainMode === 'login'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🔐 ورود به هنرهاب
            </button>

            <button
              type="button"
              onClick={() => {
                setMainMode('register');
                setErrorMsg('');
                setSuccessMsg('');
                setIsUnregisteredError(false);
                setLoginPassword('');
                setShowLoginPassword(false);
                setLoginStep('identifier');
                setLoginOtpCode('');
                if (searchParams.get('error')) {
                  router.replace('/artist-panel/login', { scroll: false });
                }
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all ${
                mainMode === 'register'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ✨ ثبت‌نام هنرمند جدید
            </button>
          </div>

          {/* ALERTS */}
          {errorMsg && (
            <div className="mb-5 bg-red-50 text-red-700 text-xs sm:text-sm font-bold p-4 rounded-2xl border border-red-200 text-right leading-relaxed space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <div className="flex-1">
                  <p>{errorMsg}</p>
                  {(errorMsg.includes('پشتیبانی') || errorMsg.includes('بایگانی') || errorMsg.includes('غیرفعال')) && (
                    <div className="mt-2.5 pt-2 border-t border-red-200 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-red-600 font-normal">نیاز به راهنمایی یا بازبینی دارید؟</span>
                      <a
                        href={`/support?message=${encodeURIComponent('درخواست پیگیری وضعیت حساب کاربری هنرمند:\nمشخصات حساب: ' + (loginIdentifier || regIdentifier || ''))}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                      >
                        <span>ارتباط با پشتیبانی</span>
                        <span>←</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {isUnregisteredError && (
                <div className="pt-2 border-t border-red-200 space-y-2">
                  <button
                    type="button"
                    onClick={handleGoToRegister}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>
                      {unregisteredEmail
                        ? `ثبت‌نام با این ایمیل (${unregisteredEmail})`
                        : loginIdentifier
                        ? `ثبت‌نام با این مشخصات (${loginIdentifier})`
                        : 'ثبت‌نام در هنرهاب'}
                    </span>
                    <span>←</span>
                  </button>
                  {unregisteredEmail && (
                    <button
                      type="button"
                      onClick={() => {
                        setUnregisteredEmail(null);
                        setIsUnregisteredError(false);
                        setErrorMsg('');
                        if (searchParams.get('error')) {
                          router.replace('/artist-panel/login', { scroll: false });
                        }
                      }}
                      className="w-full text-center text-[11px] text-red-700 hover:text-red-900 underline font-bold py-1 cursor-pointer block"
                    >
                      صرف‌نظر و ورود با شماره موبایل یا ایمیل دیگر
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {successMsg && !errorMsg && (
            <div className="mb-5 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-bold p-3.5 rounded-2xl border border-emerald-200 text-right leading-relaxed flex items-start gap-2">
              <span className="text-base">✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW A: LOGIN MODE                                        */}
          {/* ======================================================== */}
          <div className={mainMode === 'login' ? 'space-y-5' : 'hidden'} aria-hidden={mainMode !== 'login'}>
            {/* STEP 1: Enter Unified Identifier (Phone or Email) */}
            <div className={loginStep === 'identifier' ? 'block' : 'hidden'}>
              <form onSubmit={handleCheckUserAndProceed} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    شماره موبایل یا ایمیل
                  </label>
                  <input
                    type="text"
                    id="login-identifier"
                    name="username"
                    autoComplete="username"
                    dir="ltr"
                    placeholder="09123456789 یا name@example.com"
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      setErrorMsg('');
                      setSuccessMsg('');
                      setIsUnregisteredError(false);
                      setUnregisteredEmail(null);
                    }}
                    autoFocus
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-mono text-base tracking-wider text-slate-900 bg-slate-50/50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5 mr-1">
                    شماره تلفن همراه یا آدرس ایمیل ثبت‌شده خود را وارد کنید.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <span>در حال بررسی...</span>
                  ) : (
                    <>
                      <span>ورود به هنرهاب</span>
                      <span>←</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* STEP 2A: Password Input */}
            <div className={loginStep === 'password' ? 'block' : 'hidden'}>
              <form onSubmit={handlePasswordLogin} noValidate className="space-y-4">
                {/* Hidden username so browser pairs saved password with the identifier */}
                <input
                  type="text"
                  name="username"
                  id="login-username-hidden"
                  autoComplete="username"
                  value={loginIdentifier}
                  readOnly
                  tabIndex={-1}
                  aria-hidden="true"
                  className="sr-only pointer-events-none opacity-0 absolute -z-10"
                />

                {/* Account Summary Header */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">حساب کاربری:</span>
                    <span className="font-mono font-bold text-slate-800 select-all" dir="ltr">
                      {loginIdentifier}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLoginStep('identifier'); setLoginPassword(''); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-teal-700 hover:text-teal-900 font-bold underline text-[11px]"
                  >
                    تغییر
                  </button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">رمز عبور</label>
                    <button
                      type="button"
                      onClick={handleOpenForgotModal}
                      className="text-xs text-teal-600 hover:text-teal-800 font-bold cursor-pointer"
                    >
                      فراموشی رمز عبور؟
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-password"
                      name="password"
                      dir="ltr"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      required
                      autoFocus
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-mono text-base tracking-widest text-slate-900 bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showLoginPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                      aria-label={showLoginPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                    >
                      {showLoginPassword ? (
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
                  disabled={loginLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {loginLoading ? 'در حال بررسی...' : 'ورود به حساب کاربری'}
                </button>

                {/* Alternative OTP login for mobile */}
                {loginMethod === 'phone' && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleSwitchToLoginOtp}
                      disabled={loginLoading}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 py-1 transition-colors"
                    >
                      📱 ورود با رمز یکبار مصرف پیامکی (بدون رمز عبور)
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* STEP 2B: OTP Verification Screen */}
            <div className={loginStep === 'otp' ? 'block' : 'hidden'}>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">کد تایید برای:</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">
                      {loginIdentifier}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLoginStep('password'); setLoginOtpCode(''); }}
                    className="text-teal-700 hover:text-teal-900 font-bold underline text-[11px]"
                  >
                    ورود با رمز عبور
                  </button>
                </div>

                {loginDevCode && (
                  <div className={`text-xs font-mono font-bold p-3 rounded-xl border text-center ${
                    loginMode === 'SANDBOX'
                      ? 'bg-sky-50 text-sky-900 border-sky-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}>
                    {loginMode === 'SANDBOX' ? (
                      <div>
                        <span>🌐 تاییدشده توسط سندباکس sms.ir: </span>
                        <span className="text-lg text-sky-700 select-all font-black">{loginDevCode}</span>
                        <span className="block text-[10px] text-sky-600 mt-0.5 font-sans">
                          (وب‌سرویس sms.ir درخواست را تایید کرد، اما در سندباکس پیامک مخابراتی به گوشی ارسال نمی‌شود)
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span>🔑 کد تایید شبیه‌ساز لوکال (Mock): </span>
                        <span className="text-lg text-emerald-700 select-all font-black">{loginDevCode}</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                    کد تایید ۵ رقمی را وارد کنید
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={5}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="• • • • •"
                    value={loginOtpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setLoginOtpCode(val);
                      if (val.length === 5) {
                        handleVerifyLoginOtp(val);
                      }
                    }}
                    autoFocus
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-mono text-2xl tracking-[0.5em] text-slate-900 bg-slate-50/50"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  {loginTimer > 0 ? (
                    <span>ارسال مجدد کد تا {loginTimer} ثانیه دیگر</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSwitchToLoginOtp}
                      className="text-teal-600 hover:text-teal-700 font-bold"
                    >
                      ارسال مجدد کد تایید
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyLoginOtp(loginOtpCode)}
                  disabled={loginLoading || loginOtpCode.length !== 5}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 text-sm"
                >
                  {loginLoading ? 'در حال بررسی...' : 'تایید و ورود'}
                </button>
              </div>
            </div>

            {/* GOOGLE SSO DIVIDER & BUTTON */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-medium">یا ورود سریع با گوگل</span>
              </div>
            </div>

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
              <span>ورود با حساب گوگل</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* VIEW B: REGISTER MODE                                     */}
          {/* ======================================================== */}
          <div className={mainMode === 'register' ? 'space-y-5' : 'hidden'} aria-hidden={mainMode !== 'register'}>
            <div className={regStep === 'form' ? 'block' : 'hidden'}>
              {/* Register Sub-method */}
              <div className="flex border-b border-slate-100 pb-3 mb-2 gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setRegMethod('phone');
                    if (regIdentifier.includes('@')) setRegIdentifier('');
                    setErrorMsg('');
                  }}
                  className={`pb-1 transition-all ${
                    regMethod === 'phone'
                      ? 'text-emerald-700 border-b-2 border-emerald-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  📱 ثبت‌نام با شماره موبایل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegMethod('email');
                    if (!regIdentifier.includes('@') && regIdentifier.startsWith('09')) setRegIdentifier('');
                    setErrorMsg('');
                  }}
                  className={`pb-1 transition-all ${
                    regMethod === 'email'
                      ? 'text-emerald-700 border-b-2 border-emerald-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  ✉️ ثبت‌نام با ایمیل
                </button>
              </div>

              <form onSubmit={handleRegisterFormSubmit} noValidate className="space-y-4">
                {/* Identifier */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {regMethod === 'phone' ? 'شماره تلفن همراه' : 'آدرس ایمیل'}
                  </label>
                  <input
                    type={regMethod === 'phone' ? 'tel' : 'email'}
                    id="register-identifier"
                    name="username"
                    autoComplete="username"
                    dir="ltr"
                    placeholder={regMethod === 'phone' ? '09123456789' : 'name@example.com'}
                    value={regIdentifier}
                    onChange={(e) => {
                      setRegIdentifier(e.target.value);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-center font-mono text-sm tracking-wider text-slate-900 bg-slate-50/50"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تعیین رمز عبور (حداقل ۶ کاراکتر)
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      id="register-password"
                      name="password"
                      autoComplete="new-password"
                      dir="ltr"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-center font-mono text-sm tracking-widest text-slate-900 bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showRegPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                      aria-label={showRegPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                    >
                      {showRegPassword ? (
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تکرار رمز عبور
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      id="register-confirm-password"
                      name="confirmPassword"
                      autoComplete="new-password"
                      dir="ltr"
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-center font-mono text-sm tracking-widest text-slate-900 bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showRegPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                      aria-label={showRegPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                    >
                      {showRegPassword ? (
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

                {/* Referral Code (Mandatory) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      کد معرف (الزامی)
                    </label>
                    {refFromUrl && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ از لینک دعوت
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    id="register-referral-code"
                    name="referralCode"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    dir="ltr"
                    placeholder="مثال: HNR-8942 یا ART-5120"
                    value={regReferralCode}
                    onChange={(e) => setRegReferralCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-4 py-2.5 border-2 border-emerald-400 bg-emerald-50/40 rounded-xl focus:ring-2 focus:ring-emerald-500 text-center font-mono font-black text-sm tracking-widest text-emerald-950 uppercase"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 mr-1">
                    عضویت در پلتفرم هنرهاب فعلاً تنها با کد دعوت سایر هنرمندان یا ادمین امکان‌پذیر است.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 text-sm mt-3 flex items-center justify-center gap-2"
                >
                  {regLoading ? (
                    <span>در حال اعتبارسنجی...</span>
                  ) : (
                    <>
                      <span>دریافت کد تایید و ادامه</span>
                      <span>←</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* STEP 2 of Register: OTP Code */}
            <div className={regStep === 'otp' ? 'block' : 'hidden'}>
              <form onSubmit={handleCompleteRegistration} noValidate className="space-y-4">
                {/* Hidden inputs to preserve credential association for browser password managers */}
                <input
                  type="text"
                  name="username"
                  id="register-otp-username-hidden"
                  autoComplete="username"
                  value={regIdentifier}
                  readOnly
                  tabIndex={-1}
                  aria-hidden="true"
                  className="sr-only pointer-events-none opacity-0 absolute -z-10"
                />
                <input
                  type="password"
                  name="password"
                  id="register-otp-password-hidden"
                  autoComplete="new-password"
                  value={regPassword}
                  readOnly
                  tabIndex={-1}
                  aria-hidden="true"
                  className="sr-only pointer-events-none opacity-0 absolute -z-10"
                />

                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-emerald-700 block text-[11px] font-medium">کد تایید ارسال شده به:</span>
                    <span className="font-mono font-bold text-sm" dir="ltr">{regIdentifier}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRegStep('form');
                      setRegOtpCode('');
                      setErrorMsg('');
                    }}
                    className="text-emerald-800 hover:text-emerald-950 underline font-black text-xs cursor-pointer"
                  >
                    ویرایش و تغییر اطلاعات
                  </button>
                </div>

                {regDevCode && (
                  <div className={`text-xs font-mono font-bold p-3 rounded-xl border text-center ${
                    regMode === 'SANDBOX'
                      ? 'bg-sky-50 text-sky-900 border-sky-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}>
                    {regMode === 'SANDBOX' ? (
                      <div>
                        <span>🌐 تاییدشده توسط سندباکس sms.ir: </span>
                        <span className="text-lg text-sky-700 select-all font-black">{regDevCode}</span>
                        <span className="block text-[10px] text-sky-600 mt-0.5 font-sans">
                          (وب‌سرویس sms.ir درخواست را تایید کرد، اما در سندباکس پیامک مخابراتی به گوشی ارسال نمی‌شود)
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span>🔑 کد تایید شبیه‌ساز لوکال (Mock): </span>
                        <span className="text-lg text-emerald-700 select-all font-black">{regDevCode}</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                    کد ۵ رقمی تایید را وارد کنید
                  </label>
                  <input
                    type="text"
                    id="register-otp"
                    name="oneTimeCode"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    dir="ltr"
                    maxLength={5}
                    placeholder="• • • • •"
                    value={regOtpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setRegOtpCode(val);
                      if (regMethod === 'email' && val.length === 5 && !regLoading) {
                        handleCompleteRegistration(undefined, val);
                      }
                    }}
                    autoFocus
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-center font-mono text-2xl tracking-[0.5em] text-slate-900 bg-slate-50/50"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  {regTimer > 0 ? (
                    <span>امکان ارسال مجدد تا {regTimer} ثانیه</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRegisterFormSubmit}
                      className="text-teal-600 hover:text-teal-700 font-bold cursor-pointer"
                    >
                      ارسال مجدد کد تایید
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={regLoading || regOtpCode.length !== 5}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 text-sm cursor-pointer"
                >
                  {regLoading ? 'در حال ثبت‌نام و ساخت حساب...' : 'تکمیل ثبت‌نام و ورود به هنرهاب'}
                </button>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRegStep('form');
                      setRegOtpCode('');
                      setErrorMsg('');
                    }}
                    className="flex-1 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>←</span>
                    <span>مرحله قبل (ویرایش اطلاعات)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMainMode('login');
                      setRegPassword('');
                      setRegConfirmPassword('');
                      setShowRegPassword(false);
                      setRegStep('form');
                      setRegOtpCode('');
                      setErrorMsg('');
                      setIsUnregisteredError(false);
                      setUnregisteredEmail(null);
                      if (searchParams.get('error')) {
                        router.replace('/artist-panel/login', { scroll: false });
                      }
                    }}
                    className="py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>🔐</span>
                    <span>ورود به هنرهاب</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FORGOT PASSWORD MODAL                                     */}
      {/* ======================================================== */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          onClick={handleCloseForgotModal}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800">بازیابی رمز عبور</h3>
              <button
                type="button"
                onClick={handleCloseForgotModal}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                title="بستن"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border border-red-200">
                {forgotError}
              </div>
            )}

            {forgotMsg && (
              <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-3 rounded-xl border border-emerald-200">
                {forgotMsg}
              </div>
            )}

            {forgotStep === 'request' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    شماره موبایل یا ایمیل حساب کاربری
                  </label>
                  <input
                    type="text"
                    id="forgot-identifier"
                    name="username"
                    autoComplete="username"
                    dir="ltr"
                    placeholder="09123456789 یا email@example.com"
                    value={forgotTarget}
                    onChange={(e) => setForgotTarget(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleForgotRequest();
                      }
                    }}
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-center font-mono text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    کد یکبار مصرف ۵ رقمی جهت بازیابی رمز عبور ارسال خواهد شد.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleForgotRequest()}
                    disabled={forgotLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? 'در حال ارسال...' : 'ارسال کد بازیابی'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseForgotModal}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    کد ۵ رقمی ارسال‌شده
                  </label>
                  <input
                    type="text"
                    id="forgot-code"
                    name="oneTimeCode"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    dir="ltr"
                    maxLength={5}
                    placeholder="• • • • •"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleForgotReset();
                      }
                    }}
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-center font-mono text-lg tracking-widest text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    رمز عبور جدید (حداقل ۶ کاراکتر)
                  </label>
                  <div className="relative">
                    <input
                      ref={forgotPasswordInputRef}
                      type={showForgotNewPassword ? 'text' : 'password'}
                      id="forgot-new-password"
                      name="new-password"
                      autoComplete="new-password"
                      dir="ltr"
                      placeholder="••••••••"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleForgotReset();
                        }
                      }}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-center font-mono text-sm tracking-widest text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showForgotNewPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                      aria-label={showForgotNewPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                    >
                      {showForgotNewPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleForgotReset()}
                    disabled={forgotLoading || forgotCode.length !== 5}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? 'در حال ذخیره...' : 'تنظیم رمز جدید و ورود'}
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotBackToRequest}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    بازگشت
                  </button>
                </div>
              </div>
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
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ArtistLoginContent />
    </Suspense>
  );
}

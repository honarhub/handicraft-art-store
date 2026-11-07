'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useCart, getCartItemId } from '../context/CartContext';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import { IRAN_PROVINCES } from '@/lib/provinces';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';
import { toPersianDigits } from '@/lib/date';
import Link from 'next/link';
import WaveDotsLoader from '@/app/components/WaveDotsLoader';

interface SavedAddress {
  id: string;
  title: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const { data: session } = useSession();
  const { items, totalPrice, clearCart, removeFromCart } = useCart();
  const [mounted, setMounted] = useState(false);

  // 3-Step Checkout: 1: Shipping, 2: Review, 3: Payment
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<number>(1);

  // Saved addresses for logged in user
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [showOtherAddresses, setShowOtherAddresses] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Track if user manually typed a new address so login doesn't overwrite it
  const isManuallyTypedRef = useRef(false);

  // Address Form State
  const [formData, setFormData] = useState({
    recipientName: '',
    phone: '',
    province: '',
    city: '',
    address: '',
    postalCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auth Modal State for Guest Users during Checkout
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'REGISTER' | 'PASSWORD_LOGIN' | 'OTP_LOGIN';
    normalizedPhone: string;
    userName?: string;
    otpCode: string;
    password: string;
    showPassword: boolean;
    loading: boolean;
    error: string;
    timer: number;
  }>({
    isOpen: false,
    mode: 'REGISTER',
    normalizedPhone: '',
    userName: '',
    otpCode: '',
    password: '',
    showPassword: false,
    loading: false,
    error: '',
    timer: 120,
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'bank'>('bank');
  const [isProcessing, setIsProcessing] = useState(false);

  const toEnglishDigits = (str: string) => {
    return str
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch saved addresses if user is logged in
  useEffect(() => {
    if (session?.user?.id) {
      setLoadingAddresses(true);
      fetch('/api/user/addresses')
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);

            // If user has manually typed an address before logging in, PRESERVE IT and do not overwrite!
            if (isManuallyTypedRef.current && formData.address && formData.province) {
              setSelectedAddressId('new');
              return;
            }

            const defaultAddr = data.addresses.find((a: SavedAddress) => a.isDefault) || data.addresses[0];
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id);
              setFormData({
                recipientName: defaultAddr.recipientName,
                phone: defaultAddr.phoneNumber,
                province: defaultAddr.province,
                city: defaultAddr.city,
                address: defaultAddr.address,
                postalCode: defaultAddr.postalCode,
              });
            } else {
              setSelectedAddressId('new');
              setFormData((prev) => ({
                ...prev,
                recipientName: prev.recipientName || session.user.name || '',
              }));
            }
          }
        })
        .catch((err) => console.error('Failed to load user addresses:', err))
        .finally(() => setLoadingAddresses(false));
    }
  }, [session?.user?.id]);

  // Cities for the currently selected province in the form
  const availableCities = useMemo(() => {
    if (!formData.province) return [];
    const found = IRAN_PROVINCES.find((p) => p.name === formData.province);
    return found ? found.cities : [];
  }, [formData.province]);

  // Auth Timer Countdown
  useEffect(() => {
    let interval: any;
    if (authModal.isOpen && (authModal.mode === 'REGISTER' || authModal.mode === 'OTP_LOGIN') && authModal.timer > 0) {
      interval = setInterval(() => {
        setAuthModal((prev) => ({ ...prev, timer: Math.max(0, prev.timer - 1) }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authModal.isOpen, authModal.mode, authModal.timer]);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
        <SiteHeader />
        <main className="flex-1 w-full flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xs border border-slate-200 text-center max-w-md w-full">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">سبد خرید شما خالی است</h2>
            <p className="text-xs text-slate-500 mb-6">هیچ اثر هنری در سبد خرید شما وجود ندارد.</p>
            <Link
              href="/products"
              className="inline-block w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-600 transition-colors"
            >
              بازگشت به گالری آثار
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Handle selecting a saved address
  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    isManuallyTypedRef.current = false;
    setFormData({
      recipientName: addr.recipientName,
      phone: addr.phoneNumber,
      province: addr.province,
      city: addr.city,
      address: addr.address,
      postalCode: addr.postalCode,
    });
    setErrors({});
    setShowOtherAddresses(false);
  };

  // Switch to new address form
  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    isManuallyTypedRef.current = true;
    setFormData({
      recipientName: session?.user?.name || '',
      phone: '',
      province: '',
      city: '',
      address: '',
      postalCode: '',
    });
    setErrors({});
    setShowOtherAddresses(false);
  };

  // Validate Step 1 Form with auto-scroll to first invalid input
  const validateShippingForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'لطفاً نام و نام خانوادگی تحویل‌گیرنده را وارد کنید.';
    }

    const cleanPhone = normalizePhoneNumber(formData.phone);
    if (!cleanPhone || !isValidIranianMobile(cleanPhone)) {
      newErrors.phone = 'شماره موبایل معتبر الزامی است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).';
    }

    if (!formData.province.trim()) {
      newErrors.province = 'لطفاً استان تحویل سفارش را انتخاب کنید.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'لطفاً شهر تحویل سفارش را انتخاب کنید.';
    }

    if (!formData.address.trim() || formData.address.trim().length < 8) {
      newErrors.address = 'نشانی پستی دقیق الزامی است (حداقل ۸ حرف).';
    }

    const cleanPostal = toEnglishDigits(formData.postalCode).replace(/\D/g, '');
    if (!cleanPostal || cleanPostal.length !== 10) {
      newErrors.postalCode = 'کد پستی باید دقیقاً ۱۰ رقمی باشد.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Auto-scroll to the first error input on mobile/desktop
      const firstErrorKey = Object.keys(newErrors)[0];
      if (firstErrorKey) {
        setTimeout(() => {
          const el = document.getElementById(`checkout-${firstErrorKey}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
        }, 50);
      }
      return false;
    }

    setErrors({});
    return true;
  };

  // Helper to save current address to DB if newly typed
  const saveCurrentAddressToDb = async (phoneToUse?: string) => {
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'آدرس خرید',
          recipientName: formData.recipientName,
          phoneNumber: normalizePhoneNumber(phoneToUse || formData.phone),
          province: formData.province,
          city: formData.city,
          address: formData.address,
          postalCode: formData.postalCode,
          isDefault: savedAddresses.length === 0,
        }),
      });
      const data = await res.json();
      if (data?.success && data?.address) {
        setSavedAddresses((prev) => [data.address, ...prev]);
        setSelectedAddressId(data.address.id);
      }
    } catch (err) {
      console.error('Failed to save address to DB:', err);
    }
  };

  // Handle Step 1 Submit (Next to Review)
  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateShippingForm()) return;

    const cleanPhone = normalizePhoneNumber(formData.phone);

    // If User is already logged in, save address if new and proceed directly to Step 2
    if (session?.user?.id) {
      if (selectedAddressId === 'new') {
        await saveCurrentAddressToDb(cleanPhone);
      }

      setStep(2);
      setMaxReachedStep((prev) => Math.max(prev, 2));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Guest User Flow: Mark that user typed an address
    isManuallyTypedRef.current = true;

    try {
      const res = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanPhone, loginType: 'user' }),
      });
      const data = await res.json();

      if (data.exists) {
        // Existing user: Open Password / OTP login modal
        setAuthModal({
          isOpen: true,
          mode: data.hasPassword ? 'PASSWORD_LOGIN' : 'OTP_LOGIN',
          normalizedPhone: cleanPhone,
          userName: data.name || '',
          otpCode: '',
          password: '',
          showPassword: false,
          loading: false,
          error: '',
          timer: 120,
        });

        // If they don't have password, send OTP immediately
        if (!data.hasPassword) {
          fetch('/api/auth/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: cleanPhone, type: 'PHONE_OTP', purpose: 'customer' }),
          }).catch((err) => console.error('Send OTP error:', err));
        }
      } else {
        // New user: Send OTP and open Auto-Registration Modal
        setAuthModal({
          isOpen: true,
          mode: 'REGISTER',
          normalizedPhone: cleanPhone,
          userName: formData.recipientName,
          otpCode: '',
          password: '',
          showPassword: false,
          loading: false,
          error: '',
          timer: 120,
        });

        fetch('/api/auth/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, type: 'PHONE_OTP', purpose: 'customer' }),
        }).catch((err) => console.error('Send OTP error:', err));
      }
    } catch (err) {
      console.error('Check user error:', err);
      // Fallback: allow proceeding directly
      setStep(2);
      setMaxReachedStep((prev) => Math.max(prev, 2));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper to trigger browser password save dialog
  const triggerBrowserCredentialSave = async (phone: string, pass: string, name: string) => {
    if (typeof window !== 'undefined' && (window as any).PasswordCredential && navigator.credentials) {
      try {
        const cred = new (window as any).PasswordCredential({
          id: phone,
          password: pass,
          name: name || 'کاربر هنرهاب',
        });
        await navigator.credentials.store(cred);
      } catch {
        // Ignore fallback
      }
    }
  };

  // Handle Guest Auth Submission (Auto Register or Login)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModal((prev) => ({ ...prev, error: '', loading: true }));

    try {
      if (authModal.mode === 'REGISTER') {
        if (!authModal.otpCode || authModal.otpCode.trim().length !== 5) {
          throw new Error('کد تایید ۵ رقمی پیامک‌شده را وارد نمایید.');
        }
        if (!authModal.password || authModal.password.length < 6) {
          throw new Error('تعیین رمز عبور با حداقل ۶ کاراکتر الزامی است.');
        }

        // 1. Register user
        const regRes = await fetch('/api/auth/customer/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: authModal.normalizedPhone,
            name: formData.recipientName,
            password: authModal.password,
            code: authModal.otpCode.trim(),
          }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'خطا در ایجاد حساب کاربری');

        // Trigger browser credential save
        await triggerBrowserCredentialSave(authModal.normalizedPhone, authModal.password, formData.recipientName);

        // 2. Automatically sign in
        const signInRes = await signIn('credentials', {
          redirect: false,
          phone: authModal.normalizedPhone,
          password: authModal.password,
          loginType: 'user',
        });

        if (signInRes?.error) {
          throw new Error('حساب ایجاد شد اما ورود خودکار با خطا مواجه شد. لطفاً وارد شوید.');
        }

        // 3. Save the newly typed address into the newly created account
        await saveCurrentAddressToDb(authModal.normalizedPhone);

        setAuthModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        setStep(2);
        setMaxReachedStep((prev) => Math.max(prev, 2));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (authModal.mode === 'PASSWORD_LOGIN') {
        if (!authModal.password) {
          throw new Error('رمز عبور خود را وارد نمایید.');
        }

        const signInRes = await signIn('credentials', {
          redirect: false,
          phone: authModal.normalizedPhone,
          password: authModal.password,
          loginType: 'user',
        });

        if (signInRes?.error) {
          throw new Error('رمز عبور وارد شده نادرست است.');
        }

        // Trigger browser credential save
        await triggerBrowserCredentialSave(authModal.normalizedPhone, authModal.password, authModal.userName || '');

        // Save newly typed address to the account as a new address
        await saveCurrentAddressToDb(authModal.normalizedPhone);

        setAuthModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        setStep(2);
        setMaxReachedStep((prev) => Math.max(prev, 2));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (authModal.mode === 'OTP_LOGIN') {
        if (!authModal.otpCode || authModal.otpCode.trim().length !== 5) {
          throw new Error('کد تایید ۵ رقمی را کامل وارد نمایید.');
        }

        const signInRes = await signIn('credentials', {
          redirect: false,
          phone: authModal.normalizedPhone,
          code: authModal.otpCode.trim(),
          loginType: 'user',
        });

        if (signInRes?.error) {
          throw new Error('کد تایید نامعتبر یا منقضی شده است.');
        }

        // Save newly typed address to the account as a new address
        await saveCurrentAddressToDb(authModal.normalizedPhone);

        setAuthModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        setStep(2);
        setMaxReachedStep((prev) => Math.max(prev, 2));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setAuthModal((prev) => ({ ...prev, error: err.message || 'خطا در پردازش اطلاعات', loading: false }));
    }
  };

  // Resend OTP in modal
  const handleResendOtp = async () => {
    setAuthModal((prev) => ({ ...prev, error: '', loading: true }));
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: authModal.normalizedPhone,
          type: 'PHONE_OTP',
          purpose: 'customer',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ارسال کد');
      setAuthModal((prev) => ({ ...prev, timer: 120, loading: false }));
    } catch (err: any) {
      setAuthModal((prev) => ({ ...prev, error: err.message || 'خطا در ارسال مجدد کد', loading: false }));
    }
  };

  // Step 3 Payment Handler
  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          total: totalPrice,
          shippingAddress: formData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت سفارش');

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        clearCart();
        const orderId = data.orderId || 'ORD-' + Math.floor(100000 + Math.random() * 900000);
        window.location.href = `/checkout/success?orderId=${orderId}`;
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      alert(err.message || 'خطا در اتصال به درگاه پرداخت');
      setIsProcessing(false);
    }
  };

  // Navigate to step if allowed
  const goToStep = (targetStep: 1 | 2 | 3) => {
    if (targetStep <= maxReachedStep || (targetStep === 2 && validateShippingForm())) {
      setStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Find currently active saved address object if any
  const currentSavedAddress = savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />

      <main className="flex-1 w-full py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header & Back Link */}
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/cart"
              className="text-slate-500 hover:text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
              <span>بازگشت به سبد خرید</span>
            </Link>

            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              تکمیل سفارش و خرید
            </h1>
          </div>

          {/* Interactive 3-Step Stepper with Clickable Circles */}
          <div className="flex items-center justify-center mb-12 sm:mb-14">
            <div className="flex items-center w-full max-w-md px-2">
              {/* Step 1 Circle */}
              <div className="flex flex-col items-center relative z-10">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-sm transition-all cursor-pointer ${
                    step >= 1
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-100'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                  title="مرحله ۱: اطلاعات ارسال"
                >
                  {toPersianDigits(1)}
                </button>
                <div
                  onClick={() => goToStep(1)}
                  className={`absolute top-12 sm:top-13 whitespace-nowrap text-xs font-bold cursor-pointer ${
                    step === 1 ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  اطلاعات ارسال
                </div>
              </div>

              {/* Progress Line 1-2 */}
              <div
                className={`flex-1 h-1.5 mx-2 rounded-full transition-colors duration-300 ${
                  step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'
                }`}
              />

              {/* Step 2 Circle */}
              <div className="flex flex-col items-center relative z-10">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-sm transition-all cursor-pointer ${
                    step >= 2
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-100'
                      : maxReachedStep >= 2
                      ? 'bg-slate-300 text-slate-700'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                  title="مرحله ۲: بررسی نهایی خرید"
                >
                  {toPersianDigits(2)}
                </button>
                <div
                  onClick={() => goToStep(2)}
                  className={`absolute top-12 sm:top-13 whitespace-nowrap text-xs font-bold cursor-pointer ${
                    step === 2 ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  بررسی نهایی خرید
                </div>
              </div>

              {/* Progress Line 2-3 */}
              <div
                className={`flex-1 h-1.5 mx-2 rounded-full transition-colors duration-300 ${
                  step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'
                }`}
              />

              {/* Step 3 Circle */}
              <div className="flex flex-col items-center relative z-10">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-sm transition-all cursor-pointer ${
                    step >= 3
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-100'
                      : maxReachedStep >= 3
                      ? 'bg-slate-300 text-slate-700'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                  title="مرحله ۳: پرداخت"
                >
                  {toPersianDigits(3)}
                </button>
                <div
                  onClick={() => goToStep(3)}
                  className={`absolute top-12 sm:top-13 whitespace-nowrap text-xs font-bold cursor-pointer ${
                    step === 3 ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  پرداخت و ثبت نهایی
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 mt-12 sm:mt-16">
            {/* Main Stage Content */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 md:p-8">
                {/* Top Navigation Bar: Back button at top right (RTL start) */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                  {step === 1 ? (
                    <Link
                      href="/cart"
                      className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-200 px-3.5 py-2 rounded-xl transition-all group"
                      title="بازگشت به سبد خرید"
                    >
                      <svg className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>بازگشت به سبد خرید</span>
                    </Link>
                  ) : step === 2 ? (
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer group"
                      title="بازگشت به مرحله قبلی"
                    >
                      <svg className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>بازگشت</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer group"
                      title="بازگشت به مرحله قبلی"
                    >
                      <svg className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                      <span>بازگشت</span>
                    </button>
                  )}

                  <span className="text-[11px] font-bold text-slate-400">
                    مرحله {toPersianDigits(step)} از {toPersianDigits(3)}
                  </span>
                </div>

                {/* ---------------- STEP 1: SHIPPING & ADDRESS ---------------- */}
                {step === 1 && (
                  <form onSubmit={handleShippingSubmit} noValidate className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
                        <span className="text-xl">📍</span>
                        <span>نشانی تحویل و اطلاعات گیرنده</span>
                      </h2>
                      {session?.user && (
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                          حساب کاربری فعال
                        </span>
                      )}
                    </div>

                    {/* Logged in User: Default Selected Address View + Other Addresses Option */}
                    {session?.user && savedAddresses.length > 0 && selectedAddressId !== 'new' && currentSavedAddress && (
                      <div className="space-y-4">
                        {/* Currently Selected (Default) Address Card */}
                        <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              <span className="font-black text-sm text-slate-900">
                                {currentSavedAddress.title || 'نشانی پیش‌فرض تحویل سفارش'}
                              </span>
                              {currentSavedAddress.isDefault && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                                  پیش‌فرض
                                </span>
                              )}
                            </div>

                            {/* Button to toggle other addresses */}
                            <button
                              type="button"
                              onClick={() => setShowOtherAddresses(!showOtherAddresses)}
                              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-2xs"
                            >
                              <span>{showOtherAddresses ? 'بستن لیست نشانی‌ها' : 'انتخاب سایر نشانی‌ها / آدرس جدید'}</span>
                              <span className={`text-[10px] transition-transform ${showOtherAddresses ? 'rotate-180' : ''}`}>▾</span>
                            </button>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                            استان {currentSavedAddress.province}، شهر {currentSavedAddress.city}، {currentSavedAddress.address}
                          </p>

                          <div className="text-xs text-slate-600 pt-2 border-t border-emerald-100 flex flex-wrap items-center gap-x-6 gap-y-1">
                            <div>
                              تحویل‌گیرنده: <strong className="text-slate-900">{currentSavedAddress.recipientName}</strong>
                            </div>
                            <div>
                              شماره تماس: <strong className="text-slate-900 font-mono">{toPersianDigits(currentSavedAddress.phoneNumber)}</strong>
                            </div>
                            {currentSavedAddress.postalCode && (
                              <div>
                                کد پستی: <strong className="text-slate-900 font-mono">{toPersianDigits(currentSavedAddress.postalCode)}</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expandable list of OTHER saved addresses + Add New Address Button */}
                        {showOtherAddresses && (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
                            <div className="text-xs font-bold text-slate-700 mb-1">
                              سایر نشانی‌های ذخیره‌شده شما:
                            </div>

                            <div className="space-y-2">
                              {savedAddresses
                                .filter((a) => a.id !== currentSavedAddress.id)
                                .map((addr) => (
                                  <div
                                    key={addr.id}
                                    onClick={() => handleSelectSavedAddress(addr)}
                                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white cursor-pointer flex items-center justify-between gap-3 transition-colors"
                                  >
                                    <div>
                                      <div className="font-bold text-xs text-slate-900">{addr.title || 'نشانی'}</div>
                                      <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                                        {addr.province}، {addr.city}، {addr.address}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectSavedAddress(addr)}
                                      className="shrink-0 px-3 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold text-slate-700 transition-colors"
                                    >
                                      انتخاب
                                    </button>
                                  </div>
                                ))}

                              {/* Button to add a brand new address */}
                              <button
                                type="button"
                                onClick={handleSelectNewAddress}
                                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-teal-400 bg-teal-50/60 hover:bg-teal-100/70 text-teal-800 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                              >
                                <span className="text-base">+</span>
                                <span>افزودن و استفاده از یک نشانی جدید</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* New Address Input Form (shown if guest OR selectedAddressId === 'new' OR no saved addresses) */}
                    {(selectedAddressId === 'new' || savedAddresses.length === 0 || !session?.user) && (
                      <div className="space-y-4 pt-1">
                        {session?.user && savedAddresses.length > 0 && (
                          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                            <span className="font-bold text-slate-700">در حال ثبت نشانی جدید:</span>
                            <button
                              type="button"
                              onClick={() => {
                                const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
                                if (defaultAddr) handleSelectSavedAddress(defaultAddr);
                              }}
                              className="text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                            >
                              بازگشت به نشانی‌های ذخیره‌شده
                            </button>
                          </div>
                        )}

                        {/* Name and Mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="checkout-recipientName" className="block text-xs font-bold text-slate-700 mb-1.5">
                              نام و نام خانوادگی تحویل‌گیرنده <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id="checkout-recipientName"
                              name="name"
                              autoComplete="name"
                              value={formData.recipientName}
                              onChange={(e) => {
                                isManuallyTypedRef.current = true;
                                setFormData({ ...formData, recipientName: e.target.value });
                                if (errors.recipientName) setErrors({ ...errors, recipientName: '' });
                              }}
                              placeholder="مثال: علی رضایی"
                              required
                              className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 font-medium placeholder:text-slate-400 text-xs sm:text-sm outline-none transition-all ${
                                errors.recipientName ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-500'
                              }`}
                            />
                            {errors.recipientName && (
                              <p className="text-red-500 text-[11px] font-bold mt-1">{errors.recipientName}</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="checkout-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                              شماره تماس تحویل‌گیرنده <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              id="checkout-phone"
                              name="tel"
                              autoComplete="tel"
                              dir="ltr"
                              value={formData.phone}
                              onChange={(e) => {
                                isManuallyTypedRef.current = true;
                                const val = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 11);
                                setFormData({ ...formData, phone: val });
                                if (errors.phone) setErrors({ ...errors, phone: '' });
                              }}
                              placeholder="09123456789"
                              required
                              className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 font-mono text-center tracking-wider text-xs sm:text-sm outline-none transition-all ${
                                errors.phone ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-500'
                              }`}
                            />
                            {errors.phone && (
                              <p className="text-red-500 text-[11px] font-bold mt-1">{errors.phone}</p>
                            )}
                          </div>
                        </div>

                        {/* Province and City Dropdowns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="checkout-province" className="block text-xs font-bold text-slate-700 mb-1.5">
                              استان تحویل سفارش <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="checkout-province"
                              name="address-level1"
                              autoComplete="address-level1"
                              value={formData.province}
                              onChange={(e) => {
                                isManuallyTypedRef.current = true;
                                const newProv = e.target.value;
                                const targetProv = IRAN_PROVINCES.find((p) => p.name === newProv);
                                setFormData({
                                  ...formData,
                                  province: newProv,
                                  city: targetProv && targetProv.cities.length > 0 ? targetProv.cities[0] : '',
                                });
                                if (errors.province) setErrors({ ...errors, province: '', city: '' });
                              }}
                              required
                              className={`w-full px-3.5 py-3 rounded-xl border bg-white text-slate-900 font-medium text-xs sm:text-sm outline-none transition-all cursor-pointer ${
                                errors.province ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-500'
                              }`}
                            >
                              <option value="">انتخاب استان...</option>
                              {IRAN_PROVINCES.map((p) => (
                                <option key={p.name} value={p.name}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            {errors.province && (
                              <p className="text-red-500 text-[11px] font-bold mt-1">{errors.province}</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="checkout-city" className="block text-xs font-bold text-slate-700 mb-1.5">
                              شهر / شهرستان <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="checkout-city"
                              name="address-level2"
                              autoComplete="address-level2"
                              value={formData.city}
                              onChange={(e) => {
                                isManuallyTypedRef.current = true;
                                setFormData({ ...formData, city: e.target.value });
                                if (errors.city) setErrors({ ...errors, city: '' });
                              }}
                              disabled={!formData.province || availableCities.length === 0}
                              required
                              className={`w-full px-3.5 py-3 rounded-xl border bg-white text-slate-900 font-medium text-xs sm:text-sm outline-none transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 ${
                                errors.city ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-500'
                              }`}
                            >
                              <option value="">
                                {formData.province ? 'انتخاب شهر...' : 'ابتدا استان را انتخاب کنید'}
                              </option>
                              {availableCities.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                            {errors.city && (
                              <p className="text-red-500 text-[11px] font-bold mt-1">{errors.city}</p>
                            )}
                          </div>
                        </div>

                        {/* Postal Address */}
                        <div>
                          <label htmlFor="checkout-address" className="block text-xs font-bold text-slate-700 mb-1.5">
                            نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="checkout-address"
                            name="street-address"
                            autoComplete="street-address"
                            rows={3}
                            value={formData.address}
                            onChange={(e) => {
                              isManuallyTypedRef.current = true;
                              setFormData({ ...formData, address: e.target.value });
                              if (errors.address) setErrors({ ...errors, address: '' });
                            }}
                            placeholder="مثال: خیابان شریعتی، بالاتر از پل رومی، کوچه بنفشه، پلاک ۱۸، واحد ۴"
                            required
                            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 font-medium placeholder:text-slate-400 text-xs sm:text-sm outline-none resize-none transition-all ${
                              errors.address ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-500'
                            }`}
                          />
                          {errors.address && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">{errors.address}</p>
                          )}
                        </div>

                        {/* Postal Code */}
                        <div>
                          <label htmlFor="checkout-postalCode" className="block text-xs font-bold text-slate-700 mb-1.5">
                            کد پستی (۱۰ رقم) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="checkout-postalCode"
                            name="postal-code"
                            autoComplete="postal-code"
                            dir="ltr"
                            value={formData.postalCode}
                            onChange={(e) => {
                              isManuallyTypedRef.current = true;
                              const val = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 10);
                              setFormData({ ...formData, postalCode: val });
                              if (errors.postalCode) setErrors({ ...errors, postalCode: '' });
                            }}
                            placeholder="1234567890"
                            required
                            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 font-mono text-center tracking-wider text-xs sm:text-sm outline-none transition-all ${
                              errors.postalCode ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-emerald-500'
                            }`}
                          />
                          {errors.postalCode && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">{errors.postalCode}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 1 Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>تایید و ادامه به بررسی نهایی خرید</span>
                      <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </form>
                )}

                {/* ---------------- STEP 2: ORDER & SHIPPING REVIEW ---------------- */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </span>
                        <span>بررسی نهایی اطلاعات خرید</span>
                      </h2>
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>ویرایش آدرس</span>
                      </button>
                    </div>

                    {/* Shipping Address Summary Card */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">نشانی تحویل گیرنده:</span>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                          تایید شده ✓
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                        استان {formData.province}، شهر {formData.city}، {formData.address}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                        <div>
                          تحویل‌گیرنده: <strong className="text-slate-900">{formData.recipientName}</strong>
                        </div>
                        <div>
                          شماره تماس: <strong className="text-slate-900 font-mono">{toPersianDigits(formData.phone)}</strong>
                        </div>
                        <div>
                          کد پستی: <strong className="text-slate-900 font-mono">{toPersianDigits(formData.postalCode)}</strong>
                        </div>
                        <div>
                          نحوه ارسال: <strong className="text-teal-800">پست پیشتاز با بسته‌بندی امن</strong>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Step 2 - Forward action only, back button moved to top right */}
                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(3);
                          setMaxReachedStep((prev) => Math.max(prev, 3));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <span>تایید سفارش و انتخاب درگاه پرداخت</span>
                        <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* ---------------- STEP 3: PAYMENT ---------------- */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
                        <span>💳</span>
                        <span>انتخاب روش پرداخت بانکی</span>
                      </h2>
                    </div>

                    <div className="space-y-3">
                      {/* Bank Gateway */}
                      <label
                        className={`block cursor-pointer border-2 rounded-2xl p-4.5 transition-all ${
                          paymentMethod === 'bank'
                            ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="paymentOption"
                            value="bank"
                            checked={paymentMethod === 'bank'}
                            onChange={() => setPaymentMethod('bank')}
                            className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="font-black text-sm text-slate-900">
                              درگاه پرداخت اینترنتی شاپرک (تمامی کارت‌های شتاب)
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              اتصال ایمن به شبکه پرداخت الکترونیک کشور با ضمانت بازگشت وجه هنرهاب
                            </div>
                          </div>
                          <div className="text-3xl opacity-80 shrink-0">💳</div>
                        </div>
                      </label>

                      {/* Crypto Gateway (Disabled) */}
                      <div className="border-2 border-slate-200 bg-slate-50/70 rounded-2xl p-4.5 opacity-50 cursor-not-allowed select-none">
                        <div className="flex items-center gap-4">
                          <input type="radio" disabled name="paymentOption" value="crypto" className="w-5 h-5 cursor-not-allowed" />
                          <div className="flex-1">
                            <div className="font-bold text-sm text-slate-500 flex items-center gap-2">
                              <span>پرداخت رمزارزی (تتر USDT)</span>
                              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                به‌زودی
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              پشتیبانی از تتر بر بستر شبکه TRC20 و Arbitrum
                            </div>
                          </div>
                          <div className="text-3xl opacity-40 shrink-0">🪙</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Step 3 - Payment forward action only, back button moved to top right */}
                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98"
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>در حال انتقال به درگاه پرداخت...</span>
                          </>
                        ) : (
                          <>
                            <span>پرداخت امن مبلغ {toPersianDigits(totalPrice.toLocaleString())} تومان</span>
                            <span>←</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Sidebar */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 sticky top-24 space-y-4">
                <h3 className="font-black text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span>🧾</span>
                  <span>خلاصه فاکتور خرید</span>
                </h3>

                {/* Items Mini List */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id || item.productId} className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {toPersianDigits(item.quantity)} عدد • {toPersianDigits(item.price.toLocaleString())} ت
                        </div>
                      </div>

                      {/* Allow deletion only in step 1 (اطلاعات ارسال) */}
                      {step === 1 && (
                        <button
                          type="button"
                          onClick={() => removeFromCart(getCartItemId(item))}
                          title="حذف از سبد خرید"
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>مجموع ارزش آثار:</span>
                    <span className="font-bold text-slate-800">{toPersianDigits(totalPrice.toLocaleString())} تومان</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>بسته‌بندی و ارسال بیمه‌شده:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">رایگان (هدیه هنرهاب)</span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-black text-slate-900 text-sm">مبلغ نهایی قابل پرداخت:</span>
                    <div className="text-left">
                      <span className="font-black text-emerald-700 text-lg sm:text-xl font-mono">
                        {toPersianDigits(totalPrice.toLocaleString())}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-900 mr-1">تومان</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 text-center leading-relaxed">
                  🔒 خرید شما مشمول ضمانت اصالت فیزیکی و بازگشت وجه تا ۷ روز کاری است.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ---------------- GUEST AUTH MODAL (AUTO REGISTRATION / LOGIN) ---------------- */}
      {authModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl mb-3 shadow-2xs">
                {authModal.mode === 'REGISTER' ? '🎨' : '👋'}
              </div>

              {authModal.mode === 'REGISTER' && (
                <>
                  <h3 className="font-black text-slate-900 text-lg">به جمع هنر دوستان خوش اومدی :)</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed px-2">
                    کاربر گرامی، با وارد کردن کد تایید پیامک‌شده و تعیین یک رمز عبور، حساب کاربری شما به صورت خودکار ساخته
                    شده و نشانی به همراه سفارش جاری در حسابتان ثبت می‌شود.
                  </p>
                </>
              )}

              {authModal.mode === 'PASSWORD_LOGIN' && (
                <>
                  <h3 className="font-black text-slate-900 text-lg">
                    {authModal.userName ? `${authModal.userName} خوش اومدی :)` : 'خوش اومدی :)'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    حساب کاربری با شماره <span className="font-mono font-bold text-emerald-800 dir-ltr inline-block">{toPersianDigits(authModal.normalizedPhone)}</span> وجود دارد.
                    لطفاً رمز عبور خود را وارد کنید تا نشانی جدید به حسابتان اضافه شود.
                  </p>
                </>
              )}

              {authModal.mode === 'OTP_LOGIN' && (
                <>
                  <h3 className="font-black text-slate-900 text-lg">ورود با رمز یکبار مصرف پیامکی</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    کد تایید ۵ رقمی به شماره <span className="font-mono font-bold text-emerald-800 dir-ltr inline-block">{toPersianDigits(authModal.normalizedPhone)}</span> پیامک شد.
                  </p>
                </>
              )}
            </div>

            {authModal.error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{authModal.error}</span>
              </div>
            )}

            {/* Standard HTML Form enabling browser credential saving */}
            <form onSubmit={handleAuthSubmit} method="post" action="#" autoComplete="on" className="space-y-4">
              {/* Hidden semantic username field for browser password managers */}
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={authModal.normalizedPhone}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only pointer-events-none opacity-0 absolute -z-10"
              />

              {/* OTP Field (for REGISTER or OTP_LOGIN) */}
              {(authModal.mode === 'REGISTER' || authModal.mode === 'OTP_LOGIN') && (
                <div>
                  <label htmlFor="authModal-otp" className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                    کد تایید ۵ رقمی <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    id="authModal-otp"
                    name="one-time-code"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={5}
                    autoFocus
                    value={authModal.otpCode}
                    onChange={(e) => {
                      const val = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 5);
                      setAuthModal({ ...authModal, otpCode: val });
                    }}
                    placeholder="— — — — —"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none text-center font-mono text-xl tracking-widest bg-slate-50/50"
                  />

                  {/* Resend OTP Timer */}
                  <div className="mt-2 text-center text-xs text-slate-500">
                    {authModal.timer > 0 ? (
                      <span>
                        امکان ارسال مجدد کد تا{' '}
                        <strong className="font-mono text-emerald-700">
                          {toPersianDigits(Math.floor(authModal.timer / 60))}:{toPersianDigits((authModal.timer % 60).toString().padStart(2, '0'))}
                        </strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                      >
                        ارسال مجدد کد تایید
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Password Field (for REGISTER or PASSWORD_LOGIN) */}
              {(authModal.mode === 'REGISTER' || authModal.mode === 'PASSWORD_LOGIN') && (
                <div>
                  <label htmlFor="authModal-password" className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                    {authModal.mode === 'REGISTER'
                      ? 'تعیین رمز عبور برای ورودهای بعدی (حداقل ۶ کاراکتر)'
                      : 'رمز عبور حساب کاربری'} <span className="text-red-500">*</span>:
                  </label>
                  <div className="relative">
                    <input
                      type={authModal.showPassword ? 'text' : 'password'}
                      id="authModal-password"
                      name="password"
                      autoComplete={authModal.mode === 'REGISTER' ? 'new-password' : 'current-password'}
                      dir="ltr"
                      value={authModal.password}
                      onChange={(e) => setAuthModal({ ...authModal, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 outline-none text-center font-mono tracking-widest text-base text-slate-900 bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setAuthModal({ ...authModal, showPassword: !authModal.showPassword })}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={authModal.showPassword ? 'مخفی‌سازی رمز' : 'نمایش رمز'}
                    >
                      {authModal.showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Mode switch links */}
              {authModal.mode === 'PASSWORD_LOGIN' && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModal((prev) => ({ ...prev, mode: 'OTP_LOGIN', error: '', timer: 120 }));
                      fetch('/api/auth/otp/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: authModal.normalizedPhone, type: 'PHONE_OTP', purpose: 'customer' }),
                      });
                    }}
                    className="text-teal-700 hover:text-teal-900 font-bold cursor-pointer"
                  >
                    ورود با رمز یکبار مصرف پیامکی
                  </button>
                  <Link href="/forgot-password" target="_blank" className="text-slate-500 hover:text-slate-800">
                    فراموشی رمز؟
                  </Link>
                </div>
              )}

              {authModal.mode === 'OTP_LOGIN' && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthModal((prev) => ({ ...prev, mode: 'PASSWORD_LOGIN', error: '' }))}
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold cursor-pointer"
                  >
                    ورود با رمز عبور ثابت
                  </button>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="pt-3 space-y-2">
                <button
                  type="submit"
                  disabled={authModal.loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {authModal.loading ? (
                    <WaveDotsLoader />
                  ) : authModal.mode === 'REGISTER' ? (
                    <span>ثبت‌نام و ادامه به بررسی نهایی خرید</span>
                  ) : (
                    <span>ورود و ادامه به بررسی نهایی خرید</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthModal((prev) => ({ ...prev, isOpen: false }))}
                  className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  انصراف و تغییر اطلاعات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

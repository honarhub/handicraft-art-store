'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toPersianDigits } from '@/lib/date';
import { useCart } from '@/app/context/CartContext';

function GatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const orderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [cvv2, setCvv2] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [otp, setOtp] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('7392');

  // Timers
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [otpTimer, setOtpTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detect Bank from Card Prefix
  const getBankInfo = (num: string) => {
    const clean = num.replace(/\D/g, '');
    const prefix = clean.slice(0, 6);
    const banks: Record<string, { name: string; color: string }> = {
      '603799': { name: 'بانک ملی ایران', color: 'from-amber-600 to-red-700' },
      '610433': { name: 'بانک ملت', color: 'from-red-600 to-rose-800' },
      '622106': { name: 'بانک پارسیان', color: 'from-amber-500 to-red-600' },
      '502229': { name: 'بانک پاسارگاد', color: 'from-amber-400 to-yellow-600' },
      '621986': { name: 'بانک سامان', color: 'from-blue-600 to-sky-700' },
      '589210': { name: 'بانک سپه', color: 'from-yellow-600 to-amber-800' },
      '627353': { name: 'بانک تجارت', color: 'from-blue-700 to-indigo-900' },
      '603769': { name: 'بانک صادرات ایران', color: 'from-blue-800 to-indigo-950' },
      '628023': { name: 'بانک مسکن', color: 'from-orange-500 to-amber-700' },
      '504706': { name: 'بانک شهر', color: 'from-rose-600 to-red-800' },
      '603770': { name: 'بانک کشاورزی', color: 'from-emerald-600 to-green-800' },
      '505416': { name: 'بانک گردشگری', color: 'from-stone-600 to-slate-800' },
      '627412': { name: 'بانک اقتصاد نوین', color: 'from-purple-600 to-indigo-800' },
    };
    return banks[prefix] || (clean.length >= 6 ? { name: 'کارت عضو شبکه شتاب', color: 'from-slate-700 to-slate-900' } : null);
  };

  // Fetch Order
  useEffect(() => {
    if (!orderId) {
      setError('شناسه سفارش یافت نشد.');
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${orderId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('سفارش مورد نظر یافت نشد.');
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
      })
      .catch((err) => {
        setError(err.message || 'خطا در بارگذاری اطلاعات سفارش');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  // Main 10-Minute Countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // OTP Countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Format Card Number (adds spaces every 4 digits)
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Handle Dynamic OTP Request
  const handleRequestOtp = () => {
    if (cardNumber.replace(/\D/g, '').length < 16) {
      alert('لطفاً ابتدا شماره ۱۶ رقمی کارت بانکی خود را وارد کنید.');
      return;
    }
    setOtpTimer(120);
    const simulatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setTimeout(() => {
      setOtp(simulatedOtp);
    }, 1000);
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    const rawCard = cardNumber.replace(/\D/g, '');
    if (rawCard.length !== 16) {
      alert('شماره کارت بانکی باید ۱۶ رقم باشد.');
      return;
    }
    if (!cvv2 || cvv2.length < 3) {
      alert('کد CVV2 نامعتبر است.');
      return;
    }
    if (!expMonth || !expYear) {
      alert('تاریخ انقضای کارت را کامل وارد کنید.');
      return;
    }
    if (!otp) {
      alert('لطفاً رمز دوم یکبار مصرف را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          cardNumber: rawCard,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تایید تراکنش بانکی');

      // Clear local cart
      clearCart();

      // Redirect to success page
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (err: any) {
      console.error('Payment verify error:', err);
      alert(err.message || 'خطا در انجام عملیات بانکی');
      setIsSubmitting(false);
    }
  };

  // Handle Cancel
  const handleCancelPayment = async () => {
    if (window.confirm('آیا از انصراف از پرداخت اطمینان دارید؟ سبد خرید شما محفوظ خواهد ماند.')) {
      if (orderId) {
        try {
          await fetch('/api/orders/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          });
        } catch (e) {
          console.error('Failed to cancel order on gateway abort:', e);
        }
      }
      router.push('/cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-sm w-full">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-bold text-sm">در حال اتصال امن به شبکه پرداخت شاپرک...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-black text-slate-800 mb-2">خطا در بارگذاری درگاه</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'اطلاعات سفارش در دسترس نیست.'}</p>
          <button
            onClick={() => router.push('/cart')}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs"
          >
            بازگشت به سبد خرید
          </button>
        </div>
      </div>
    );
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const bankInfo = getBankInfo(cardNumber);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans py-6 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Test Mode Banner */}
        <div className="bg-amber-500 text-slate-900 px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between text-xs font-bold border border-amber-400">
          <span className="flex items-center gap-2">
            <span>🧪</span>
            <span>درگاه پرداخت امن شاپرک (محیط شبیه‌ساز رسمی تستی هنرهاب)</span>
          </span>
          <span className="text-[11px] bg-white/70 px-2 py-0.5 rounded-md">تست بدون کسر وجه واقعی</span>
        </div>

        {/* Shaparak Gateway Box */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-teal-800 via-teal-700 to-teal-900 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl font-black shadow-inner">
                💳
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight">سامانه پرداخت الکترونیک شاپرک</h1>
                <p className="text-xs text-teal-200 mt-0.5">پذیرنده: فروشگاه آنلاین صنایع دستی هنرهاب</p>
              </div>
            </div>

            <div className="text-left bg-black/20 px-3.5 py-2 rounded-xl border border-white/10">
              <div className="text-[10px] text-teal-200 font-medium">زمان باقی‌مانده</div>
              <div className="text-lg font-mono font-black text-amber-300">
                {formatTimer(timeLeft)}
              </div>
            </div>
          </div>

          {/* Merchant & Order Info Bar */}
          <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">شماره پذیرنده (Terminal):</span>
              <span className="font-mono font-bold text-slate-700">98421035</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">شماره سفارش:</span>
              <span className="font-mono font-bold text-slate-800">{order.orderNumber || order.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-400 block mb-0.5">مبلغ قابل پرداخت:</span>
              <span className="font-black text-teal-700 text-sm">
                {toPersianDigits(order.total.toLocaleString())} تومان
              </span>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmitPayment} className="p-6 space-y-5">
            {/* Card Number Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  شماره ۱۶ رقمی کارت بانکی <span className="text-red-500">*</span>
                </label>
                {bankInfo && (
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {bankInfo.name}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={handleCardChange}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full text-center font-mono text-base tracking-widest px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none transition-all placeholder:text-slate-300 font-bold"
                  maxLength={19}
                  required
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  💳
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                می‌توانید از هر شماره کارت تستی ۱۶ رقمی (مانند ۶۰۳۷۹۹...) استفاده کنید.
              </p>
            </div>

            {/* CVV2 and Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CVV2 */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  کد امنیتی CVV2 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={4}
                  value={cvv2}
                  onChange={(e) => setCvv2(e.target.value.replace(/\D/g, ''))}
                  placeholder="•••"
                  className="w-full text-center font-mono text-sm px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-bold"
                  required
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  تاریخ انقضای کارت (ماه / سال) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2" dir="ltr">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, ''))}
                    placeholder="ماه"
                    className="w-1/2 text-center font-mono text-sm px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-bold"
                    required
                  />
                  <span className="text-slate-400 font-bold">/</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ''))}
                    placeholder="سال"
                    className="w-1/2 text-center font-mono text-sm px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-bold"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dynamic SMS OTP */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  رمز دوم پویا (یکبار مصرف) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpTimer > 0}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors disabled:text-slate-400 cursor-pointer"
                >
                  {otpTimer > 0 ? `درخواست مجدد (${otpTimer} ثانیه)` : 'درخواست رمز پویا 📲'}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  dir="ltr"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="رمز پیامک‌شده"
                  className="flex-1 text-center font-mono text-base px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none transition-all font-bold tracking-wider"
                  required
                />
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 transition-colors"
                >
                  تولید خودکار
                </button>
              </div>
            </div>

            {/* Captcha */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                کد امنیتی داخل کادر <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={4}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="کد ۴ رقمی"
                  className="flex-1 text-center font-mono text-sm px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-none font-bold"
                  required
                />
                <div
                  onClick={() => setCaptchaCode(Math.floor(1000 + Math.random() * 9000).toString())}
                  className="bg-slate-800 text-amber-300 px-4 py-2 rounded-xl font-mono text-lg font-black tracking-widest cursor-pointer select-none border border-slate-700 line-through"
                  title="کلیک برای تغییر کد امنیتی"
                >
                  {captchaCode}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSubmitting || timeLeft <= 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-6 rounded-xl text-sm transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>در حال ارتباط با بانک...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>پرداخت مبلغ {toPersianDigits(order.total.toLocaleString())} تومان</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancelPayment}
                disabled={isSubmitting}
                className="sm:w-36 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl text-xs transition-colors border border-slate-300 cursor-pointer"
              >
                انصراف از پرداخت
              </button>
            </div>
          </form>

          {/* Footer Security Badges */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>اتصال رمزنگاری‌شده SSL ۲۵۶ بیتی امن</span>
            </span>
            <span className="font-mono text-slate-400">SHAPARAK INTEGRATION v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentGatewayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">در حال آماده‌سازی درگاه پرداخت...</div>}>
      <GatewayContent />
    </Suspense>
  );
}

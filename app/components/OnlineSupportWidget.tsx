'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

type SupportStep = 'PHONE' | 'MENU' | 'REFERRAL' | 'FEEDBACK_FORM' | 'FEEDBACK_SUCCESS' | 'DIRECT_CONTACT';

export default function OnlineSupportWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<SupportStep>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCategories, setSubmittedCategories] = useState<Set<string>>(new Set());

  // Restore phone number from localStorage on client mount if available
  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem('honarhub_support_phone');
      if (savedPhone) {
        setPhoneNumber(savedPhone);
      }
    } catch {}
  }, []);

  // Do not render on admin or artist panel pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/artist-panel')) {
    return null;
  }

  // Telegram SVG Logo icon
  const TelegramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.05-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.44 3.8-1.58 4.59-1.86 5.11-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.22z"/>
    </svg>
  );

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

  const validatePhone = (phone: string): boolean => {
    const clean = normalizePhone(phone);
    return /^09[0-9]{9}$/.test(clean);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    const clean = normalizePhone(phoneNumber);
    if (!validatePhone(clean)) {
      setPhoneError('لطفاً یک شماره موبایل معتبر ۱۱ رقمی (مثال: ۰۹۱۲۳۴۵۶۷۸۹) وارد فرمایید.');
      return;
    }
    if (clean !== phoneNumber) {
      setSubmittedCategories(new Set());
    }
    setPhoneNumber(clean);
    try {
      localStorage.setItem('honarhub_support_phone', clean);
    } catch {}
    setStep('MENU');
  };

  const handleOptionSelect = async (option: 'REFERRAL_CODE' | 'FEEDBACK' | 'DIRECT_CONTACT') => {
    if (option === 'FEEDBACK') {
      setFeedbackError('');
      setFeedbackText('');
      setStep('FEEDBACK_FORM');
      return;
    }

    // Automatically record option request to backend ONLY if not already submitted
    if (!submittedCategories.has(option)) {
      setIsSubmitting(true);
      try {
        await fetch('/api/online-support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber,
            category: option
          })
        });
        setSubmittedCategories(prev => new Set(prev).add(option));
      } catch (err) {
        console.error('Failed to record support action', err);
      } finally {
        setIsSubmitting(false);
      }
    }

    if (option === 'REFERRAL_CODE') {
      setStep('REFERRAL');
    } else if (option === 'DIRECT_CONTACT') {
      setStep('DIRECT_CONTACT');
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setFeedbackError('لطفاً متن پیام یا نظر خود را بنویسید.');
      return;
    }

    setIsSubmitting(true);
    setFeedbackError('');
    try {
      const res = await fetch('/api/online-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          category: 'FEEDBACK',
          message: feedbackText.trim()
        })
      });

      if (!res.ok) {
        throw new Error('خطا در ثبت پیام');
      }

      setSubmittedCategories(prev => new Set(prev).add('FEEDBACK'));
      setStep('FEEDBACK_SUCCESS');
    } catch (err) {
      setFeedbackError('متأسفانه در ثبت پیام مشکلی رخ داد. لطفاً مجدداً تلاش نمایید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToMenuOrPhone = () => {
    if (phoneNumber && validatePhone(phoneNumber)) {
      setStep('MENU');
    } else {
      setStep('PHONE');
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 select-none print:hidden font-sans" dir="rtl">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            if (!phoneNumber) setStep('PHONE');
            else setStep('MENU');
          }}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl hover:shadow-teal-500/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-white/60"
          title="پشتیبانی آنلاین هنرهاب"
          aria-label="پشتیبانی آنلاین"
        >
          {/* Animated pulsing halo */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white"></span>
          </span>

          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 group-hover:rotate-6 transition-transform">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>

          <span className="hidden sm:inline-block font-black text-sm tracking-tight text-white drop-shadow-xs">
            پشتیبانی آنلاین
          </span>
        </button>
      )}

      {/* Support Card / Modal */}
      {isOpen && (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-[92vw] sm:w-[380px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
          {/* Top Header */}
          <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl shrink-0 border border-white/20">
                🎧
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base leading-tight">پشتیبانی آنلاین هنرهاب</h3>
                <p className="text-[11px] text-teal-200/90 mt-0.5 font-medium">همیشه در کنار شما هستیم</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              title="بستن پنجره"
            >
              ✕
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
            
            {/* STEP 1: Phone Input Screen */}
            {step === 'PHONE' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="text-center py-2">
                  <div className="w-14 h-14 mx-auto rounded-3xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center text-2xl mb-3 shadow-xs">
                    📱
                  </div>
                  <h4 className="font-black text-slate-800 text-base mb-1">ورود به پشتیبانی</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    لطفاً شماره موبایل خود را وارد نمایید تا بتوانیم بهتر پاسخگوی شما باشیم:
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    شماره موبایل:
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="09123456789"
                    maxLength={14}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none text-center font-bold text-base tracking-wider text-slate-900 bg-slate-50/50"
                    autoFocus
                  />
                  {phoneError && (
                    <p className="text-xs text-red-600 font-bold mt-1.5 text-center">{phoneError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>ادامه و مشاهده گزینه‌ها</span>
                  <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                </button>
              </form>
            )}

            {/* STEP 2: Main Menu Options */}
            {step === 'MENU' && (
              <div className="space-y-4">
                {/* User Phone chip */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-600">
                  <span className="font-bold flex items-center gap-1.5 text-slate-700">
                    <span>👤</span>
                    <span>شماره شما:</span>
                    <span className="font-mono text-teal-800">{phoneNumber}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('PHONE')}
                    className="text-[11px] font-bold text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    ویرایش شماره
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700 mb-2.5">
                    لطفاً یکی از گزینه‌های زیر را انتخاب نمایید:
                  </p>
                </div>

                {/* 3 Main Menu Buttons (Boxes without descriptions with simple attractive icons) */}
                <div className="space-y-3">
                  {/* Option 1: Referral Code */}
                  <button
                    type="button"
                    onClick={() => handleOptionSelect('REFERRAL_CODE')}
                    disabled={isSubmitting}
                    className="w-full p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-purple-50/40 hover:border-purple-300 text-slate-800 transition-all duration-200 flex items-center justify-between group shadow-xs hover:shadow-md cursor-pointer text-right"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-purple-100 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </span>
                      <span className="font-bold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                        ۱. دریافت کد معرف
                      </span>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:-translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>

                  {/* Option 2: Feedback & Suggestions */}
                  <button
                    type="button"
                    onClick={() => handleOptionSelect('FEEDBACK')}
                    disabled={isSubmitting}
                    className="w-full p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-amber-50/40 hover:border-amber-300 text-slate-800 transition-all duration-200 flex items-center justify-between group shadow-xs hover:shadow-md cursor-pointer text-right"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-100 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          <path d="M8 9h8" />
                          <path d="M8 13h5" />
                        </svg>
                      </span>
                      <span className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                        ۲. انتقادات و پیشنهادات
                      </span>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:-translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>

                  {/* Option 3: Direct Contact */}
                  <button
                    type="button"
                    onClick={() => handleOptionSelect('DIRECT_CONTACT')}
                    disabled={isSubmitting}
                    className="w-full p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-teal-50/40 hover:border-teal-300 text-slate-800 transition-all duration-200 flex items-center justify-between group shadow-xs hover:shadow-md cursor-pointer text-right"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-teal-100 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      <span className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                        ۳. تماس مستقیم با ما
                      </span>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:-translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ACTION 1: Referral Code Telegram Bot */}
            {step === 'REFERRAL' && (
              <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-2xl shadow-xs">
                  <TelegramIcon className="w-8 h-8" />
                </div>
                <h4 className="font-black text-slate-800 text-base">دریافت کد معرف</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  جهت دریافت کد معرف، لطفاً به بات تلگرام هنرهاب به آدرس زیر مراجعه نمایید:
                </p>

                {/* Telegram Bot Link Button */}
                <a
                  href="https://t.me/HonarHubBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98"
                >
                  <TelegramIcon className="w-5 h-5" />
                  <span dir="ltr">@HonarHubBot</span>
                </a>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={resetToMenuOrPhone}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                    <span>بازگشت به منوی گزینه‌ها</span>
                  </button>
                </div>
              </div>
            )}

            {/* ACTION 2: Feedback & Suggestions Form */}
            {step === 'FEEDBACK_FORM' && (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-black text-slate-800 text-sm">انتقادات و پیشنهادات</h4>
                  <span className="text-[11px] text-slate-400 font-medium">شماره: {phoneNumber}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    متن نظر یا پیشنهاد شما:
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="دیدگاه، پیشنهاد یا انتقاد خود را در اینجا بنویسید..."
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none text-xs sm:text-sm text-slate-800 bg-slate-50/50 resize-none font-medium"
                    autoFocus
                  />
                  {feedbackError && (
                    <p className="text-xs text-red-600 font-bold mt-1">{feedbackError}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetToMenuOrPhone}
                    className="w-1/3 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    بازگشت
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <span>در حال ارسال...</span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        <span>ارسال پیام</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ACTION 2 SUCCESS: Thank you screen */}
            {step === 'FEEDBACK_SUCCESS' && (
              <div className="space-y-4 text-center py-4 animate-in fade-in duration-200">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-3xl shadow-xs">
                  ✓
                </div>
                <h4 className="font-black text-slate-800 text-base">پیام شما با موفقیت ثبت شد</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  از اینکه نظرات و پیشنهادات ارزشمند خود را با خانواده هنرهاب در میان گذاشتید صمیمانه سپاسگزاریم. ❤️
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={resetToMenuOrPhone}
                    className="w-full py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors border border-teal-200 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                    <span>بازگشت به منوی گزینه‌ها</span>
                  </button>
                </div>
              </div>
            )}

            {/* ACTION 3: Direct Contact Telegram */}
            {step === 'DIRECT_CONTACT' && (
              <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center text-2xl shadow-xs">
                  <TelegramIcon className="w-8 h-8" />
                </div>
                <h4 className="font-black text-slate-800 text-base">تماس مستقیم با ما</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  متأسفانه در حال حاضر امکان تماس مستقیم تلفنی با ما وجود ندارد، ولی می‌توانید از طریق تلگرام با ما در تماس باشید:
                </p>

                {/* Direct Telegram Link Button */}
                <a
                  href="https://t.me/ranjbar_abbas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98"
                >
                  <TelegramIcon className="w-5 h-5" />
                  <span dir="ltr">@ranjbar_abbas</span>
                </a>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={resetToMenuOrPhone}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                    <span>بازگشت به منوی گزینه‌ها</span>
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

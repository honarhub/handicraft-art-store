'use client';

import React, { useState } from 'react';

export interface SmsSettingsProps {
  initialSettings: {
    isMobileOtpActive?: boolean;
    smsProvider?: string;
    smsIsSandbox?: boolean;
    smsApiKey?: string | null;
    smsSandboxApiKey?: string | null;
    smsTemplateId?: string | null;
    smsOtpParamName?: string;
    smsReferralTemplateId?: string | null;
    smsReferralParamName?: string;
    smsLineNumber?: string | null;
    // FarazSMS
    farazSmsApiKey?: string | null;
    farazSmsLineNumber?: string | null;
    farazSmsPatternCode?: string | null;
    farazSmsOtpParamName?: string;
    farazSmsReferralPatternCode?: string | null;
    farazSmsReferralParamName?: string;
    farazSmsReferralWithNamePatternCode?: string | null;
    farazSmsReferralNameParamName?: string;
    smsReferralWithNameTemplateId?: string | null;
    smsReferralNameParamName?: string;
    // Security & Anti-abuse
    otpResendIntervalSeconds?: number;
    otpMaxPerHourPerPhone?: number;
    otpMaxPerTenMinPerIp?: number;
    otpLockoutMinutes?: number;
    recentOtpLogs?: any[];
  };
  onSave: (updates: any) => Promise<void>;
}

export default function SmsSettingsCard({ initialSettings, onSave }: SmsSettingsProps) {
  // Provider Selection: 'sms.ir' | 'farazsms'
  const [smsProvider, setSmsProvider] = useState<'sms.ir' | 'farazsms'>(
    (initialSettings.smsProvider === 'farazsms' ? 'farazsms' : 'sms.ir')
  );

  // General Status
  const [isMobileOtpActive, setIsMobileOtpActive] = useState(initialSettings.isMobileOtpActive ?? true);

  // SMS.ir states
  const [smsIsSandbox, setSmsIsSandbox] = useState(initialSettings.smsIsSandbox ?? false);
  const [smsApiKey, setSmsApiKey] = useState(initialSettings.smsApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [smsSandboxApiKey, setSmsSandboxApiKey] = useState(initialSettings.smsSandboxApiKey || '');
  const [showSandboxApiKey, setShowSandboxApiKey] = useState(false);
  const [smsTemplateId, setSmsTemplateId] = useState(initialSettings.smsTemplateId || '');
  const [smsOtpParamName, setSmsOtpParamName] = useState(initialSettings.smsOtpParamName || 'Code');
  const [smsReferralTemplateId, setSmsReferralTemplateId] = useState(initialSettings.smsReferralTemplateId || '');
  const [smsReferralParamName, setSmsReferralParamName] = useState(initialSettings.smsReferralParamName || 'Code');
  const [smsLineNumber, setSmsLineNumber] = useState(initialSettings.smsLineNumber || '');

  // FarazSMS states
  const [farazSmsApiKey, setFarazSmsApiKey] = useState(initialSettings.farazSmsApiKey || '');
  const [showFarazApiKey, setShowFarazApiKey] = useState(false);
  const [farazSmsLineNumber, setFarazSmsLineNumber] = useState(initialSettings.farazSmsLineNumber || '');
  const [farazSmsPatternCode, setFarazSmsPatternCode] = useState(initialSettings.farazSmsPatternCode || '');
  const [farazSmsOtpParamName, setFarazSmsOtpParamName] = useState(initialSettings.farazSmsOtpParamName || 'code');
  const [farazSmsReferralPatternCode, setFarazSmsReferralPatternCode] = useState(initialSettings.farazSmsReferralPatternCode || '');
  const [farazSmsReferralParamName, setFarazSmsReferralParamName] = useState(initialSettings.farazSmsReferralParamName || 'code');
  const [farazSmsReferralWithNamePatternCode, setFarazSmsReferralWithNamePatternCode] = useState(initialSettings.farazSmsReferralWithNamePatternCode || '');
  const [farazSmsReferralNameParamName, setFarazSmsReferralNameParamName] = useState(initialSettings.farazSmsReferralNameParamName || 'name');
  const [smsReferralWithNameTemplateId, setSmsReferralWithNameTemplateId] = useState(initialSettings.smsReferralWithNameTemplateId || '');
  const [smsReferralNameParamName, setSmsReferralNameParamName] = useState(initialSettings.smsReferralNameParamName || 'name');

  // Anti-abuse & timing settings
  const [otpResendIntervalSeconds, setOtpResendIntervalSeconds] = useState(initialSettings.otpResendIntervalSeconds ?? 60);
  const [otpMaxPerHourPerPhone, setOtpMaxPerHourPerPhone] = useState(initialSettings.otpMaxPerHourPerPhone ?? 5);
  const [otpMaxPerTenMinPerIp, setOtpMaxPerTenMinPerIp] = useState(initialSettings.otpMaxPerTenMinPerIp ?? 10);
  const [otpLockoutMinutes, setOtpLockoutMinutes] = useState(initialSettings.otpLockoutMinutes ?? 15);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Test states
  const [testPhone, setTestPhone] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  // FarazSMS Balance check state
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [farazBalance, setFarazBalance] = useState<number | null>(null);
  const [balanceMsg, setBalanceMsg] = useState<string | null>(null);

  // Sync state when initialSettings loads asynchronously from API
  React.useEffect(() => {
    if (initialSettings) {
      if (initialSettings.smsProvider !== undefined) {
        setSmsProvider(initialSettings.smsProvider === 'farazsms' ? 'farazsms' : 'sms.ir');
      }
      if (initialSettings.isMobileOtpActive !== undefined) setIsMobileOtpActive(initialSettings.isMobileOtpActive);
      if (initialSettings.smsIsSandbox !== undefined) setSmsIsSandbox(Boolean(initialSettings.smsIsSandbox));
      if (initialSettings.smsApiKey !== undefined) setSmsApiKey(initialSettings.smsApiKey || '');
      if (initialSettings.smsSandboxApiKey !== undefined) setSmsSandboxApiKey(initialSettings.smsSandboxApiKey || '');
      if (initialSettings.smsTemplateId !== undefined) setSmsTemplateId(initialSettings.smsTemplateId || '');
      if (initialSettings.smsOtpParamName !== undefined) setSmsOtpParamName(initialSettings.smsOtpParamName || 'Code');
      if (initialSettings.smsReferralTemplateId !== undefined) setSmsReferralTemplateId(initialSettings.smsReferralTemplateId || '');
      if (initialSettings.smsReferralParamName !== undefined) setSmsReferralParamName(initialSettings.smsReferralParamName || 'Code');
      if (initialSettings.smsReferralWithNameTemplateId !== undefined) setSmsReferralWithNameTemplateId(initialSettings.smsReferralWithNameTemplateId || '');
      if (initialSettings.smsReferralNameParamName !== undefined) setSmsReferralNameParamName(initialSettings.smsReferralNameParamName || 'name');
      if (initialSettings.smsLineNumber !== undefined) setSmsLineNumber(initialSettings.smsLineNumber || '');

      // FarazSMS
      if (initialSettings.farazSmsApiKey !== undefined) setFarazSmsApiKey(initialSettings.farazSmsApiKey || '');
      if (initialSettings.farazSmsLineNumber !== undefined) setFarazSmsLineNumber(initialSettings.farazSmsLineNumber || '');
      if (initialSettings.farazSmsPatternCode !== undefined) setFarazSmsPatternCode(initialSettings.farazSmsPatternCode || '');
      if (initialSettings.farazSmsOtpParamName !== undefined) setFarazSmsOtpParamName(initialSettings.farazSmsOtpParamName || 'code');
      if (initialSettings.farazSmsReferralPatternCode !== undefined) setFarazSmsReferralPatternCode(initialSettings.farazSmsReferralPatternCode || '');
      if (initialSettings.farazSmsReferralParamName !== undefined) setFarazSmsReferralParamName(initialSettings.farazSmsReferralParamName || 'code');
      if (initialSettings.farazSmsReferralWithNamePatternCode !== undefined) setFarazSmsReferralWithNamePatternCode(initialSettings.farazSmsReferralWithNamePatternCode || '');
      if (initialSettings.farazSmsReferralNameParamName !== undefined) setFarazSmsReferralNameParamName(initialSettings.farazSmsReferralNameParamName || 'name');

      // Limits
      if (initialSettings.otpResendIntervalSeconds !== undefined) setOtpResendIntervalSeconds(initialSettings.otpResendIntervalSeconds);
      if (initialSettings.otpMaxPerHourPerPhone !== undefined) setOtpMaxPerHourPerPhone(initialSettings.otpMaxPerHourPerPhone);
      if (initialSettings.otpMaxPerTenMinPerIp !== undefined) setOtpMaxPerTenMinPerIp(initialSettings.otpMaxPerTenMinPerIp);
      if (initialSettings.otpLockoutMinutes !== undefined) setOtpLockoutMinutes(initialSettings.otpLockoutMinutes);
    }
  }, [initialSettings]);

  // Standard eye toggle icon
  const renderEyeIcon = (shown: boolean) => {
    if (shown) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  };

  // Save handler
  const handleSaveSmsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await onSave({
        smsProvider,
        isMobileOtpActive,
        // SMS.ir
        smsIsSandbox,
        smsApiKey,
        smsSandboxApiKey,
        smsTemplateId,
        smsOtpParamName,
        smsReferralTemplateId,
        smsReferralParamName,
        smsReferralWithNameTemplateId,
        smsReferralNameParamName,
        smsLineNumber,
        // FarazSMS
        farazSmsApiKey,
        farazSmsLineNumber,
        farazSmsPatternCode,
        farazSmsOtpParamName,
        farazSmsReferralPatternCode,
        farazSmsReferralParamName,
        farazSmsReferralWithNamePatternCode,
        farazSmsReferralNameParamName,
        // Rate limits
        otpResendIntervalSeconds: Number(otpResendIntervalSeconds),
        otpMaxPerHourPerPhone: Number(otpMaxPerHourPerPhone),
        otpMaxPerTenMinPerIp: Number(otpMaxPerTenMinPerIp),
        otpLockoutMinutes: Number(otpLockoutMinutes)
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch {
      alert('خطا در ذخیره تنظیمات پیامک');
    } finally {
      setSaving(false);
    }
  };

  // Live test SMS
  const handleRunTest = async () => {
    if (!testPhone.trim()) {
      alert('لطفاً شماره موبایل تستی را وارد کنید.');
      return;
    }

    if (smsProvider === 'sms.ir') {
      const activeKeyToTest = smsIsSandbox ? smsSandboxApiKey.trim() : smsApiKey.trim();
      if (!activeKeyToTest) {
        alert(`کلید اختصاصی مربوط به حالت ${smsIsSandbox ? 'سندباکس' : 'عملیاتی'} هنوز وارد نشده است.`);
        return;
      }
    } else {
      if (!farazSmsApiKey.trim()) {
        alert('کلید Api-Key فراز اس‌ام‌اس هنوز وارد نشده است.');
        return;
      }
      if (!farazSmsLineNumber.trim()) {
        alert('شماره خط فرستنده فراز اس‌ام‌اس هنوز وارد نشده است.');
        return;
      }
      if (!farazSmsPatternCode.trim()) {
        alert('کد الگوی فراز اس‌ام‌اس وارد نشده است.');
        return;
      }
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const payload: any = {
        provider: smsProvider,
        phone: testPhone.trim()
      };

      if (smsProvider === 'sms.ir') {
        payload.apiKey = smsIsSandbox ? smsSandboxApiKey.trim() : smsApiKey.trim();
        payload.templateId = smsTemplateId.trim();
        payload.paramName = smsOtpParamName.trim();
      } else {
        payload.farazApiKey = farazSmsApiKey.trim();
        payload.farazLineNumber = farazSmsLineNumber.trim();
        payload.farazPatternCode = farazSmsPatternCode.trim();
        payload.farazOtpParamName = farazSmsOtpParamName.trim();
      }

      const res = await fetch('/api/admin/settings/sms-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'پیامک اعتبارسنجی با موفقیت ارسال شد.',
          data: data.data
        });
        if (data.data?.balance !== undefined) {
          setFarazBalance(data.data.balance);
        }
      } else {
        setTestResult({
          success: false,
          message: data.error || 'خطا در ارسال پیامک تستی.'
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'خطا در برقراری ارتباط با سرور.'
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Check FarazSMS Account Balance
  const handleCheckFarazBalance = async () => {
    const key = farazSmsApiKey.trim();
    if (!key) {
      alert('لطفاً ابتدا کلید Api-Key فراز اس‌ام‌اس را وارد کنید.');
      return;
    }

    setBalanceLoading(true);
    setBalanceMsg(null);

    try {
      const res = await fetch('/api/admin/settings/sms-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_balance',
          farazApiKey: key
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFarazBalance(data.balance);
        const countText = data.balanceCount !== undefined ? ` (~${Number(data.balanceCount).toLocaleString('fa-IR')} پیامک)` : '';
        setBalanceMsg(data.message || `موجودی حساب: ${Number(data.balance).toLocaleString('fa-IR')} ریال${countText}`);
      } else {
        setFarazBalance(null);
        setBalanceMsg(`❌ خطا: ${data.error || 'عدم دسترسی به مانده حساب'}`);
      }
    } catch {
      setBalanceMsg('❌ خطا در برقراری ارتباط با سرور.');
    } finally {
      setBalanceLoading(false);
    }
  };

  const isSmsIrConfigured = Boolean(smsApiKey.trim() && smsTemplateId.trim());
  const isFarazConfigured = Boolean(farazSmsApiKey.trim() && farazSmsLineNumber.trim() && farazSmsPatternCode.trim());
  const isCurrentProviderConfigured = smsProvider === 'sms.ir' ? isSmsIrConfigured : isFarazConfigured;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mt-8 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0">
            📱
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg font-black text-slate-800">سامانه پیامک و رمز یکبار مصرف (SMS & OTP)</h3>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                isMobileOtpActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {isMobileOtpActive ? 'سرویس فعال' : 'سرویس متوقف'}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                !isCurrentProviderConfigured
                  ? 'bg-slate-100 text-slate-600'
                  : (smsProvider === 'sms.ir' && smsIsSandbox)
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {!isCurrentProviderConfigured
                  ? '🧪 شبیه‌ساز آفلاین (Mock)'
                  : (smsProvider === 'sms.ir' && smsIsSandbox)
                  ? '🟡 سندباکس SMS.ir'
                  : `⚡ عملیاتی زنده (${smsProvider === 'farazsms' ? 'فراز اس‌ام‌اس' : 'SMS.ir'})`}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
              انتخاب و پیکربندی هم‌زمان سامانه‌های پیامک (SMS.ir و فراز اس‌ام‌اس / ایران‌پیامک)، الگوهای ارسال سریع OTP، دعوت‌نامه و دیواره آتش ضد حمله.
            </p>
          </div>
        </div>

        {/* Emergency Kill-Switch Toggle */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">کلید قطع اضطراری:</span>
          <button
            type="button"
            dir="ltr"
            onClick={() => setIsMobileOtpActive(!isMobileOtpActive)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isMobileOtpActive ? 'bg-emerald-600' : 'bg-red-500'
            }`}
            title={isMobileOtpActive ? 'غیرفعال کردن ارسال پیامک' : 'فعال کردن ارسال پیامک'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isMobileOtpActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {!isMobileOtpActive && (
        <div className="mt-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-bold flex items-center gap-2">
          <span>⚠️</span>
          <span>
            سرویس پیامک موقتاً غیرفعال شده است. کاربران در فرم‌های ورود و ثبت‌نام پیام راهنما برای استفاده از «ایمیل» یا «ورود با رمز عبور» دریافت خواهند کرد.
          </span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSmsSettings} className="mt-6 space-y-6">
        
        {/* ==================== PROVIDER SELECTOR ==================== */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
              <span>📡 انتخاب سرویس‌دهنده پیامک فعال:</span>
            </label>
            <span className="text-[11px] text-slate-500 font-sans">
              سرویس انتخابی برای ارسال کدهای OTP و دعوت‌نامه‌ها استفاده خواهد شد
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provider 1: SMS.ir */}
            <button
              type="button"
              onClick={() => setSmsProvider('sms.ir')}
              className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3.5 cursor-pointer ${
                smsProvider === 'sms.ir'
                  ? 'bg-blue-50/70 border-blue-400 text-blue-950 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                smsProvider === 'sms.ir' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                📨
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-xs sm:text-sm flex items-center justify-between gap-1.5">
                  <span>سامانه SMS.ir (ایده‌پردازان)</span>
                  {smsProvider === 'sms.ir' && (
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      فعال در سیستم
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  ارسال سریع بر اساس شناسه عددی قالب (Template ID) با احراز هویت اختصاصی x-api-key و پشتیبانی از سندباکس.
                </p>
              </div>
            </button>

            {/* Provider 2: FarazSMS */}
            <button
              type="button"
              onClick={() => setSmsProvider('farazsms')}
              className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3.5 cursor-pointer ${
                smsProvider === 'farazsms'
                  ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                smsProvider === 'farazsms' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                ⚡
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-xs sm:text-sm flex items-center justify-between gap-1.5">
                  <span>سامانه فراز اس‌ام‌اس (FarazSMS / IPPanel)</span>
                  {smsProvider === 'farazsms' && (
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      فعال در سیستم
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  وب‌سرویس پترن ایران‌پیامک و فراز اس‌ام‌اس بر اساس مستندات docs.iranpayamak.com با سرعت بالا و عبور از بلک‌لیست.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ==================== PROVIDER CONFIG: FARAZSMS ==================== */}
        {smsProvider === 'farazsms' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
                  <span>⚡ پیکربندی اختصاصی فراز اس‌ام‌اس (IranPayamak API)</span>
                </h4>
                <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                  مستندات وب‌سرویس پترن: <a href="https://docs.iranpayamak.com/" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-900" dir="ltr">https://docs.iranpayamak.com/</a>
                </p>
              </div>

              {/* Balance Check Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCheckFarazBalance}
                  disabled={balanceLoading || !farazSmsApiKey.trim()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {balanceLoading ? (
                    <span>در حال استعلام...</span>
                  ) : (
                    <>
                      <span>💰 استعلام موجودی شارژ</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {balanceMsg && (
              <div className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-wrap items-center justify-between gap-2 ${
                farazBalance !== null && !isNaN(farazBalance) ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{farazBalance !== null && !isNaN(farazBalance) ? '✅' : '⚠️'}</span>
                  <span>{balanceMsg}</span>
                </div>
                {farazBalance !== null && !isNaN(farazBalance) && (
                  <span className="font-mono text-emerald-800 text-[11px] bg-emerald-100/70 px-2.5 py-1 rounded-lg" dir="ltr">
                    {Number(farazBalance).toLocaleString()} Rials
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Faraz API Key */}
              <div className="md:col-span-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>🔑 کلید وب‌سرویس (<span className="font-mono text-emerald-700" dir="ltr">Api-Key</span>)</span>
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-sans font-bold">الزامی</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-sans">پنل فراز اس‌ام‌اس &gt; توسعه‌دهندگان &gt; کلید دسترسی</span>
                </div>
                <div className="relative">
                  <input
                    type={showFarazApiKey ? 'text' : 'password'}
                    dir="ltr"
                    value={farazSmsApiKey}
                    onChange={(e) => setFarazSmsApiKey(e.target.value)}
                    placeholder="کلید API صادر شده از بخش کلید دسترسی پنل فراز اس‌ام‌اس..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFarazApiKey(!showFarazApiKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                    title={showFarazApiKey ? 'مخفی کردن کلید' : 'نمایش کلید'}
                  >
                    {renderEyeIcon(showFarazApiKey)}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  این کلید در هدر <span className="font-mono font-bold" dir="ltr">Api-Key</span> به آدرس <span className="font-mono text-slate-600" dir="ltr">https://api.iranpayamak.com/ws/v1/sms/pattern</span> ارسال می‌شود.
                </p>
              </div>

              {/* Faraz Sender Line Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره خط فرستنده اختصاصی (<span className="font-mono text-emerald-700" dir="ltr">line_number</span>)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={farazSmsLineNumber}
                  onChange={(e) => setFarazSmsLineNumber(e.target.value)}
                  placeholder="مثال: 3000505 یا 5000..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  شماره خط خدماتی یا اختصاصی فعال در پنل شما که ارسال پترن از طریق آن انجام می‌شود.
                </p>
              </div>

              {/* Faraz OTP Pattern Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  کد الگوی اعتبارسنجی OTP (<span className="font-mono text-emerald-700" dir="ltr">code</span>)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={farazSmsPatternCode}
                  onChange={(e) => setFarazSmsPatternCode(e.target.value.trim())}
                  placeholder="مثال: SJ3FgPrE0C"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  کد اختصاصی الگوی تایید شده برای ارسال کد ورود و ثبت‌نام در بخش «ارسال بر اساس پترن».
                </p>
              </div>

              {/* Faraz OTP Param Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام متغیر کد در الگوی OTP
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={farazSmsOtpParamName}
                  onChange={(e) => setFarazSmsOtpParamName(e.target.value.trim())}
                  placeholder="code"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  نام متغیری که در متن پترن تعریف کرده‌اید (پیش‌فرض: <span className="font-mono font-bold">code</span>).
                </p>
              </div>

              {/* Faraz Referral Pattern Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  کد الگوی پیامک دعوت‌نامه با کد معرف (اختیاری)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={farazSmsReferralPatternCode}
                  onChange={(e) => setFarazSmsReferralPatternCode(e.target.value.trim())}
                  placeholder="مثال: X7K9L2M1Q"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  کد الگوی تایید شده جهت ارسال دعوت‌نامه. در صورت خالی بودن، از پترن پیش‌فرض کد استفاده می‌شود.
                </p>
              </div>

              {/* Faraz Referral Param Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام متغیر کد در الگوی دعوت‌نامه
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={farazSmsReferralParamName}
                  onChange={(e) => setFarazSmsReferralParamName(e.target.value.trim())}
                  placeholder="code"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  نام متغیر جایگزین شونده با کد معرف در متن دعوت‌نامه (پیش‌فرض: <span className="font-mono font-bold">code</span>).
                </p>
              </div>

              {/* Faraz Referral With Name Pattern Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الگوی پیامک دعوت نامه با نام (اختیاری)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={farazSmsReferralWithNamePatternCode}
                  onChange={(e) => setFarazSmsReferralWithNamePatternCode(e.target.value.trim())}
                  placeholder="مثال: 9VK1P8QX2M"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  کد الگوی تایید شده برای دعوت‌نامه با نام هنرمند. در صورت وارد کردن نام هنرمند در صدور آنی، از این پترن استفاده می‌شود.
                </p>
              </div>

              {/* Faraz Referral Name Param Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام متغیر «نام هنرمند» در الگو
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={farazSmsReferralNameParamName}
                  onChange={(e) => setFarazSmsReferralNameParamName(e.target.value.trim())}
                  placeholder="name"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  نام متغیری که در متن پترن برای نام هنرمند تعریف کرده‌اید (پیش‌فرض: <span className="font-mono font-bold">name</span>).
                </p>
              </div>
            </div>

            {/* Template Help Guide for FarazSMS */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-2">
              <div className="font-black text-slate-800 flex items-center gap-1.5">
                <span>💡 راهنمای ثبت پترن در پنل فراز اس‌ام‌اس:</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                در پنل فراز اس‌ام‌اس از منوی <strong>ارسال بر اساس پترن &gt; ثبت الگوی جدید</strong>، می‌توانید الگوهای مورد نظر را با ساختار نمونه زیر ثبت کنید:
              </p>
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700">۱. نمونه الگوی کد اعتبارسنجی (OTP) یا دعوت‌نامه بدون نام:</div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-[12px] text-slate-800 select-all" dir="rtl">
                  کد تایید شما در هنرهاب: %code%
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-slate-700">۲. نمونه الگوی پیامک دعوت‌نامه با نام هنرمند:</div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-[12px] text-slate-800 select-all" dir="rtl">
                  %name% عزیز، شما به هنرهاب دعوت شده‌اید. کد معرف اختصاصی شما: %code%
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                پس از تایید هر الگو توسط ناظر سامانه، شناسه چند کاراکتری انگلیسی آن (مثلاً <span className="font-mono font-bold">SJ3FgPrE0C</span>) را در فیلد مربوطه قرار دهید.
              </p>
            </div>
          </div>
        )}

        {/* ==================== PROVIDER CONFIG: SMS.IR ==================== */}
        {smsProvider === 'sms.ir' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Environment Mode Selector */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <label className="block text-xs font-black text-slate-800 mb-2">
                محیط وب‌سرویس SMS.ir:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSmsIsSandbox(false)}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                    !smsIsSandbox
                      ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl shrink-0 mt-0.5">🚀</span>
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>محیط عملیاتی (Production)</span>
                      {!smsIsSandbox && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-sans">انتخاب‌شده</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      پیامک واقعی به تلفن همراه کاربر ارسال می‌شود. هیچ کدی روی کنسول یا صفحه نمایش داده نمی‌شود.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSmsIsSandbox(true)}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                    smsIsSandbox
                      ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl shrink-0 mt-0.5">🧪</span>
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>محیط سندباکس تستی (SMS.ir Sandbox)</span>
                      {smsIsSandbox && <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-sans">انتخاب‌شده</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      وب‌سرویس sms.ir واقعی فراخوانی و اعتبارسنجی می‌شود اما پیامک مخابراتی ارسال نمی‌شود. کد دریافتی صرفاً روی لوکال‌هاست نمایش داده می‌شود.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Production API Key */}
              <div className="md:col-span-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>🚀 کلید API عملیاتی (<span className="font-mono text-blue-700" dir="ltr">x-api-key</span>)</span>
                    {!smsIsSandbox && (
                      <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-sans font-bold">
                        کلید فعال فعلی
                      </span>
                    )}
                  </label>
                  <span className="text-[11px] text-slate-400 font-sans">مخصوص ارسال پیامک واقعی به کاربران</span>
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    dir="ltr"
                    value={smsApiKey}
                    onChange={(e) => setSmsApiKey(e.target.value)}
                    placeholder="کلید عملیاتی اصلی صادر شده از sms.ir..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                    title={showApiKey ? 'مخفی کردن کلید' : 'نمایش کلید'}
                  >
                    {renderEyeIcon(showApiKey)}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  این کلید در زمان انتخاب «محیط عملیاتی» به طور خودکار جهت ارسال پیامک واقعی استفاده می‌شود.
                </p>
              </div>

              {/* Sandbox API Key */}
              <div className="md:col-span-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>🧪 کلید API سندباکس تستی (<span className="font-mono text-amber-700" dir="ltr">x-api-key</span>)</span>
                    {smsIsSandbox && (
                      <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-sans font-bold">
                        کلید فعال فعلی
                      </span>
                    )}
                  </label>
                  <span className="text-[11px] text-slate-400 font-sans">مخصوص تست اتصال بدون ارسال پیامک</span>
                </div>
                <div className="relative">
                  <input
                    type={showSandboxApiKey ? 'text' : 'password'}
                    dir="ltr"
                    value={smsSandboxApiKey}
                    onChange={(e) => setSmsSandboxApiKey(e.target.value)}
                    placeholder="کلید سندباکس (تستی) صادر شده از sms.ir..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSandboxApiKey(!showSandboxApiKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                    title={showSandboxApiKey ? 'مخفی کردن کلید' : 'نمایش کلید'}
                  >
                    {renderEyeIcon(showSandboxApiKey)}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  این کلید در زمان انتخاب «محیط سندباکس تستی» به طور خودکار جهت آزمایش اتصال وب‌سرویس استفاده می‌شود.
                </p>
              </div>

              {/* Template ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شناسه قالب ارسال سریع (Template ID)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={smsTemplateId}
                  onChange={(e) => setSmsTemplateId(e.target.value.replace(/\D/g, ''))}
                  placeholder="مثال: 100234"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  شناسه عددی قالب اعتبارسنجی تایید شده در بخش «ارسال سریع» پنل sms.ir.
                </p>
              </div>

              {/* Parameter Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام متغیر کد در قالب
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={smsOtpParamName}
                  onChange={(e) => setSmsOtpParamName(e.target.value)}
                  placeholder="Code"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  نام متغیری که در متن قالب خود قرار داده‌اید (پیش‌فرض: <span className="font-mono font-bold">Code</span>).
                </p>
              </div>

              {/* Referral SMS Template ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شناسه قالب پیامک دعوت‌نامه با کد معرف (اختیاری)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={smsReferralTemplateId}
                  onChange={(e) => setSmsReferralTemplateId(e.target.value.replace(/\D/g, ''))}
                  placeholder="مثال: 100555"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  شناسه قالب ارسال سریع برای دعوت هنرمندان با کد معرف. در صورت خالی بودن، از قالب پیش‌فرض ارسال کد استفاده خواهد شد.
                </p>
              </div>

              {/* Referral SMS Parameter Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام متغیر کد معرف در قالب
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={smsReferralParamName}
                  onChange={(e) => setSmsReferralParamName(e.target.value)}
                  placeholder="Code"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  نام متغیر کد معرف در قالب (پیش‌فرض: <span className="font-mono font-bold">Code</span>).
                </p>
              </div>

              {/* Referral SMS With Name Template ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  قالب پیامک دعوت‌نامه با نام هنرمند (اختیاری)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={smsReferralWithNameTemplateId}
                  onChange={(e) => setSmsReferralWithNameTemplateId(e.target.value.replace(/\D/g, ''))}
                  placeholder="مثال: 100666"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  شناسه قالب پیامک دعوت با نام هنرمند در صورت وارد کردن نام در صدور آنی.
                </p>
              </div>

              {/* Referral SMS Name Param Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام متغیر «نام هنرمند» در قالب sms.ir
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={smsReferralNameParamName}
                  onChange={(e) => setSmsReferralNameParamName(e.target.value)}
                  placeholder="name"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  نام پارامتر نام در قالب sms.ir (پیش‌فرض: <span className="font-mono font-bold">name</span>).
                </p>
              </div>

              {/* Dedicated Line Number */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره خط اختصاصی فرستنده (اختیاری)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={smsLineNumber}
                  onChange={(e) => setSmsLineNumber(e.target.value)}
                  placeholder="مثال: 30007777 یا 9999..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  فقط در صورت ارسال پیامک‌های عادی انبوه کاربرد دارد؛ در ارسال سریع OTP نیازی به خط اختصاصی نیست.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SECURITY & ANTI-ABUSE SETTINGS ==================== */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <h4 className="text-sm font-black text-slate-800">دیواره آتش و محدودیت‌های ضدحمله (Anti-Flooding & Abuse)</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            تنظیم پارامترهای دفاعی جهت مقابله با حملات تخلیه شارژ پنل پیامکی (SMS Toll Fraud) و ارسال‌های رگباری ربات‌ها:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                فاصله ارسال مجدد (ثانیه)
              </label>
              <input
                type="number"
                dir="ltr"
                min={10}
                max={300}
                value={otpResendIntervalSeconds}
                onChange={(e) => setOtpResendIntervalSeconds(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-sm focus:border-amber-500 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">پیش‌فرض: ۶۰ ثانیه</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                سقف پیامک به یک شماره در ساعت
              </label>
              <input
                type="number"
                dir="ltr"
                min={1}
                max={50}
                value={otpMaxPerHourPerPhone}
                onChange={(e) => setOtpMaxPerHourPerPhone(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-sm focus:border-amber-500 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">پیش‌فرض: ۵ درخواست</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                سقف کل از هر IP در ۱۰ دقیقه
              </label>
              <input
                type="number"
                dir="ltr"
                min={3}
                max={100}
                value={otpMaxPerTenMinPerIp}
                onChange={(e) => setOtpMaxPerTenMinPerIp(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-sm focus:border-amber-500 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">ضد حمله رگباری ربات‌ها (پیش‌فرض: ۱۰)</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                مدت مسدودسازی IP متخلف (دقیقه)
              </label>
              <input
                type="number"
                dir="ltr"
                min={1}
                max={1440}
                value={otpLockoutMinutes}
                onChange={(e) => setOtpLockoutMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-sm focus:border-amber-500 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">پیش‌فرض: ۱۵ دقیقه</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              ✓ تنظیمات سامانه پیامک با موفقیت ذخیره شد
            </span>
          ) : <div />}

          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-md shadow-emerald-200 transition-all disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات پیامک'}
          </button>
        </div>
      </form>

      {/* ==================== LIVE TEST BOX ==================== */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🧪</span>
            <h4 className="text-sm font-black text-slate-800">تست زنده اتصال و ارسال پیامک اعتبارسنجی</h4>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            smsProvider === 'farazsms'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              : smsIsSandbox
              ? 'bg-amber-100 text-amber-900 border border-amber-200'
              : 'bg-blue-100 text-blue-900 border border-blue-200'
          }`}>
            سرویس فعال برای تست: {
              smsProvider === 'farazsms'
                ? '🟢 سامانه فراز اس‌ام‌اس'
                : smsIsSandbox
                ? '🟡 کلید سندباکس SMS.ir'
                : '🔵 کلید عملیاتی SMS.ir'
            }
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          برای اطمینان از صحت کلید API، شماره خط و شناسه الگو، یک شماره موبایل وارد کنید تا یک کد تستی به‌صورت آنی ارسال و نتیجه آزمایش شود:
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            dir="ltr"
            placeholder="09123456789"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-800 bg-white"
          />
          <button
            type="button"
            onClick={handleRunTest}
            disabled={testLoading || !testPhone.trim()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {testLoading ? 'در حال تست و ارسال...' : `ارسال تست از طریق ${smsProvider === 'farazsms' ? 'فراز اس‌ام‌اس' : 'SMS.ir'}`}
          </button>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-2xl border text-xs leading-relaxed ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <div className="flex items-center gap-2 font-black mb-1">
              <span>{testResult.success ? '✅ نتیجه تست موفق بود:' : '❌ خطا در ارسال تست:'}</span>
              <span>{testResult.message}</span>
            </div>
            {testResult.data && (
              <div className="mt-2 pt-2 border-t border-emerald-200 flex flex-wrap gap-4 text-[11px] font-mono text-emerald-800" dir="ltr">
                {testResult.data.provider && <span>Provider: {testResult.data.provider}</span>}
                {testResult.data.messageId && <span>MessageId / Ref: {testResult.data.messageId}</span>}
                {testResult.data.cost && <span>Cost: {testResult.data.cost} SMS</span>}
                {testResult.data.testCode && <span>Code: {testResult.data.testCode}</span>}
                {testResult.data.receptor && <span>Receptor: {testResult.data.receptor}</span>}
                {testResult.data.balance !== undefined && <span>Credit Balance: {Number(testResult.data.balance).toLocaleString()} Rials</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== RECENT SECURITY LOGS ==================== */}
      {initialSettings.recentOtpLogs && initialSettings.recentOtpLogs.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <h4 className="text-sm font-black text-slate-800">آخرین لاگ‌های امنیتی و تلاش‌های ارسال OTP</h4>
            </div>
            <span className="text-[11px] text-slate-400 font-bold">نمایش ۲۰ رخداد اخیر</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">زمان</th>
                  <th className="py-2.5 px-3">آدرس IP</th>
                  <th className="py-2.5 px-3">شماره / ایمیل</th>
                  <th className="py-2.5 px-3">نوع درخواست</th>
                  <th className="py-2.5 px-3">وضعیت امنیتی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialSettings.recentOtpLogs.map((log: any) => {
                  const isSuccess = log.status === 'SENT';
                  const isFlood = log.status === 'BLOCKED_IP_FLOOD';
                  const isPhoneCap = log.status === 'BLOCKED_PHONE_CAP';
                  const isCooldown = log.status === 'BLOCKED_COOLDOWN';
                  const isDisabled = log.status === 'DISABLED';

                  let badgeColor = 'bg-slate-100 text-slate-700';
                  let statusTitle = log.status;

                  if (isSuccess) {
                    badgeColor = 'bg-emerald-100 text-emerald-800';
                    statusTitle = '✓ ارسال موفق';
                  } else if (isFlood) {
                    badgeColor = 'bg-red-100 text-red-800';
                    statusTitle = '🚨 مسدودیت حمله رگباری (IP Flood)';
                  } else if (isPhoneCap) {
                    badgeColor = 'bg-amber-100 text-amber-800';
                    statusTitle = 'سقف شماره پر شد';
                  } else if (isCooldown) {
                    badgeColor = 'bg-blue-100 text-blue-800';
                    statusTitle = 'فاصله زمانی نامعتبر';
                  } else if (isDisabled) {
                    badgeColor = 'bg-gray-100 text-gray-700';
                    statusTitle = 'سرویس غیرفعال';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]" dir="ltr">
                        {new Date(log.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700 text-[11px]" dir="ltr">
                        {log.ip}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 text-[11px]" dir="ltr">
                        {log.target}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {log.type}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                          {statusTitle}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

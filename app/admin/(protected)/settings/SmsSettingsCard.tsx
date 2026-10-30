'use client';

import React, { useState } from 'react';

export interface SmsSettingsProps {
  initialSettings: {
    isMobileOtpActive?: boolean;
    smsIsSandbox?: boolean;
    smsApiKey?: string | null;
    smsTemplateId?: string | null;
    smsOtpParamName?: string;
    smsLineNumber?: string | null;
    otpResendIntervalSeconds?: number;
    otpMaxPerHourPerPhone?: number;
    otpMaxPerTenMinPerIp?: number;
    otpLockoutMinutes?: number;
    recentOtpLogs?: any[];
  };
  onSave: (updates: any) => Promise<void>;
}

export default function SmsSettingsCard({ initialSettings, onSave }: SmsSettingsProps) {
  // Form states
  const [isMobileOtpActive, setIsMobileOtpActive] = useState(initialSettings.isMobileOtpActive ?? true);
  const [smsIsSandbox, setSmsIsSandbox] = useState(initialSettings.smsIsSandbox ?? false);
  const [smsApiKey, setSmsApiKey] = useState(initialSettings.smsApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [smsTemplateId, setSmsTemplateId] = useState(initialSettings.smsTemplateId || '');
  const [smsOtpParamName, setSmsOtpParamName] = useState(initialSettings.smsOtpParamName || 'Code');
  const [smsLineNumber, setSmsLineNumber] = useState(initialSettings.smsLineNumber || '');

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

  // Sync state when initialSettings loads asynchronously from API
  React.useEffect(() => {
    if (initialSettings) {
      if (initialSettings.isMobileOtpActive !== undefined) setIsMobileOtpActive(initialSettings.isMobileOtpActive);
      if (initialSettings.smsIsSandbox !== undefined) setSmsIsSandbox(Boolean(initialSettings.smsIsSandbox));
      if (initialSettings.smsApiKey !== undefined) setSmsApiKey(initialSettings.smsApiKey || '');
      if (initialSettings.smsTemplateId !== undefined) setSmsTemplateId(initialSettings.smsTemplateId || '');
      if (initialSettings.smsOtpParamName !== undefined) setSmsOtpParamName(initialSettings.smsOtpParamName || 'Code');
      if (initialSettings.smsLineNumber !== undefined) setSmsLineNumber(initialSettings.smsLineNumber || '');
      if (initialSettings.otpResendIntervalSeconds !== undefined) setOtpResendIntervalSeconds(initialSettings.otpResendIntervalSeconds);
      if (initialSettings.otpMaxPerHourPerPhone !== undefined) setOtpMaxPerHourPerPhone(initialSettings.otpMaxPerHourPerPhone);
      if (initialSettings.otpMaxPerTenMinPerIp !== undefined) setOtpMaxPerTenMinPerIp(initialSettings.otpMaxPerTenMinPerIp);
      if (initialSettings.otpLockoutMinutes !== undefined) setOtpLockoutMinutes(initialSettings.otpLockoutMinutes);
    }
  }, [initialSettings]);

  // Save handler
  const handleSaveSmsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await onSave({
        isMobileOtpActive,
        smsIsSandbox,
        smsApiKey,
        smsTemplateId,
        smsOtpParamName,
        smsLineNumber,
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
    setTestLoading(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/settings/sms-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone.trim(),
          apiKey: smsApiKey.trim(),
          templateId: smsTemplateId.trim(),
          paramName: smsOtpParamName.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'پیامک اعتبارسنجی با موفقیت ارسال شد.',
          data: data.data
        });
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

  const isConfigured = Boolean(smsApiKey.trim() && smsTemplateId.trim());

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
              <h3 className="text-lg font-black text-slate-800">سامانه پیامک و رمز یکبار مصرف (SMS.ir)</h3>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                isMobileOtpActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {isMobileOtpActive ? 'سرویس فعال' : 'سرویس متوقف'}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                !isConfigured
                  ? 'bg-slate-100 text-slate-600'
                  : smsIsSandbox
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {!isConfigured ? '🧪 شبیه‌ساز آفلاین (Mock)' : smsIsSandbox ? '🟡 سندباکس SMS.ir' : '⚡ عملیاتی زنده'}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
              مدیریت وب‌سرویس پیامکی sms.ir، تعیین کلید اتصال، فاصله‌های زمانی و اعمال دیواره آتش امنیتی در برابر حملات رگباری به OTP.
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
        {/* Environment Mode Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <label className="block text-xs font-black text-slate-800 mb-2">
            محیط وب‌سرویس پیامک:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSmsIsSandbox(false)}
              className={`p-3 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                !smsIsSandbox
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl shrink-0 mt-0.5">🚀</span>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>محیط عملیاتی (Production)</span>
                  {!smsIsSandbox && <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-sans">انتخاب‌شده</span>}
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
          {/* API Key */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              کلید اختصاصی API پنل sms.ir (<span className="font-mono text-emerald-700" dir="ltr">x-api-key</span>)
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                dir="ltr"
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                placeholder="مثال: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer text-xs font-bold"
              >
                {showApiKey ? 'مخفی‌سازی' : 'نمایش'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              کلید دسترسی را از بخش «تنظیمات برنامه‌نویسان / API Keys» در پنل کاربری سامانه sms.ir کپی و در این کادر قرار دهید.
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
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-800"
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
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              نام متغیری که در متن قالب خود قرار داده‌اید (پیش‌فرض: <span className="font-mono font-bold">Code</span>).
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
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-mono text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              فقط در صورت ارسال پیامک‌های عادی انبوه یا اطلاع‌رسانی‌ها کاربرد دارد؛ در ارسال سریع OTP نیازی به خط اختصاصی نیست.
            </p>
          </div>
        </div>

        {/* Security & Anti-abuse Settings Box */}
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
              ✓ تنظیمات پیامک با موفقیت ذخیره شد
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

      {/* Live Test Box */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">🧪</span>
          <h4 className="text-sm font-black text-slate-800">تست زنده اتصال و ارسال پیامک اعتبارسنجی</h4>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          برای اطمینان از صحت کلید API و شناسه قالب، یک شماره موبایل وارد کنید تا یک کد تستی به‌صورت آنی ارسال و نتیجه اتصال آزمایش شود:
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
            {testLoading ? 'در حال تست و ارسال...' : 'ارسال پیامک تستی'}
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
                {testResult.data.messageId && <span>MessageId: {testResult.data.messageId}</span>}
                {testResult.data.cost && <span>Cost: {testResult.data.cost} SMS</span>}
                {testResult.data.testCode && <span>Code: {testResult.data.testCode}</span>}
                {testResult.data.receptor && <span>Receptor: {testResult.data.receptor}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Security Logs */}
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
